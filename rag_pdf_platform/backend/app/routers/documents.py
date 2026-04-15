"""Document upload/list/get/delete API routes."""

import logging
import time
import uuid
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.config import UPLOADS_DIR, settings
from app.database import get_db
from app.models import Document
from app.schemas import DocumentListResponse, DocumentOut, UploadResponse
from app.services import chroma_store
from app.services.ingest import ingest_pdf_file

router = APIRouter()
MAX_BYTES = 50 * 1024 * 1024
logger = logging.getLogger(__name__)


def _run_ingest(doc_id: str) -> None:
    """Background task: fetch row by id and run ingestion pipeline."""

    from app.database import SessionLocal

    db = SessionLocal()
    try:
        row = db.get(Document, doc_id)
        if row:
            ingest_pdf_file(db, row)
    finally:
        db.close()


def _cleanup_document_assets(doc_id: str, file_path: str) -> None:
    """Background cleanup: remove vector rows and on-disk PDF file."""

    for attempt in range(1, settings.cleanup_retry_attempts + 1):
        try:
            chroma_store.delete_doc_chunks(doc_id)
            break
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "Vector cleanup failed for doc_id=%s (attempt %s/%s): %s",
                doc_id,
                attempt,
                settings.cleanup_retry_attempts,
                exc,
            )
            if attempt < settings.cleanup_retry_attempts:
                time.sleep(settings.cleanup_retry_delay_seconds)
            else:
                logger.error("Giving up vector cleanup for doc_id=%s", doc_id)

    path = Path(file_path)
    if not path.exists():
        return
    for attempt in range(1, settings.cleanup_retry_attempts + 1):
        try:
            path.unlink(missing_ok=True)
            break
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "File cleanup failed for doc_id=%s path=%s (attempt %s/%s): %s",
                doc_id,
                file_path,
                attempt,
                settings.cleanup_retry_attempts,
                exc,
            )
            if attempt < settings.cleanup_retry_attempts:
                time.sleep(settings.cleanup_retry_delay_seconds)
            else:
                logger.error("Giving up file cleanup for doc_id=%s path=%s", doc_id, file_path)


@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload a PDF, create DB row, and enqueue background ingestion."""

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    doc_id = str(uuid.uuid4())
    safe_name = Path(file.filename).name
    dest = UPLOADS_DIR / f"{doc_id}.pdf"

    size = 0
    with dest.open("wb") as buf:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            if size > MAX_BYTES:
                buf.close()
                dest.unlink(missing_ok=True)
                raise HTTPException(status_code=400, detail="File exceeds 50MB limit.")
            buf.write(chunk)

    row = Document(
        id=doc_id,
        filename=safe_name,
        file_path=str(dest),
        status="processing",
        size_bytes=size,
    )
    db.add(row)
    db.commit()
    background_tasks.add_task(_run_ingest, doc_id)
    return UploadResponse(doc_id=doc_id)


@router.get("/", response_model=DocumentListResponse)
def list_documents(db: Session = Depends(get_db)):
    """Return all documents ordered by newest first."""

    rows = db.query(Document).order_by(Document.created_at.desc()).all()
    return DocumentListResponse(documents=[DocumentOut.from_doc(r) for r in rows])


@router.get("/{doc_id}", response_model=DocumentOut)
def get_document(doc_id: str, db: Session = Depends(get_db)):
    """Return metadata for a single document by id."""

    row = db.get(Document, doc_id)
    if not row:
        raise HTTPException(status_code=404, detail="Document not found.")
    return DocumentOut.from_doc(row)


@router.delete("/{doc_id}", status_code=204)
def delete_document(
    doc_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Delete a document's DB row, file, and vector-store chunks."""

    row = db.get(Document, doc_id)
    if not row:
        raise HTTPException(status_code=404, detail="Document not found.")
    file_path = row.file_path
    db.delete(row)
    db.commit()
    # Heavy cleanup is deferred so API returns quickly for better UX.
    background_tasks.add_task(_cleanup_document_assets, doc_id, file_path)
    return None
