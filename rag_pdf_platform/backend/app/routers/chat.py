from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Document
from app.schemas import ChatRequest, ChatResponse
from app.services import rag

router = APIRouter()


@router.post("/", response_model=ChatResponse)
def chat(req: ChatRequest, db: Session = Depends(get_db)):
    if not (req.api_key or "").strip():
        raise HTTPException(status_code=400, detail="Groq API key is required. Add it in Settings.")
    row = db.get(Document, req.doc_id)
    if not row:
        raise HTTPException(status_code=404, detail="Document not found.")
    if row.status != "ready":
        raise HTTPException(
            status_code=400,
            detail=f"Document is not ready (status: {row.status}).",
        )
    try:
        return rag.answer_for_doc(req.api_key.strip(), req.doc_id, req.query, req.history)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"LLM request failed: {e!s}") from e
