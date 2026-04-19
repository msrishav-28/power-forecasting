from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.assets import (
    AnomalyPredictionRequest,
    AnomalyPredictionResponse,
    RulPredictionRequest,
    RulPredictionResponse,
)
from app.services.cache_service import build_hash, upsert_prediction_cache
from app.services.llm_service import default_timestamp


router = APIRouter(prefix="/predict", tags=["assets"])


@router.post("/rul", response_model=RulPredictionResponse)
def predict_rul(payload: RulPredictionRequest, request: Request, db: Session = Depends(get_db)) -> RulPredictionResponse:
    registry = request.app.state.model_registry
    try:
        result = registry.predict_rul_for_asset(payload.asset_id)
    except IndexError as exc:
        raise HTTPException(status_code=404, detail=f"Asset not found: {payload.asset_id}") from exc

    timestamp = default_timestamp()
    result["timestamp"] = timestamp
    upsert_prediction_cache(
        db=db,
        prediction_type="rul",
        cache_key=build_hash({"prediction_type": "rul", **payload.model_dump()}),
        subject_id=payload.asset_id,
        result=result,
    )
    return RulPredictionResponse(**result)


@router.post("/anomaly", response_model=AnomalyPredictionResponse)
def predict_anomaly(payload: AnomalyPredictionRequest, request: Request, db: Session = Depends(get_db)) -> AnomalyPredictionResponse:
    registry = request.app.state.model_registry
    try:
        result = registry.predict_anomaly_for_asset(payload.asset_id)
    except IndexError as exc:
        raise HTTPException(status_code=404, detail=f"Asset not found: {payload.asset_id}") from exc

    timestamp = default_timestamp()
    result["timestamp"] = timestamp
    upsert_prediction_cache(
        db=db,
        prediction_type="anomaly",
        cache_key=build_hash({"prediction_type": "anomaly", **payload.model_dump()}),
        subject_id=payload.asset_id,
        result=result,
    )
    return AnomalyPredictionResponse(**result)
