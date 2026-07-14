from functools import lru_cache

from app.ingestion.index_store import IndexStore
from app.ingestion.pipeline import DEFAULT_INDEX_PATH
from app.models.local_embedding import get_embedding_model
from app.observability.tracing import traced_stage


@lru_cache(maxsize=1)
def _load_index() -> IndexStore:
    return IndexStore.load(DEFAULT_INDEX_PATH)


def vector_search(query: str, top_k: int = 5) -> list[dict]:
    with traced_stage("embed_query"):
        query_vector = get_embedding_model().embed([query])[0]

    with traced_stage("vector_recall"):
        store = _load_index()
        hits = store.search(query_vector, top_k)

    return [
        {
            "doc_id": record.doc_id,
            "source_path": record.source_path,
            "text": record.text,
            "score": score,
        }
        for record, score in hits
    ]
