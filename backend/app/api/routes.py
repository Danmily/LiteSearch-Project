from pathlib import Path

from fastapi import APIRouter

from app.ingestion.pipeline import DEFAULT_INDEX_PATH, build_index
from app.retrieval.vector_retriever import vector_search

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/search")
def search(q: str, top_k: int = 5) -> dict:
    results = vector_search(q, top_k=top_k)
    return {"query": q, "results": results}


@router.post("/ingest")
def ingest(corpus_dir: str) -> dict:
    store = build_index(Path(corpus_dir), index_path=DEFAULT_INDEX_PATH)
    return {"chunks_indexed": len(store), "index_path": str(DEFAULT_INDEX_PATH)}
