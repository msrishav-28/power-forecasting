from __future__ import annotations

from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import AssetRecord, CorridorRiskRecord
from app.services.snapshot_builder import build_split_snapshots


def seed_reference_data(db: Session) -> None:
    snapshots = build_split_snapshots()

    for asset in snapshots["assets"]["assets"]:
        record = db.scalar(select(AssetRecord).where(AssetRecord.asset_id == asset["assetId"]))
        if record is None:
            record = AssetRecord(
                asset_id=asset["assetId"],
                substation=asset["substation"],
                state=asset["state"],
                voltage_kv=asset["voltageKv"],
                capacity_mva=asset["capacityMva"],
                age_years=asset["ageYears"],
                manufacturer=asset["manufacturer"],
                last_maintenance=None
                if not asset["lastMaintenance"]
                else date.fromisoformat(asset["lastMaintenance"][:10]),
            )
            db.add(record)

    for segment in snapshots["corridors"]["segments"]:
        risk = db.scalar(select(CorridorRiskRecord).where(CorridorRiskRecord.segment_id == segment["segmentId"]))
        if risk is None:
            risk = CorridorRiskRecord(
                segment_id=segment["segmentId"],
                current_ndvi=segment["latestNdvi"],
                risk_label=segment["riskLabel"],
                ndvi_3m_delta=segment["delta3m"],
                last_updated=None
                if not segment["lastInspection"]
                else date.fromisoformat(segment["lastInspection"][:10]),
            )
            db.add(risk)

    db.commit()
