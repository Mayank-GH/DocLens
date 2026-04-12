from app.config import settings
from app.schemas import ChatMessage, ChatResponse, CitationOut
from app.services import chroma_store
from app.services import groq_client


def _distance_to_score(distance: float) -> float:
    return max(0.0, min(1.0, 1.0 / (1.0 + float(distance))))


def answer_for_doc(
    api_key: str,
    doc_id: str,
    query: str,
    history: list[ChatMessage],
) -> ChatResponse:
    hits = chroma_store.query_doc(doc_id, query, settings.retrieval_k)
    context_blocks = []
    for i, h in enumerate(hits, start=1):
        context_blocks.append(f"[Source {i}, page {h['page']}]\n{h['text']}")
    context = "\n\n".join(context_blocks) if context_blocks else "(No retrieved passages.)"

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
