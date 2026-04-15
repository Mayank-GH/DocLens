"""FastAPI entrypoint for DocLensAI backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import chat, compare, documents

app = FastAPI(title="DocLensAI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    """Initialize persistent storage when the API boots."""

    init_db()


app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(compare.router, prefix="/api/compare", tags=["compare"])


@app.get("/api/health")
def health() -> dict[str, str]:
    """Lightweight health endpoint used by UI/startup checks."""

    return {"status": "ok"}
