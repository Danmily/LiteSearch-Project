from pathlib import Path

from fastapi import APIRouter

from app.ingestion.pipeline import DEFAULT_INDEX_PATH, build_index
from app.models.local_llm import get_generation_model
from app.observability.tracing import traced_stage
from app.retrieval.vector_retriever import _load_index, vector_search

router = APIRouter()

RECOMMEND_PROMPT = """你是一位经验丰富的花艺师,说话具体、有画面感,不用客套模板。用户的需求:"{query}"

候选花材(含学名、花语与适用场景):

{context}

搭配参考(花艺理论,供组织配色与结构时借鉴):

{knowledge}

请从候选花材中挑选,给出一套花束方案,按下面的结构写,总共不超过 250 字:
【主花】选 1 种,一句话说为什么它扣题(引用它的花语)
【配花/配叶】选 1-2 种,说明它们和主花的色彩或质感关系(可参考 60-30-10 的比例思路)
【一句寄语】以这束花的花语为核心,写一句可以抄在贺卡上的话

规则:只能从候选花材中选,不要编造;不要以"推荐您"开头;语气像面对面聊天。"""


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/search")
def search(q: str, top_k: int = 5) -> dict:
    results = vector_search(q, top_k=top_k)
    return {"query": q, "results": results}


@router.get("/recommend")
def recommend(q: str, top_k: int = 5) -> dict:
    # 一次向量召回,按语料子目录拆成花材路与理论路
    hits = vector_search(q, top_k=top_k + 8)
    candidates = [h for h in hits if "/flowers/" in h["source_path"]][:top_k]
    knowledge_hits = [h for h in hits if "/knowledge/" in h["source_path"]][:1]

    context = "\n\n---\n\n".join(c["text"] for c in candidates)
    knowledge = knowledge_hits[0]["text"] if knowledge_hits else "(无)"
    prompt = RECOMMEND_PROMPT.format(query=q, context=context, knowledge=knowledge)
    with traced_stage("llm_generate"):
        recommendation = get_generation_model().generate(prompt, max_tokens=512)
    return {"query": q, "recommendation": recommendation, "candidates": candidates}


CRITIQUE_PROMPT = """你是一位眼光敏锐但语气温柔的花艺老师。学生刚在瓶里插好一束花,用料:{arrangement}

相关花材资料(含花语):

{context}

花艺理论参考:

{knowledge}

请写一段点评,不超过 160 字:先说这瓶花给你的整体感觉(自然地引用其中一两种花的花语),再从色彩比例或形态结构的角度给一个具体的小建议(可参考 60-30-10 或主花/配花思路),最后一句轻轻鼓励。像课后闲聊,不要打分,不要分条列点。"""


@router.get("/critique")
def critique(q: str) -> dict:
    hits = vector_search(q.replace("x", " "), top_k=12)
    flower_hits = [h for h in hits if "/flowers/" in h["source_path"]][:4]
    knowledge_hits = [h for h in hits if "/knowledge/" in h["source_path"]]
    if not knowledge_hits:
        knowledge_hits = [h for h in vector_search("花束配色 比例 主花", top_k=6)
                          if "/knowledge/" in h["source_path"]]
    context = "\n\n---\n\n".join(c["text"] for c in flower_hits)
    knowledge = knowledge_hits[0]["text"] if knowledge_hits else "(无)"
    prompt = CRITIQUE_PROMPT.format(arrangement=q, context=context, knowledge=knowledge)
    with traced_stage("llm_generate"):
        comment = get_generation_model().generate(prompt, max_tokens=400)
    return {"arrangement": q, "critique": comment}


@router.post("/ingest")
def ingest(corpus_dir: str) -> dict:
    store = build_index(Path(corpus_dir), index_path=DEFAULT_INDEX_PATH)
    _load_index.cache_clear()
    return {"chunks_indexed": len(store), "index_path": str(DEFAULT_INDEX_PATH)}
