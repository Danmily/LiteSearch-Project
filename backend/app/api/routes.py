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


@router.post("/ingest")
def ingest(corpus_dir: str) -> dict:
    store = build_index(Path(corpus_dir), index_path=DEFAULT_INDEX_PATH)
    _load_index.cache_clear()
    return {"chunks_indexed": len(store), "index_path": str(DEFAULT_INDEX_PATH)}
