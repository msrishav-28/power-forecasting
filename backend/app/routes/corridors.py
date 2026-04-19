from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.corridors import NdviRiskRequest, NdviRiskResponse
from app.services.cache_service import build_hash, upsert_prediction_cache
from app.services.data_service import get_frames
from app.services.llm_service import default_timestamp


router = APIRouter(tags=["corridors"])


@router.post("/predict/ndvi-risk", response_model=NdviRiskResponse)
def predict_ndvi_risk(payload: NdviRiskRequest, request: Request, db: Session = Depends(get_db)) -> NdviRiskResponse:
    registry = request.app.state.model_registry
    request_payload = payload.model_dump()

    if payload.segment_id:
        _, _, _, _, corridor_df, ndvi_df = get_frames()
        latest = (
            ndvi_df.loc[ndvi_df["segment_id"] == payload.segment_id]
            .sort_values("month")
            .iloc[-1]
        )
        slope = float(
            corridor_df.loc[corridor_df["segment_id"] == payload.segment_id, "terrain_slope"].iloc[0]
        )
        request_payload = {
            "ndvi": float(latest["ndvi"]),
            "ndvi_3m_delta": float(latest["ndvi_3m_delta"]),
            "ndvi_6m_delta": float(latest["ndvi_6m_delta"]),
            "ndvi_stddev": float(latest["ndvi_stddev"]),
            "terrain_slope": slope,
        }

    result = registry.predict_ndvi_risk(request_payload)
    result["timestamp"] = default_timestamp()
    upsert_prediction_cache(
        db=db,
        prediction_type="ndvi_risk",
        cache_key=build_hash({"prediction_type": "ndvi_risk", **payload.model_dump()}),
        subject_id=payload.segment_id,
        result=result,
    )
    return NdviRiskResponse(**result)
