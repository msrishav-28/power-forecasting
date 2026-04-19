from __future__ import annotations

from pydantic import BaseModel, Field


class LoadForecastResponse(BaseModel):
    region: str
    horizon_days: int
    severity: str
    confidence: float
    forecast: list[dict]
    timestamp: str


class OutageCauseRequest(BaseModel):
    hour_of_day: int = Field(ge=0, le=23)
    month: int = Field(ge=1, le=12)
    wind_speed: float
    rainfall_mm: float
    temperature: float
    load_pct: float
    line_age_years: float
    voltage_kv: int


class OutageCauseResponse(BaseModel):
    predicted_cause: str
    confidence: float
    severity: str
    top_candidates: list[dict]
    timestamp: str
