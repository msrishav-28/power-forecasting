from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "POWERGRID ER-I Intelligence API"
    environment: str = "development"
    api_prefix: str = "/api"
    frontend_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "https://your-vercel-app.vercel.app",
        ]
    )
    database_url: str | None = None
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.0-flash"
    gemini_embedding_model: str = "gemini-embedding-001"
    qdrant_url: str | None = None
    qdrant_api_key: str | None = None
    qdrant_collection: str = "powergrid-public-docs"
    huggingface_model_repo: str | None = None
    llm_cache_ttl_hours: int = 6

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[2] / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    @field_validator("frontend_origins", mode="before")
    @classmethod
    def parse_frontend_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, list):
            return value
        if not value:
            return []
        return [item.strip() for item in value.split(",") if item.strip()]

    @property
    def repo_root(self) -> Path:
        return Path(__file__).resolve().parents[3]

    @property
    def backend_root(self) -> Path:
        return self.repo_root / "backend"

    @property
    def default_sqlite_path(self) -> Path:
        return self.backend_root / "powergrid.db"

    @property
    def model_dir_candidates(self) -> list[Path]:
        return [
            self.backend_root / "models",
            self.repo_root / "models",
        ]

    @property
    def data_root(self) -> Path:
        return self.repo_root / "data"

    @property
    def ingestion_root(self) -> Path:
        return self.repo_root / "data" / "ingestion"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
