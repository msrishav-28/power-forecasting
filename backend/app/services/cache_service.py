from __future__ import annotations

import hashlib
import json
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import LlmInsightRecord, PredictionRecord


def build_hash(payload: dict[str, Any]) -> str:
    serialized = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def get_prediction_cache(db: Session, prediction_type: str, cache_key: str) -> PredictionRecord | None:
    statement = select(PredictionRecord).where(
        PredictionRecord.prediction_type == prediction_type,
        PredictionRecord.cache_key == cache_key,
    )
    return db.scalar(statement)


def upsert_prediction_cache(db: Session, prediction_type: str, cache_key: str, subject_id: str | None, result: dict[str, Any]) -> dict[str, Any]:
    record = get_prediction_cache(db, prediction_type, cache_key)
    if record:
        record.result = result
        record.subject_id = subject_id
        record.computed_at = _utc_now()
    else:
        record = PredictionRecord(
            prediction_type=prediction_type,
            cache_key=cache_key,
            subject_id=subject_id,
            result=result,
        )
        db.add(record)
    db.commit()
    db.refresh(record)
    return record.result


def get_llm_cache(db: Session, context_hash: str) -> LlmInsightRecord | None:
    record = db.scalar(select(LlmInsightRecord).where(LlmInsightRecord.context_hash == context_hash))
    if record and _as_utc(record.expires_at) > _utc_now():
        return record
    return None


def upsert_llm_cache(db: Session, context_hash: str, scope: str, prompt: str, insight: str, ttl_hours: int) -> LlmInsightRecord:
    record = db.scalar(select(LlmInsightRecord).where(LlmInsightRecord.context_hash == context_hash))
    expires_at = _utc_now() + timedelta(hours=ttl_hours)
    if record:
        record.scope = scope
        record.prompt = prompt
        record.insight = insight
        record.expires_at = expires_at
    else:
        record = LlmInsightRecord(
            context_hash=context_hash,
            scope=scope,
            prompt=prompt,
            insight=insight,
            expires_at=expires_at,
        )
        db.add(record)
    db.commit()
    db.refresh(record)
    return record
