import json
from datetime import UTC, datetime
from pathlib import Path

BADCASE_LOG_PATH = Path(__file__).resolve().parents[2] / "eval" / "badcases" / "badcases.jsonl"


def log_badcase(
    *,
    trace_id: str,
    query: str,
    subtask: str,
    reason: str,
    attempt: int,
    candidate_flowers: list[str],
    mismatched_flowers: list[str] | None = None,
    judge_reason: str | None = None,
    composer_output: str = "",
) -> None:
    record = {
        "schema_version": 1,
        "timestamp": datetime.now(UTC).isoformat(),
        "trace_id": trace_id,
        "query": query,
        "subtask": subtask,
        "reason": reason,
        "attempt": attempt,
        "candidate_flowers": candidate_flowers,
        "mismatched_flowers": mismatched_flowers or [],
        "judge_reason": judge_reason,
        "composer_output": composer_output,
    }
    BADCASE_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(BADCASE_LOG_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
