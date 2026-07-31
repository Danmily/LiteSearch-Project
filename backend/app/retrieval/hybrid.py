from app.observability.tracing import traced_stage
from app.retrieval.keyword_retriever import keyword_search
from app.retrieval.vector_retriever import vector_search

# Standard RRF constant (Cormack et al., 2009) — dampens the impact of any
# single ranker's rank-1 hit dominating the fused order.
RRF_K = 60


def hybrid_search(query: str, top_k: int = 5, recall_k: int = 20) -> list[dict]:
    vector_hits = vector_search(query, top_k=recall_k)
    keyword_hits = keyword_search(query, top_k=recall_k)

    with traced_stage("rrf_fuse"):
        scores: dict[tuple[str, str], float] = {}
        payload: dict[tuple[str, str], dict] = {}
        for ranked_list in (vector_hits, keyword_hits):
            for rank, hit in enumerate(ranked_list):
                key = (hit["doc_id"], hit["text"])
                scores[key] = scores.get(key, 0.0) + 1.0 / (RRF_K + rank + 1)
                payload.setdefault(key, hit)

        ranked_keys = sorted(scores, key=lambda k: scores[k], reverse=True)[:top_k]
        results = []
        for key in ranked_keys:
            hit = dict(payload[key])
            # Vector cosine similarity and BM25 are different, non-comparable
            # scales — the RRF score (purely rank-based) replaces whichever
            # single-source score the hit originally carried.
            hit["score"] = scores[key]
            results.append(hit)
    return results
