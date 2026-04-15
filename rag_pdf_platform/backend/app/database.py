"""Database engine/session setup and FastAPI DB dependency."""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import DATABASE_PATH


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""

    pass


engine = create_engine(
    f"sqlite:///{DATABASE_PATH}",
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    """Create all tables defined in `app.models` if missing."""

    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)


def get_db():
    """Yield a request-scoped SQLAlchemy session for route handlers."""

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
