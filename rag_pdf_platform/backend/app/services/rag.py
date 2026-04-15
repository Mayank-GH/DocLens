"""Single-document RAG answer composition service."""

from app.config import settings
from app.schemas import ChatMessage, ChatResponse, CitationOut
from app.services import chroma_store
from app.services import groq_client


def _distance_to_score(distance: float) -> float:
    """Convert vector distance to a bounded 0..1 relevance-style score."""

    return max(0.0, min(1.0, 1.0 / (1.0 + float(distance))))


def _is_summary_query(query: str) -> bool:
    """Heuristic to detect broad summarization-style requests."""

    q = query.lower()
    summary_markers = (
        "summary",
        "summarize",
        "summarise",
        "overview",
        "tl;dr",
        "main points",
        "key points",
        "high level",
    )
    return any(marker in q for marker in summary_markers)


def _summary_k_for_doc(page_count: int | None) -> int:
    """Pick summary retrieval depth based on document size."""

    if page_count and page_count >= settings.summary_long_doc_page_threshold:
        return settings.summary_retrieval_k_long
    return settings.summary_retrieval_k_short


def answer_for_doc(
    api_key: str,
    doc_id: str,
    query: str,
    history: list[ChatMessage],
    page_count: int | None = None,
) -> ChatResponse:
    """Retrieve chunks for one document and ask the LLM for grounded answer."""

    is_summary = _is_summary_query(query)
    k = _summary_k_for_doc(page_count) if is_summary else settings.retrieval_k
    hits = chroma_store.query_doc(doc_id, query, k)
    context_blocks = []
    for i, h in enumerate(hits, start=1):
        context_blocks.append(f"[Source {i}, page {h['page']}]\n{h['text']}")
    context = "\n\n".join(context_blocks) if context_blocks else "(No retrieved passages.)"

    if is_summary:
        sys = (
            "You are a document analyst. Use ONLY the provided context from the PDF. "
            "Produce a high-quality summary with these sections in markdown: "
            "1) Executive Summary (3-6 bullets), "
            "2) Key Findings, "
            "3) Methods/Approach, "
            "4) Limitations or Missing Information. "
            "If context is partial, explicitly state what may be missing."
        )
    else:
        sys = (
            "You are a helpful assistant answering questions using only the provided context from a PDF. "
            "If the answer is not in the context, say you do not have enough information from the document. "
            "Use markdown when it improves clarity."
        )
    messages: list[dict] = [{"role": "system", "content": sys}]
    for m in history[-12:]:
        messages.append({"role": m.role, "content": m.content})
    messages.append(
        {
            "role": "user",
            "content": f"Context from document:\n{context}\n\nQuestion: {query}",
        }
    )

    answer = groq_client.chat_completion(api_key, messages)
    citations = [
        CitationOut(
            source_num=i + 1,
            page=h["page"],
            score=_distance_to_score(h["distance"]),
            text=h["text"][:2000],
        )
        for i, h in enumerate(hits)
    ]
    return ChatResponse(
        answer=answer,
        citations=citations,
        chunks_used=len(hits),
    )
