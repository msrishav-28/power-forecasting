from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings


class Base(DeclarativeBase):
    pass


def _normalize_database_url(database_url: str) -> str:
    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql+psycopg://", 1)
    if database_url.startswith("postgresql://") and "+" not in database_url.split("://", 1)[0]:
        return database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    return database_url


def _build_database_url() -> str:
    settings = get_settings()
    if settings.database_url:
        return _normalize_database_url(settings.database_url)
    return f"sqlite:///{settings.default_sqlite_path.as_posix()}"


DATABASE_URL = _build_database_url()
CONNECT_ARGS = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, future=True, pool_pre_ping=True, connect_args=CONNECT_ARGS)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False, class_=Session)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from app.db import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
