import sqlite3
from functools import lru_cache
from pathlib import Path

from app.ingestion.index_store import ChunkRecord
from app.ingestion.pipeline import DEFAULT_INDEX_PATH
from app.observability.tracing import traced_stage

FTS_PATH = DEFAULT_INDEX_PATH / "fts5.db"

# Chinese has no whitespace between words, so a standard term tokenizer can't
# segment it without a dedicated word-segmentation dependency (e.g. jieba).
# The trigram tokenizer sidesteps that entirely: it indexes every overlapping
# 3-character window, so matching becomes "how many 3-char windows does the
# query share with this chunk" — a query never needs to hit a whole indexed
# term, just overlap with substrings of it. This is SQLite's own recommended
# approach for full-text search over CJK text without a segmenter.
MIN_TRIGRAM_LEN = 3


def build_fts_index(records: list[ChunkRecord], path: Path = FTS_PATH) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        path.unlink()
    conn = sqlite3.connect(path)
    try:
        conn.execute(
            "CREATE VIRTUAL TABLE chunks USING fts5("
            "doc_id UNINDEXED, source_path UNINDEXED, text, tokenize='trigram')"
        )
        conn.executemany(
            "INSERT INTO chunks(rowid, doc_id, source_path, text) VALUES (?, ?, ?, ?)",
            [(r.chunk_id, r.doc_id, r.source_path, r.text) for r in records],
        )
        conn.commit()
    finally:
        conn.close()


@lru_cache(maxsize=1)
def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(FTS_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _trigram_match_expr(query: str) -> str | None:
    grams = {query[i : i + 3] for i in range(len(query) - MIN_TRIGRAM_LEN + 1)}
    grams.discard('"')
    if not grams:
        return None
    return " OR ".join(f'"{g}"' for g in grams)


def keyword_search(query: str, top_k: int = 5) -> list[dict]:
    q = query.strip()
    if not q:
        return []

    with traced_stage("keyword_recall"):
        conn = _connect()
        match_expr = _trigram_match_expr(q)
        if match_expr is not None:
            rows = conn.execute(
                "SELECT doc_id, source_path, text, bm25(chunks) AS rank "
                "FROM chunks WHERE chunks MATCH ? ORDER BY bm25(chunks) LIMIT ?",
                (match_expr, top_k),
            ).fetchall()
            # bm25() is more-negative-is-better; flip sign so higher is
            # better, matching vector_search's score convention.
            hits = [
                {"doc_id": r["doc_id"], "source_path": r["source_path"], "text": r["text"], "score": -r["rank"]}
                for r in rows
            ]
        else:
            # Query is shorter than one trigram (e.g. a 2-char flower name)
            # — fall back to a plain substring scan, which is cheap at this
            # corpus size and still gives exact hits for short terms.
            rows = conn.execute(
                "SELECT doc_id, source_path, text FROM chunks WHERE text LIKE ? LIMIT ?",
                (f"%{q}%", top_k),
            ).fetchall()
            hits = [
                {"doc_id": r["doc_id"], "source_path": r["source_path"], "text": r["text"], "score": 1.0}
                for r in rows
            ]
    return hits
