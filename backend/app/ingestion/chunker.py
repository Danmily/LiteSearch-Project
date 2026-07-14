def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]

    chunks: list[str] = []
    current = ""
    for para in paragraphs:
        if len(current) + len(para) + 2 <= chunk_size:
            current = f"{current}\n\n{para}" if current else para
            continue

        if current:
            chunks.append(current)
        if len(para) <= chunk_size:
            current = para
        else:
            for i in range(0, len(para), chunk_size - overlap):
                chunks.append(para[i : i + chunk_size])
            current = ""

    if current:
        chunks.append(current)

    return chunks
