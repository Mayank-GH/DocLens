import uuid
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.config import UPLOADS_DIR
from app.database import get_db
from app.models import Document
from app.schemas import DocumentListResponse, DocumentOut, UploadResponse
from app.services import chroma_store
from app.services.ingest import ingest_pdf_file

router = APIRouter()
MAX_BYTES = 50 * 1024 * 1024


def _run_ingest(doc_id: str) -> None:
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        row = db.get(Document, doc_id)
        if row:
            ingest_pdf_file(db, row)
    finally:
        db.close()


@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
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
    rows = db.query(Document).order_by(Document.created_at.desc()).all()
    return DocumentListResponse(documents=[DocumentOut.from_doc(r) for r in rows])


@router.get("/{doc_id}", response_model=DocumentOut)
def get_document(doc_id: str, db: Session = Depends(get_db)):
    row = db.get(Document, doc_id)
    if not row:
        raise HTTPException(status_code=404, detail="Document not found.")
    return DocumentOut.from_doc(row)


@router.delete("/{doc_id}", status_code=204)
def delete_document(doc_id: str, db: Session = Depends(get_db)):
    row = db.get(Document, doc_id)
    if not row:
        raise HTTPException(status_code=404, detail="Document not found.")
    try:
        chroma_store.delete_doc_chunks(doc_id)
    except Exception:
        pass
    path = Path(row.file_path)
    if path.exists():
        path.unlink(missing_ok=True)
    db.delete(row)
    db.commit()
    return None
