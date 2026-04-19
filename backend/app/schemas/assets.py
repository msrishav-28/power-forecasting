from __future__ import annotations

from pydantic import BaseModel, Field


class RulPredictionRequest(BaseModel):
    asset_id: str


class AnomalyPredictionRequest(BaseModel):
    asset_id: str


class RulPredictionResponse(BaseModel):
    asset_id: str
    rul_days: float
    health_index: float
    severity: str
    confidence: float
    features: dict[str, float]
    timestamp: str


class AnomalyPredictionResponse(BaseModel):
    asset_id: str
    score: float
    threshold: float
    is_detected: bool
    severity: str
    confidence: float
    drivers: list[dict[str, float | str]]
    timestamp: str
