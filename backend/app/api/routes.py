from pathlib import Path

from fastapi import APIRouter

from app.ingestion.pipeline import DEFAULT_INDEX_PATH, build_index
from app.models.local_llm import get_generation_model
from app.observability.tracing import traced_stage
from app.retrieval.vector_retriever import _load_index, vector_search

router = APIRouter()

RECOMMEND_PROMPT = """你是一位温柔专业的花艺师。用户的需求是:"{query}"

以下是花材资料库中检索到的候选花材(含花语与适用场景):

{context}

请从候选花材中为用户推荐最合适的花束(可以是单一花材,也可以是 2-3 种花材的搭配组合),要求:
1. 只能从上面的候选花材中选择,不要编造资料库以外的花
2. 说明推荐理由,并写出所选花材的花语
3. 语气亲切自然,不超过 200 字,直接给出推荐,不要重复用户的需求"""


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/search")
def search(q: str, top_k: int = 5) -> dict:
    results = vector_search(q, top_k=top_k)
    return {"query": q, "results": results}


@router.get("/recommend")
def recommend(q: str, top_k: int = 5) -> dict:
    candidates = vector_search(q, top_k=top_k)
    context = "\n\n---\n\n".join(c["text"] for c in candidates)
    prompt = RECOMMEND_PROMPT.format(query=q, context=context)
    with traced_stage("llm_generate"):
        recommendation = get_generation_model().generate(prompt, max_tokens=512)
    return {"query": q, "recommendation": recommendation, "candidates": candidates}


@router.post("/ingest")
def ingest(corpus_dir: str) -> dict:
    store = build_index(Path(corpus_dir), index_path=DEFAULT_INDEX_PATH)
    _load_index.cache_clear()
    return {"chunks_indexed": len(store), "index_path": str(DEFAULT_INDEX_PATH)}
