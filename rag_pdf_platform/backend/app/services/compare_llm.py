"""LLM orchestration helpers for document-vs-document comparison."""

import json
import re
from typing import Any

from app.schemas import (
    AnalysisBlock,
    CompareAnalyzeResponse,
    CompareDocLabel,
    CompareQueryResponse,
    KeyDiffItem,
)
from app.services import chroma_store, groq_client


def _retrieve_both(doc_id_a: str, doc_id_b: str, query: str, k: int = 4) -> tuple[str, str]:
    """Retrieve top-k context snippets independently for document A and B."""

    a_hits, b_hits = chroma_store.query_two_docs(doc_id_a, doc_id_b, query, k)
    a_ctx = "\n\n".join(f"[A p{h['page']}]\n{h['text']}" for h in a_hits) or "(No passages.)"
    b_ctx = "\n\n".join(f"[B p{h['page']}]\n{h['text']}" for h in b_hits) or "(No passages.)"
    return a_ctx, b_ctx


def _parse_analysis_json(raw: str) -> AnalysisBlock:
    """Parse model JSON output into typed AnalysisBlock with safe fallbacks."""

    text = raw.strip()
    m = re.search(r"\{[\s\S]*\}\s*$", text)
    if m:
        text = m.group(0)
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return AnalysisBlock(
            summary=raw[:2000],
            common_themes=[],
            key_differences=[],
            contradictions=[],
            recommendation="",
        )

    def diffs(key: str) -> list[KeyDiffItem]:
        items = data.get(key) or []
        out: list[KeyDiffItem] = []
        if not isinstance(items, list):
            return out
        for it in items:
            if not isinstance(it, dict):
                continue
            out.append(
                KeyDiffItem(
                    topic=str(it.get("topic", "Topic")),
                    doc_a=str(it.get("doc_a", "")),
                    doc_b=str(it.get("doc_b", "")),
                )
            )
        return out

    themes = data.get("common_themes") or []
    if isinstance(themes, list):
        themes_out = [str(t) for t in themes]
    else:
        themes_out = []

    return AnalysisBlock(
        summary=str(data.get("summary", "")),
        common_themes=themes_out,
        key_differences=diffs("key_differences"),
        contradictions=diffs("contradictions"),
        recommendation=str(data.get("recommendation", "")),
    )


def analyze_pair(
    api_key: str,
    filename_a: str,
    filename_b: str,
    doc_id_a: str,
    doc_id_b: str,
) -> CompareAnalyzeResponse:
    """Generate structured comparison analysis for two documents."""

    probe = (
        "Summarize main topics, methodology, quantitative claims, assumptions, "
        "limitations, and conclusions."
    )
    a_ctx, b_ctx = _retrieve_both(doc_id_a, doc_id_b, probe, k=5)

    system = (
        "You compare two documents for an expert user. "
        "Respond with a single JSON object only (no markdown fences), with keys: "
        "summary (string), common_themes (array of short strings), "
        "key_differences (array of objects with topic, doc_a, doc_b strings describing each doc), "
        "contradictions (same shape as key_differences; empty if none plausible), "
        "recommendation (string). Be concrete and grounded in the excerpts."
    )
    user = (
        f"Document A filename: {filename_a}\nExcerpts A:\n{a_ctx}\n\n"
        f"Document B filename: {filename_b}\nExcerpts B:\n{b_ctx}\n\n"
        "Identify overlaps, tensions, and what a reader should verify next."
    )
    raw = groq_client.chat_completion(
        api_key,
        [{"role": "system", "content": system}, {"role": "user", "content": user}],
        temperature=0.3,
    )
    analysis = _parse_analysis_json(raw)
    return CompareAnalyzeResponse(
        doc_a=CompareDocLabel(filename=filename_a),
        doc_b=CompareDocLabel(filename=filename_b),
        analysis=analysis,
    )


def compare_answer(
    api_key: str,
    doc_id_a: str,
    doc_id_b: str,
    query: str,
) -> CompareQueryResponse:
    """Generate free-form answer to a cross-document user query."""

    a_ctx, b_ctx = _retrieve_both(doc_id_a, doc_id_b, query, k=4)
    system = (
        "You answer using two labeled document excerpt sets A and B. "
        "Cite which document (A or B) supports each point when possible. "
        "If excerpts are insufficient, say what is missing. Use markdown."
    )
    user = f"Question: {query}\n\nExcerpts A:\n{a_ctx}\n\nExcerpts B:\n{b_ctx}"
    answer = groq_client.chat_completion(
        api_key,
        [{"role": "system", "content": system}, {"role": "user", "content": user}],
        temperature=0.2,
    )
    return CompareQueryResponse(answer=answer)
