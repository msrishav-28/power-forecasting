from __future__ import annotations

from datetime import date, datetime
from uuid import uuid4

from sqlalchemy import JSON, Date, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class AssetRecord(Base):
    __tablename__ = "assets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    asset_id: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    substation: Mapped[str] = mapped_column(String(128))
    state: Mapped[str] = mapped_column(String(64), index=True)
    voltage_kv: Mapped[int] = mapped_column(Integer, index=True)
    capacity_mva: Mapped[int] = mapped_column(Integer)
    age_years: Mapped[float] = mapped_column(Float)
    manufacturer: Mapped[str] = mapped_column(String(128))
    last_maintenance: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PredictionRecord(Base):
    __tablename__ = "predictions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    prediction_type: Mapped[str] = mapped_column(String(64), index=True)
    cache_key: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    subject_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    result: Mapped[dict] = mapped_column(JSON)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)


class LlmInsightRecord(Base):
    __tablename__ = "llm_insights"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    context_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    scope: Mapped[str] = mapped_column(String(64), index=True)
    prompt: Mapped[str] = mapped_column(Text)
    insight: Mapped[str] = mapped_column(Text)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CorridorRiskRecord(Base):
    __tablename__ = "corridor_risks"

    segment_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    current_ndvi: Mapped[float] = mapped_column(Float)
    risk_label: Mapped[str] = mapped_column(String(32), index=True)
    ndvi_3m_delta: Mapped[float] = mapped_column(Float)
    last_updated: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class DocumentRecord(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    document_title: Mapped[str] = mapped_column(String(256), index=True)
    source_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    source_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    chunk_index: Mapped[int] = mapped_column(Integer)
    content: Mapped[str] = mapped_column(Text)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
