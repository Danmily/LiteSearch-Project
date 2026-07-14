import json
import time
import uuid
from contextlib import contextmanager
from contextvars import ContextVar
from dataclasses import dataclass, field
from pathlib import Path

TRACE_LOG_PATH = Path(__file__).resolve().parents[2] / "data" / "traces.jsonl"

_current_trace: ContextVar["Trace | None"] = ContextVar("_current_trace", default=None)


@dataclass
class Trace:
    trace_id: str
    route: str
    query: str = ""
    started_at: float = field(default_factory=time.monotonic)
    stages: list[dict] = field(default_factory=list)
    meta: dict = field(default_factory=dict)

    def record_stage(self, name: str, duration_ms: float, **extra) -> None:
        self.stages.append({"name": name, "duration_ms": round(duration_ms, 2), **extra})

    def finish(self, status: str = "ok") -> None:
        total_ms = (time.monotonic() - self.started_at) * 1000
        record = {
            "trace_id": self.trace_id,
            "route": self.route,
            "query": self.query,
            "status": status,
            "total_ms": round(total_ms, 2),
            "stages": self.stages,
            **self.meta,
        }
        TRACE_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(TRACE_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")


def start_trace(route: str, query: str = "") -> Trace:
    trace = Trace(trace_id=str(uuid.uuid4()), route=route, query=query)
    _current_trace.set(trace)
    return trace


def get_current_trace() -> Trace | None:
    return _current_trace.get()


@contextmanager
def traced_stage(name: str, **extra):
    start = time.monotonic()
    trace = get_current_trace()
    try:
        yield
    finally:
        duration_ms = (time.monotonic() - start) * 1000
        if trace is not None:
            trace.record_stage(name, duration_ms, **extra)
