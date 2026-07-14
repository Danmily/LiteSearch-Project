import json
from dataclasses import asdict, dataclass
from pathlib import Path

import faiss
import numpy as np


@dataclass
class ChunkRecord:
    chunk_id: int
    doc_id: str
    source_path: str
    text: str


class IndexStore:
    def __init__(self, dim: int):
        self._index = faiss.IndexFlatIP(dim)
        self._records: list[ChunkRecord] = []

    def add(self, vectors: list[list[float]], records: list[ChunkRecord]) -> None:
        self._index.add(np.array(vectors, dtype="float32"))
        self._records.extend(records)

    def search(self, query_vector: list[float], top_k: int) -> list[tuple[ChunkRecord, float]]:
        query = np.array([query_vector], dtype="float32")
        scores, indices = self._index.search(query, top_k)
        results = []
        for idx, score in zip(indices[0], scores[0]):
            if idx == -1:
                continue
            results.append((self._records[idx], float(score)))
        return results

    def save(self, path: Path) -> None:
        path.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self._index, str(path / "vectors.faiss"))
        with open(path / "records.json", "w", encoding="utf-8") as f:
            json.dump([asdict(r) for r in self._records], f, ensure_ascii=False)

    @classmethod
    def load(cls, path: Path) -> "IndexStore":
        index = faiss.read_index(str(path / "vectors.faiss"))
        store = cls.__new__(cls)
        store._index = index
        with open(path / "records.json", encoding="utf-8") as f:
            store._records = [ChunkRecord(**r) for r in json.load(f)]
        return store

    def __len__(self) -> int:
        return len(self._records)
