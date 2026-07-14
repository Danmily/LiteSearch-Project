from pathlib import Path

from app.ingestion.chunker import chunk_text
from app.ingestion.index_store import ChunkRecord, IndexStore
from app.ingestion.loader import iter_documents
from app.models.local_embedding import get_embedding_model

DEFAULT_INDEX_PATH = Path(__file__).resolve().parents[2] / "data" / "index"


def build_index(corpus_dir: Path, index_path: Path = DEFAULT_INDEX_PATH) -> IndexStore:
    embedding_model = get_embedding_model()

    chunk_id = 0
    all_chunks: list[str] = []
    all_records: list[ChunkRecord] = []
    for doc in iter_documents(corpus_dir):
        for chunk in chunk_text(doc.text):
            all_records.append(
                ChunkRecord(
                    chunk_id=chunk_id,
                    doc_id=doc.doc_id,
                    source_path=doc.source_path,
                    text=chunk,
                )
            )
            all_chunks.append(chunk)
            chunk_id += 1

    if not all_chunks:
        raise ValueError(f"No supported documents found under {corpus_dir}")

    vectors = embedding_model.embed(all_chunks)
    dim = len(vectors[0])

    store = IndexStore(dim=dim)
    store.add(vectors, all_records)
    store.save(index_path)
    return store
