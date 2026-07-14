from dataclasses import dataclass
from pathlib import Path

from pypdf import PdfReader

SUPPORTED_SUFFIXES = {".md", ".txt", ".pdf"}


@dataclass
class Document:
    doc_id: str
    source_path: str
    text: str


def _load_text_file(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def _load_pdf_file(path: Path) -> str:
    reader = PdfReader(str(path))
    return "\n\n".join(page.extract_text() or "" for page in reader.pages)


def load_document(path: Path) -> Document:
    if path.suffix == ".pdf":
        text = _load_pdf_file(path)
    else:
        text = _load_text_file(path)
    return Document(doc_id=str(path), source_path=str(path), text=text)


def iter_documents(root: Path) -> list[Document]:
    return [
        load_document(p)
        for p in sorted(root.rglob("*"))
        if p.suffix in SUPPORTED_SUFFIXES and p.is_file()
    ]
