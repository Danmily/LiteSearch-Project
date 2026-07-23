import json
import queue
import re
import threading
from collections.abc import Iterator

from app.agent.badcase import log_badcase
from app.agent.harness import AgentTurn, run_agent
from app.models.local_llm import get_generation_model
from app.observability.tracing import start_trace, traced_stage
from app.retrieval.vector_retriever import vector_search

MAX_SUBTASKS = 3
MAX_COMPOSE_ATTEMPTS = 2
TOP_K_FLOWERS = 6

SUBTASK_RE = re.compile(r"【子任务\d+】\s*(.+)")
NAME_LINE_RE = re.compile(r"^#\s*(.+)")
HUAYU_RE = re.compile(r"\*\*花语\*\*[:：]\s*(.+)")
NAME_SPLIT_RE = re.compile(r"[,,、]")

PLANNER_PROMPT = """你是花艺工作室的需求策划师,负责把顾客的完整需求拆解成一份份独立的配花任务。

例如顾客说"给妈妈和女朋友各配一束不同风格的花,预算共500":
【子任务1】给妈妈:温馨淡雅风格,预算约250元
【子任务2】给女朋友:浪漫精致风格,预算约250元

如果顾客只提到一个收件人、一个场合(没有"各""分别""两束"这类多份信号),就只写一行,把需求原样归纳成一句话,不要强行拆分,例如顾客说"想送朋友一束元气的花":
【子任务1】送朋友,元气开朗风格

现在请处理顾客的这句话,只输出子任务本身(不要输出上面的例子),最多 3 个:"{query}\""""

COMPOSER_PROMPT = """你是花艺师,为这个子任务设计一束花:"{subtask}"
{used_note}
候选花材(含学名、花语与适用场景):

{context}

花艺理论参考(不必都用,合适再引):

{knowledge}
{correction}
请按格式输出:
【花束名】4-8字,诗意,不要用"之恋""物语"这类滥俗后缀
【介绍】80-120字商品文案,把花语编织进画面感描述里
【花材清单】逗号分隔,列出上面文案中实际提到的每一种花材的准确名称,只能是候选花材里出现过的名字,一个都不能编"""

JUDGE_PROMPT = """你是审稿人,只看这段文案是否贴合顾客的这个子任务,不用管花材是否真实(那部分已经用程序检查过了)。

子任务需求:"{subtask}"
文案:"{blurb}"

请按格式输出:
【判定】通过 或 不通过
【理由】一句话,不超过30字"""


def _event(payload: dict) -> str:
    return json.dumps(payload, ensure_ascii=False) + "\n"


def _normalize(s: str) -> str:
    return re.sub(r"\s+", "", s)


def split_names(text: str) -> list[str]:
    return [n.strip() for n in NAME_SPLIT_RE.split(text) if n.strip()]


def extract_name(doc_text: str) -> str:
    first_line = doc_text.split("\n", 1)[0]
    m = NAME_LINE_RE.match(first_line)
    return m.group(1).strip() if m else first_line.strip()


DEGENERATE_SUBTASK_RE = re.compile(r"^[.…\s]*$")  # bare "...", "…", or whitespace: template echo, not content


def plan_subtasks(query: str) -> tuple[list[str], bool]:
    with traced_stage("agent:planner"):
        raw = get_generation_model().generate(PLANNER_PROMPT.format(query=query), max_tokens=220)
    candidates = [s.strip() for s in SUBTASK_RE.findall(raw)]
    subtasks = [s for s in candidates if len(s) >= 4 and not DEGENERATE_SUBTASK_RE.match(s)]
    if not subtasks:
        return [query], False
    truncated = len(subtasks) > MAX_SUBTASKS
    return subtasks[:MAX_SUBTASKS], truncated


def retrieve_for_subtask(subtask: str) -> tuple[list[dict], str]:
    hits = vector_search(subtask, top_k=TOP_K_FLOWERS + 8)
    flower_hits = [h for h in hits if "/flowers/" in h["source_path"]][:TOP_K_FLOWERS]
    knowledge_hits = [h for h in hits if "/knowledge/" in h["source_path"]]
    if not knowledge_hits:
        knowledge_hits = [
            h for h in vector_search("花束配色 比例 主花", top_k=6) if "/knowledge/" in h["source_path"]
        ]
    knowledge_text = knowledge_hits[0]["text"] if knowledge_hits else "(无)"
    return flower_hits, knowledge_text


def grounding_check(listed_names: list[str], candidate_names: list[str]) -> list[str]:
    norm_candidates = [_normalize(c) for c in candidate_names]
    mismatched = []
    for name in listed_names:
        n = _normalize(name)
        if not n:
            continue
        if not any(n == c or n in c or c in n for c in norm_candidates):
            mismatched.append(name)
    return mismatched


def compose_subtask(
    subtask: str,
    candidates: list[dict],
    knowledge_text: str,
    used_flowers: list[str],
    correction: str = "",
) -> AgentTurn:
    context = "\n\n---\n\n".join(c["text"] for c in candidates)
    used_note = (
        f"\n(其它子任务已经用过:{'、'.join(used_flowers)},这一束尽量换一批花材,呈现不同风格)\n"
        if used_flowers
        else ""
    )
    prompt = COMPOSER_PROMPT.format(
        subtask=subtask, used_note=used_note, context=context, knowledge=knowledge_text, correction=correction
    )
    return run_agent("composer", prompt, tags=["花束名", "介绍", "花材清单"], max_tokens=400)


def run_verifier_judge(subtask: str, blurb: str) -> AgentTurn:
    prompt = JUDGE_PROMPT.format(subtask=subtask, blurb=blurb)
    return run_agent("verifier_judge", prompt, tags=["判定", "理由"], max_tokens=120)


def fallback_draft(candidates: list[dict], used_flowers: list[str] | None = None) -> dict:
    used_norm = {_normalize(u) for u in (used_flowers or [])}
    top = next(
        (c for c in candidates if _normalize(extract_name(c["text"])) not in used_norm),
        candidates[0],
    )
    name = extract_name(top["text"])
    huayu_match = HUAYU_RE.search(top["text"])
    huayu = huayu_match.group(1).strip() if huayu_match else "美好心意"
    return {
        "name": f"{name}一束",
        "blurb": f"这一次,想用{name}把「{huayu}」的心意送到你手上。",
        "flowers": [name],
    }


def run_pipeline(query: str) -> Iterator[str]:
    """Streams pipeline events to the caller.

    Starlette iterates a plain sync generator by submitting each next() call to
    the threadpool separately (`iterate_in_threadpool`), and each submission
    forks a fresh copy of the calling contextvars context. That means a Trace
    started via `start_trace()` inside a generator body would only be visible
    to `traced_stage()` calls made before the *first* yield — everything after
    silently loses the trace. To keep the whole request's Trace coherent, the
    actual pipeline (`_run_pipeline_events`) runs to completion in one
    dedicated background thread — a single unbroken context — and this
    function just relays its output through a queue.
    """
    events: queue.Queue = queue.Queue()
    done = object()

    def worker() -> None:
        try:
            for event in _run_pipeline_events(query):
                events.put(event)
        finally:
            events.put(done)

    threading.Thread(target=worker, daemon=True).start()
    while True:
        item = events.get()
        if item is done:
            break
        yield item


def _run_pipeline_events(query: str) -> Iterator[str]:
    trace = start_trace(route="/plan", query=query)
    status = "ok"
    try:
        subtasks, truncated = plan_subtasks(query)
        yield _event(
            {"type": "step", "agent": "planner", "summary": f"拆成 {len(subtasks)} 个子任务", "subtasks": subtasks}
        )

        used_flowers: list[str] = []

        for idx, subtask in enumerate(subtasks, start=1):
            candidates, knowledge_text = retrieve_for_subtask(subtask)
            candidate_names = [extract_name(c["text"]) for c in candidates]

            if not candidates:
                yield _event(
                    {"type": "step", "agent": "composer", "subtask_index": idx, "summary": "候选花材为空,跳过"}
                )
                yield _event(
                    {
                        "type": "result",
                        "subtask_index": idx,
                        "brief": subtask,
                        "name": "暂无合适花材",
                        "blurb": "语料库里没有匹配这个需求的花材,建议换个说法试试。",
                        "flowers": [],
                        "grounded": False,
                        "judge_passed": None,
                        "attempts": 0,
                    }
                )
                continue

            draft: AgentTurn | None = None
            mismatched: list[str] = []
            grounded = False
            correction = ""
            attempt = 0

            for attempt in range(1, MAX_COMPOSE_ATTEMPTS + 1):
                yield _event(
                    {
                        "type": "step",
                        "agent": "composer",
                        "subtask_index": idx,
                        "attempt": attempt,
                        "summary": "生成初稿" if attempt == 1 else "根据校验结果重写",
                    }
                )
                draft = compose_subtask(subtask, candidates, knowledge_text, used_flowers, correction)

                if not draft.ok:
                    mismatched = ["(输出格式解析失败)"]
                else:
                    listed = split_names(draft.parsed.get("花材清单", ""))
                    mismatched = grounding_check(listed, candidate_names)

                if draft.ok and not mismatched:
                    grounded = True
                    yield _event(
                        {
                            "type": "step",
                            "agent": "verifier",
                            "subtask_index": idx,
                            "check": "grounding",
                            "passed": True,
                            "summary": "花材清单核对通过",
                        }
                    )
                    break

                reason = "grounding_mismatch" if draft.ok else "parse_failure"
                summary = (
                    f"发现编造:{'、'.join(mismatched)},打回重写" if draft.ok else "输出格式解析失败,打回重写"
                )
                yield _event(
                    {
                        "type": "step",
                        "agent": "verifier",
                        "subtask_index": idx,
                        "check": "grounding",
                        "passed": False,
                        "summary": summary,
                    }
                )
                log_badcase(
                    trace_id=trace.trace_id,
                    query=query,
                    subtask=subtask,
                    reason=reason,
                    attempt=attempt,
                    candidate_flowers=candidate_names,
                    mismatched_flowers=mismatched,
                    composer_output=draft.raw_output,
                )
                correction = (
                    f"\n上一次你写到了候选里没有的花材:{'、'.join(mismatched)},"
                    "这次必须严格只用候选花材清单里出现过的名字,并按要求的格式输出三个标签。\n"
                )

            if grounded and draft is not None:
                flowers = split_names(draft.parsed.get("花材清单", ""))
                result = {
                    "name": draft.parsed.get("花束名", "无题花束"),
                    "blurb": draft.parsed.get("介绍", draft.raw_output),
                    "flowers": flowers,
                }
                attempts_used = attempt
            else:
                log_badcase(
                    trace_id=trace.trace_id,
                    query=query,
                    subtask=subtask,
                    reason="verify_exhausted",
                    attempt=MAX_COMPOSE_ATTEMPTS,
                    candidate_flowers=candidate_names,
                    mismatched_flowers=mismatched,
                    composer_output=draft.raw_output if draft else "",
                )
                yield _event(
                    {
                        "type": "step",
                        "agent": "verifier",
                        "subtask_index": idx,
                        "check": "grounding",
                        "passed": False,
                        "summary": "重试次数用尽,改用保底方案(不再调用模型)",
                    }
                )
                result = fallback_draft(candidates, used_flowers)
                attempts_used = MAX_COMPOSE_ATTEMPTS

            used_flowers.extend(result["flowers"])

            judge_passed = None
            if grounded:
                judge = run_verifier_judge(subtask, result["blurb"])
                if judge.ok:
                    judge_passed = judge.parsed.get("判定") == "通过"
                    yield _event(
                        {
                            "type": "step",
                            "agent": "verifier",
                            "subtask_index": idx,
                            "check": "judge",
                            "passed": judge_passed,
                            "summary": judge.parsed.get("理由", ""),
                        }
                    )
                    if not judge_passed:
                        log_badcase(
                            trace_id=trace.trace_id,
                            query=query,
                            subtask=subtask,
                            reason="judge_reject",
                            attempt=attempts_used,
                            candidate_flowers=candidate_names,
                            judge_reason=judge.parsed.get("理由"),
                            composer_output=draft.raw_output if draft else "",
                        )

            yield _event(
                {
                    "type": "result",
                    "subtask_index": idx,
                    "brief": subtask,
                    "name": result["name"],
                    "blurb": result["blurb"],
                    "flowers": result["flowers"],
                    "grounded": grounded,
                    "judge_passed": judge_passed,
                    "attempts": attempts_used,
                }
            )

        yield _event({"type": "done", "truncated": truncated})
    except Exception:
        status = "error"
        raise
    finally:
        trace.finish(status=status)
