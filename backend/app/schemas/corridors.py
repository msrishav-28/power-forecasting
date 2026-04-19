from __future__ import annotations

from pydantic import BaseModel


class NdviRiskRequest(BaseModel):
    segment_id: str | None = None
    ndvi: float
    ndvi_3m_delta: float
    ndvi_6m_delta: float
    ndvi_stddev: float
    terrain_slope: float


class NdviRiskResponse(BaseModel):
    risk_label: str
    confidence: float
    severity: str
    threshold_label: str
    timestamp: str
