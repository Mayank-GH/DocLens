"""Background ingestion pipeline for uploaded PDFs."""

from pathlib import Path

from sqlalchemy.orm import Session

from app.models import Document
from app.services import chroma_store
from app.services.chunking import chunk_page_text
from app.services.pdf_extract import extract_pages_text


def ingest_pdf_file(db: Session, doc: Document) -> None:
    """Extract, chunk, and index a PDF, then update document status."""

    path = Path(doc.file_path)
    try:
        pages = extract_pages_text(path)
        doc.page_count = len(pages)
        all_texts: list[str] = []
        all_pages: list[int] = []
        for page_num, text in pages:
            for chunk, p in chunk_page_text(page_num, text):
                all_texts.append(chunk)
                all_pages.append(p)
        if all_texts:
            doc.chunk_count = chroma_store.add_chunks(doc.id, all_texts, all_pages)
        else:
            doc.chunk_count = 0
        doc.status = "ready"
        doc.error_message = None
    except Exception as e:  # noqa: BLE001
        doc.status = "error"
        doc.error_message = str(e)[:2000]
        try:
            chroma_store.delete_doc_chunks(doc.id)
        except Exception:
            pass
    db.commit()
