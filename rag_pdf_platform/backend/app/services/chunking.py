"""Chunking utilities used during PDF ingestion."""

from app.config import settings


def chunk_page_text(page_num: int, text: str) -> list[tuple[str, int]]:
    """Split one page into overlapping character windows.

    Returns tuples of (chunk_text, page_number).
    """

    text = text.strip()
    if not text:
        return []
    size = settings.chunk_size
    overlap = settings.chunk_overlap
    chunks: list[tuple[str, int]] = []
    start = 0
    n = len(text)
    while start < n:
        end = min(start + size, n)
        piece = text[start:end].strip()
        if piece:
            chunks.append((piece, page_num))
        if end >= n:
            break
        start = max(end - overlap, start + 1)
    return chunks
