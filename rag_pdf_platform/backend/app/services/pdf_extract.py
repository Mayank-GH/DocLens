"""PDF text extraction helpers."""

from pathlib import Path

from PyPDF2 import PdfReader


def extract_pages_text(pdf_path: Path) -> list[tuple[int, str]]:
    """Extract plain text for each PDF page as (page_number, text)."""

    reader = PdfReader(str(pdf_path))
    pages: list[tuple[int, str]] = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        pages.append((i + 1, text))
    return pages
