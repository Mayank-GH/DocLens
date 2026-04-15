"""Chroma vector-store access layer for storing/querying document chunks."""

from __future__ import annotations

import threading
from typing import Any

import chromadb
from chromadb.utils import embedding_functions

from app.config import CHROMA_DIR, settings

_lock = threading.Lock()
_client: chromadb.PersistentClient | None = None
_collection = None


def _get_collection():
    """Return singleton Chroma collection, creating it on first access."""

    global _client, _collection
    with _lock:
        if _collection is not None:
            return _collection
        ef = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
        )
        _client = chromadb.PersistentClient(path=str(CHROMA_DIR))
        _collection = _client.get_or_create_collection(
            name=settings.chroma_collection,
            embedding_function=ef,
            metadata={"hnsw:space": "cosine"},
        )
        return _collection


def add_chunks(
    doc_id: str,
    chunk_texts: list[str],
    pages: list[int],
) -> int:
    """Insert chunk texts + metadata for one document into Chroma."""

    col = _get_collection()
    if not chunk_texts:
        return 0
    ids = [f"{doc_id}_{i}" for i in range(len(chunk_texts))]
    metadatas: list[dict[str, Any]] = [
        {"doc_id": doc_id, "page": int(p)} for p in pages
    ]
    col.add(ids=ids, documents=chunk_texts, metadatas=metadatas)
    return len(chunk_texts)


def delete_doc_chunks(doc_id: str) -> None:
    """Delete all vector rows belonging to one document."""

    col = _get_collection()
    col.delete(where={"doc_id": doc_id})


def query_doc(doc_id: str, query: str, k: int) -> list[dict[str, Any]]:
    """Similarity-search one document and return normalized hit objects."""

    col = _get_collection()
    res = col.query(
        query_texts=[query],
        n_results=k,
        where={"doc_id": doc_id},
        include=["documents", "metadatas", "distances"],
    )
    out: list[dict[str, Any]] = []
    ids = res.get("ids") or [[]]
    docs = res.get("documents") or [[]]
    metas = res.get("metadatas") or [[]]
    dists = res.get("distances") or [[]]
    if not ids[0]:
        return out
    for i in range(len(ids[0])):
        dist = float(dists[0][i]) if dists and dists[0] else 0.0
        meta = metas[0][i] if metas and metas[0] else {}
        text = docs[0][i] if docs and docs[0] else ""
        out.append(
            {
                "id": ids[0][i],
                "text": text or "",
                "page": int(meta.get("page", 0)),
                "distance": dist,
            }
        )
    return out


def query_two_docs(doc_id_a: str, doc_id_b: str, query: str, k_each: int) -> tuple[list[dict], list[dict]]:
    """Run the same query against two docs and return each hit list."""

    a = query_doc(doc_id_a, query, k_each)
    b = query_doc(doc_id_b, query, k_each)
    return a, b
