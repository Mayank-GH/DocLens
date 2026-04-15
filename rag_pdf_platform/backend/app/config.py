"""Application settings and filesystem paths.

This module centralizes runtime configuration (model names, chunk settings,
and storage paths) so the rest of the backend can import one source of truth.
"""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed environment-backed settings for the backend."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    groq_base_url: str = "https://api.groq.com/openai/v1"
    groq_chat_model: str = "llama-3.3-70b-versatile"
    chroma_collection: str = "rag_pdf_platform"
    chunk_size: int = 800
    chunk_overlap: int = 100
    retrieval_k: int = 5
    summary_retrieval_k_short: int = 12
    summary_retrieval_k_long: int = 20
    summary_long_doc_page_threshold: int = 20
    cleanup_retry_attempts: int = 3
    cleanup_retry_delay_seconds: float = 0.35
    data_dir: Path = Path(__file__).resolve().parent.parent / "data"


settings = Settings()
DATA_DIR = settings.data_dir
UPLOADS_DIR = DATA_DIR / "uploads"
CHROMA_DIR = DATA_DIR / "chroma"
DATABASE_PATH = DATA_DIR / "app.db"

# Ensure required runtime directories exist before app startup.
for d in (DATA_DIR, UPLOADS_DIR, CHROMA_DIR):
    d.mkdir(parents=True, exist_ok=True)
