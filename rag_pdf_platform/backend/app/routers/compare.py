from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Document
from app.schemas import (
    CompareAnalyzeRequest,
    CompareAnalyzeResponse,
    CompareQueryRequest,
    CompareQueryResponse,
)
from app.services import compare_llm

router = APIRouter()


def _require_key(api_key: str) -> str:
    key = (api_key or "").strip()
    if not key:
        raise HTTPException(status_code=400, detail="Groq API key is required. Add it in Settings.")
    return key


def _require_ready_pair(db: Session, doc_id_a: str, doc_id_b: str) -> tuple[Document, Document]:
    a = db.get(Document, doc_id_a)
    b = db.get(Document, doc_id_b)
    if not a or not b:
        raise HTTPException(status_code=404, detail="One or both documents were not found.")
    if a.status != "ready" or b.status != "ready":
        raise HTTPException(status_code=400, detail="Both documents must be in ready state.")
    return a, b


@router.post("/analyze", response_model=CompareAnalyzeResponse)
def analyze(req: CompareAnalyzeRequest, db: Session = Depends(get_db)):
    api_key = _require_key(req.api_key)
    a, b = _require_ready_pair(db, req.doc_id_a, req.doc_id_b)
    try:
        return compare_llm.analyze_pair(
            api_key,
            a.filename,
            b.filename,
            a.id,
            b.id,
        )
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"LLM request failed: {e!s}") from e


@router.post("/query", response_model=CompareQueryResponse)
def compare_query(req: CompareQueryRequest, db: Session = Depends(get_db)):
    api_key = _require_key(req.api_key)
    a, b = _require_ready_pair(db, req.doc_id_a, req.doc_id_b)
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query must not be empty.")
    try:
        return compare_llm.compare_answer(api_key, a.id, b.id, req.query.strip())
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"LLM request failed: {e!s}") from e
