from datetime import datetime
from typing import Any

from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str
    content: str


class DocumentOut(BaseModel):
    id: str
    filename: str
    status: str
    created_at: datetime
    size: int
    pages: int
    chunks: int

    @classmethod
    def from_doc(cls, d: Any) -> "DocumentOut":
        return cls(
            id=d.id,
            filename=d.filename,
            status=d.status,
            created_at=d.created_at,
            size=d.size_bytes,
            pages=d.page_count,
            chunks=d.chunk_count,
        )


class DocumentListResponse(BaseModel):
    documents: list[DocumentOut]


class UploadResponse(BaseModel):
    doc_id: str


class ChatRequest(BaseModel):
    doc_id: str
    query: str
    history: list[ChatMessage] = []
    api_key: str = ""


class CitationOut(BaseModel):
    source_num: int
    page: int
    score: float
    text: str


class ChatResponse(BaseModel):
    answer: str
    citations: list[CitationOut]
    chunks_used: int


class CompareAnalyzeRequest(BaseModel):
    doc_id_a: str
    doc_id_b: str
    api_key: str = ""


class CompareDocLabel(BaseModel):
    filename: str


class KeyDiffItem(BaseModel):
    topic: str
    doc_a: str
    doc_b: str


class AnalysisBlock(BaseModel):
    summary: str
    common_themes: list[str] = []
    key_differences: list[KeyDiffItem] = []
    contradictions: list[KeyDiffItem] = []
    recommendation: str = ""


class CompareAnalyzeResponse(BaseModel):
    doc_a: CompareDocLabel
    doc_b: CompareDocLabel
    analysis: AnalysisBlock


class CompareQueryRequest(BaseModel):
    doc_id_a: str
    doc_id_b: str
    query: str
    api_key: str = ""


class CompareQueryResponse(BaseModel):
    answer: str
