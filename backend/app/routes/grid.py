from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.grid import LoadForecastResponse, OutageCauseRequest, OutageCauseResponse
from app.services.cache_service import build_hash, upsert_prediction_cache
from app.services.llm_service import default_timestamp


router = APIRouter(tags=["grid"])


@router.get("/forecast/load", response_model=LoadForecastResponse)
def get_load_forecast(
    request: Request,
    db: Session = Depends(get_db),
    region: str = Query(default="ER-I"),
    horizon: int = Query(default=7, ge=1, le=14),
) -> LoadForecastResponse:
    registry = request.app.state.model_registry
    result = registry.forecast_load(horizon=horizon)
    result["region"] = region
    result["timestamp"] = default_timestamp()
    upsert_prediction_cache(
        db=db,
        prediction_type="load_forecast",
        cache_key=build_hash({"prediction_type": "load_forecast", "region": region, "horizon": horizon}),
        subject_id=region,
        result=result,
    )
    return LoadForecastResponse(**result)


@router.post("/predict/outage-cause", response_model=OutageCauseResponse)
def predict_outage_cause(payload: OutageCauseRequest, request: Request, db: Session = Depends(get_db)) -> OutageCauseResponse:
    registry = request.app.state.model_registry
    result = registry.predict_outage_cause(payload.model_dump())
    result["timestamp"] = default_timestamp()
    upsert_prediction_cache(
        db=db,
        prediction_type="outage_cause",
        cache_key=build_hash({"prediction_type": "outage_cause", **payload.model_dump()}),
        subject_id=None,
        result=result,
    )
    return OutageCauseResponse(**result)
