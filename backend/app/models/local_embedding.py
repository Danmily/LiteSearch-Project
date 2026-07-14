from functools import lru_cache

from sentence_transformers import SentenceTransformer

from app.models.base import EmbeddingModel

MODEL_NAME = "BAAI/bge-m3"


class LocalEmbeddingModel(EmbeddingModel):
    def __init__(self, model_name: str = MODEL_NAME):
        self._model = SentenceTransformer(model_name)

    def embed(self, texts: list[str]) -> list[list[float]]:
        vectors = self._model.encode(texts, normalize_embeddings=True)
        return vectors.tolist()


@lru_cache(maxsize=1)
def get_embedding_model() -> EmbeddingModel:
    return LocalEmbeddingModel()
