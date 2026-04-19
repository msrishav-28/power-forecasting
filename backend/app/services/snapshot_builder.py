from __future__ import annotations

import ast
import json
import math
import re
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

CAUSE_ORDER = [
    "Lightning",
    "Tree Contact",
    "Equipment Failure",
    "Bird/Animal",
    "Overloading",
    "Human Error",
    "Unknown",
]
RISK_ORDER = ["Critical", "High", "Medium", "Low"]
AGE_GROUPS = ["0-5y", "5-10y", "10-15y", "15-20y", "20y+"]
ANOMALY_COLUMNS = ["oil_temp", "winding_temp", "load_pct", "h2_ppm", "co_ppm"]
DATA_DIR = Path(__file__).resolve().parents[3] / "data" / "synthetic"


def safe_float(value: Any, digits: int = 2) -> float | None:
    if value is None or pd.isna(value):
        return None
    return round(float(value), digits)


def iso_timestamp(value: Any) -> str | None:
    if value is None or pd.isna(value):
        return None
    return pd.Timestamp(value).isoformat()


def human_feature_name(name: str) -> str:
    mapping = {
        "oil_temp": "Oil temperature",
        "winding_temp": "Winding temperature",
        "load_pct": "Load percentage",
        "h2_ppm": "Hydrogen (H2)",
        "co_ppm": "Carbon monoxide (CO)",
    }
    return mapping.get(name, name.replace("_", " ").title())


def anomaly_severity(score: float) -> str:
    if score >= 3.0:
        return "critical"
    if score >= 2.0:
        return "high"
    if score >= 1.25:
        return "medium"
    return "normal"


def compute_health_index(row: pd.Series) -> float:
    score = 100
    if row["oil_temp"] > 95:
        score -= 20
    elif row["oil_temp"] > 85:
        score -= 10

    if row["winding_temp"] > 105:
        score -= 15
    elif row["winding_temp"] > 95:
        score -= 8

    if row["h2_ppm"] > 150:
        score -= 25
    elif row["h2_ppm"] > 100:
        score -= 12
    elif row["h2_ppm"] > 50:
        score -= 5

    if row["co_ppm"] > 350:
        score -= 20
    elif row["co_ppm"] > 200:
        score -= 10

    if row["load_pct"] > 100:
        score -= 15
    elif row["load_pct"] > 90:
        score -= 7
    elif row["load_pct"] > 80:
        score -= 3

    return float(max(0, score))


def classify_asset_status(health_index: float, rul_days: float, anomaly_score: float) -> str:
    if health_index < 58 or rul_days < 90 or anomaly_score >= 3.0:
        return "critical"
    if health_index < 72 or rul_days < 150 or anomaly_score >= 2.0:
        return "warning"
    return "stable"


def classify_ndvi_risk(ndvi: float, delta_3m: float) -> str:
    if ndvi > 0.44 and delta_3m > 0.03:
        return "Critical"
    if ndvi > 0.37:
        return "High"
    if ndvi > 0.29:
        return "Medium"
    return "Low"


def clean_geometry(raw_value: Any) -> list[list[float]]:
    if raw_value is None or (isinstance(raw_value, float) and math.isnan(raw_value)):
        return []

    parsed_value = raw_value
    if isinstance(raw_value, str):
        cleaned = re.sub(r"np\.float64\(([^)]+)\)", r"\1", raw_value)
        parsed_value = ast.literal_eval(cleaned)

    coordinates: list[list[float]] = []
    for point in parsed_value:
        lat, lon = point
        coordinates.append([round(float(lat), 5), round(float(lon), 5)])
    return coordinates


def sample_records(
    frame: pd.DataFrame,
    columns: list[str],
    every_n: int = 1,
    limit: int | None = None,
) -> list[dict[str, Any]]:
    sampled = frame.iloc[::every_n] if every_n > 1 else frame
    if limit:
        sampled = sampled.tail(limit)

    records: list[dict[str, Any]] = []
    for row in sampled.itertuples(index=False):
        record: dict[str, Any] = {}
        for column in columns:
            value = getattr(row, column)
            if isinstance(value, pd.Timestamp):
                record[column] = value.isoformat()
            elif isinstance(value, (np.floating, float, int, np.integer)):
                if isinstance(value, (np.floating, float)):
                    record[column] = round(float(value), 3)
                else:
                    record[column] = int(value)
            else:
                record[column] = value
        records.append(record)
    return records


def calculate_rul_features(asset_row: pd.Series, asset_history: pd.DataFrame) -> dict[str, float]:
    sorted_history = asset_history.sort_values("timestamp")
    recent_7d = sorted_history.tail(24 * 7)
    recent_30d = sorted_history.tail(24 * 30)
    latest = sorted_history.iloc[-1]

    last_maintenance = pd.to_datetime(asset_row.get("last_maintenance"))
    last_timestamp = pd.to_datetime(latest["timestamp"])

    return {
        "oil_temp_7d_mean": float(recent_7d["oil_temp"].mean()),
        "oil_temp_30d_mean": float(recent_30d["oil_temp"].mean()),
        "h2_ppm": float(latest["h2_ppm"]),
        "ch4_ppm": float(latest["ch4_ppm"]),
        "co_ppm": float(latest["co_ppm"]),
        "load_pct_mean": float(recent_7d["load_pct"].mean()),
        "age_years": float(asset_row["age_years"]),
        "days_since_maintenance": float((last_timestamp - last_maintenance).days),
        "health_index_current": float(compute_health_index(latest)),
    }


def derive_rul_days(asset_row: pd.Series, asset_history: pd.DataFrame) -> float:
    latest = asset_history.iloc[-1]
    recent_7d = asset_history.tail(24 * 7)
    daily_health = (
        asset_history.assign(day=asset_history["timestamp"].dt.floor("D"))
        .groupby("day", as_index=False)["health_index"]
        .last()
        .tail(90)
    )

    health_now = compute_health_index(latest)
    health_drop_90d = 0.0
    if len(daily_health) >= 2:
        health_drop_90d = max(0.0, float(daily_health["health_index"].iloc[0] - daily_health["health_index"].iloc[-1]))

    thermal_penalty = max(float(latest["oil_temp"]) - 75.0, 0.0) * 1.4
    gas_penalty = max(float(latest["h2_ppm"]) - 50.0, 0.0) * 0.18 + max(float(latest["co_ppm"]) - 200.0, 0.0) * 0.05
    load_penalty = max(float(recent_7d["load_pct"].mean()) - 78.0, 0.0) * 2.0
    age_penalty = float(asset_row["age_years"]) * 1.6
    fault_penalty = 30.0 if pd.notna(asset_row.get("fault_type")) else 0.0

    rul_days = 320.0
    rul_days -= (100.0 - health_now) * 2.4
    rul_days -= thermal_penalty + gas_penalty + load_penalty + age_penalty + fault_penalty
    rul_days -= health_drop_90d * 3.2

    return float(np.clip(rul_days, 14.0, 365.0))


def band_around(value: float, spread: float = 0.18) -> dict[str, float]:
    delta = max(12.0, value * spread)
    return {
        "low": round(max(0.0, value - delta), 1),
        "high": round(value + delta, 1),
    }


def build_anomaly_summary(asset_history: pd.DataFrame) -> dict[str, Any]:
    recent = asset_history.tail(48)[ANOMALY_COLUMNS]
    baseline = asset_history.tail(24 * 30).iloc[:-48][ANOMALY_COLUMNS]

    if baseline.empty:
        baseline = asset_history.head(max(len(asset_history) - 48, 1))[ANOMALY_COLUMNS]

    baseline_mean = baseline.mean()
    baseline_std = baseline.std().replace(0, 1e-6)
    z_scores = ((recent.mean() - baseline_mean).abs() / baseline_std).sort_values(ascending=False)

    score = float(z_scores.iloc[0]) if not z_scores.empty else 0.0
    drivers = [
        {
            "feature": human_feature_name(name),
            "score": round(float(value), 2),
            "severity": anomaly_severity(float(value)),
        }
        for name, value in z_scores.head(4).items()
    ]

    return {
        "score": round(score, 2),
        "threshold": 2.15,
        "isDetected": score >= 2.15,
        "drivers": drivers,
    }


def build_assets_snapshot(assets_df: pd.DataFrame, sensor_df: pd.DataFrame) -> dict[str, Any]:
    sensor_df = sensor_df.sort_values(["asset_id", "timestamp"]).copy()
    grouped = {asset_id: group.reset_index(drop=True) for asset_id, group in sensor_df.groupby("asset_id")}
    asset_cards: list[dict[str, Any]] = []

    for asset in assets_df.to_dict("records"):
        asset_id = asset["asset_id"]
        asset_history = grouped[asset_id]
        latest = asset_history.iloc[-1]
        health_index = compute_health_index(latest)
        health_30d_ago = compute_health_index(asset_history.iloc[max(0, len(asset_history) - 24 * 30)])
        rul_days = derive_rul_days(pd.Series(asset), asset_history)
        anomaly = build_anomaly_summary(asset_history)
        status = classify_asset_status(health_index, rul_days, anomaly["score"])

        daily_history = (
            asset_history.assign(day=asset_history["timestamp"].dt.floor("D"))
            .groupby("day", as_index=False)["health_index"]
            .last()
            .tail(365)
            .rename(columns={"day": "date", "health_index": "value"})
        )
        sensors_7d = asset_history.tail(24 * 7)[["timestamp", "oil_temp", "winding_temp", "load_pct"]]
        gases_30d = asset_history.tail(24 * 30).iloc[::6][["timestamp", "h2_ppm", "ch4_ppm", "co_ppm"]]

        asset_cards.append(
            {
                "assetId": asset_id,
                "substation": asset["substation"],
                "state": asset["state"],
                "capacityMva": int(asset["capacity_mva"]),
                "voltageKv": int(asset["voltage_kv"]),
                "ageYears": int(asset["age_years"]),
                "manufacturer": asset["manufacturer"],
                "faultType": None if pd.isna(asset.get("fault_type")) else str(asset["fault_type"]),
                "lastMaintenance": iso_timestamp(asset.get("last_maintenance")),
                "healthIndex": round(health_index, 1),
                "healthDelta30d": round(health_index - health_30d_ago, 1),
                "rulDays": round(rul_days, 1),
                "rulBand": band_around(rul_days),
                "anomaly": anomaly,
                "status": status,
                "latestReadings": {
                    "oilTemp": safe_float(latest["oil_temp"], 1),
                    "windingTemp": safe_float(latest["winding_temp"], 1),
                    "loadPct": safe_float(latest["load_pct"], 1),
                    "h2Ppm": safe_float(latest["h2_ppm"], 1),
                    "ch4Ppm": safe_float(latest["ch4_ppm"], 1),
                    "coPpm": safe_float(latest["co_ppm"], 1),
                },
                "history": sample_records(daily_history, ["date", "value"], limit=180),
                "sensors7d": sample_records(
                    sensors_7d,
                    ["timestamp", "oil_temp", "winding_temp", "load_pct"],
                    every_n=2,
                ),
                "gases30d": sample_records(gases_30d, ["timestamp", "h2_ppm", "ch4_ppm", "co_ppm"]),
            }
        )

    asset_cards.sort(key=lambda item: (item["status"] != "critical", item["status"] != "warning", item["healthIndex"]))

    return {
        "assets": asset_cards,
        "statusCounts": {
            "critical": sum(1 for asset in asset_cards if asset["status"] == "critical"),
            "warning": sum(1 for asset in asset_cards if asset["status"] == "warning"),
            "stable": sum(1 for asset in asset_cards if asset["status"] == "stable"),
        },
        "states": sorted(assets_df["state"].unique().tolist()),
        "voltageLevels": sorted(int(voltage) for voltage in assets_df["voltage_kv"].unique().tolist()),
    }


def build_grid_snapshot(posoco_df: pd.DataFrame, outage_df: pd.DataFrame) -> dict[str, Any]:
    posoco_df = posoco_df.sort_values("timestamp").copy()
    posoco_df["date"] = posoco_df["timestamp"].dt.floor("D")

    daily = (
        posoco_df.groupby("date", as_index=False)
        .agg(
            demand_mw=("demand_mw", "mean"),
            frequency_hz=("frequency_hz", "mean"),
            temperature=("temperature", "mean"),
            wind_speed=("wind_speed", "mean"),
            solar_radiation=("solar_radiation", "mean"),
            thermal_mw=("thermal_mw", "mean"),
            hydro_mw=("hydro_mw", "mean"),
            renewable_mw=("renewable_mw", "mean"),
            rainfall_mm=("rainfall_mm", "mean"),
        )
        .sort_values("date")
    )

    latest = posoco_df.iloc[-1]
    recent_28 = daily.tail(28).copy()
    recent_mean = float(recent_28["demand_mw"].mean())
    weekday_profile = (
        recent_28.assign(weekday=recent_28["date"].dt.dayofweek)
        .groupby("weekday")["demand_mw"]
        .mean()
        .div(recent_mean)
        .to_dict()
    )
    demand_trend = float(recent_28["demand_mw"].iloc[-1] - recent_28["demand_mw"].iloc[0]) / max(len(recent_28) - 1, 1)

    forecast_rows: list[dict[str, Any]] = []
    start_date = daily["date"].max() + pd.Timedelta(days=1)
    for offset in range(7):
        forecast_date = start_date + pd.Timedelta(days=offset)
        day_factor = float(weekday_profile.get(forecast_date.dayofweek, 1.0))
        seasonal_bump = math.sin((forecast_date.dayofyear / 365.0) * math.pi * 2.0) * 120.0
        forecast = recent_mean * day_factor + demand_trend * (offset + 1) + seasonal_bump * 0.2
        band = max(220.0, forecast * 0.05)
        forecast_rows.append(
            {
                "date": forecast_date.isoformat(),
                "forecastMw": round(forecast, 1),
                "lowerMw": round(forecast - band, 1),
                "upperMw": round(forecast + band, 1),
            }
        )

    demand_delta = float(latest["demand_mw"] - posoco_df.iloc[-2]["demand_mw"])
    dll_pct = 72.0
    dll_pct += max(float(latest["temperature"]) - 25.0, 0.0) * 0.9
    dll_pct -= float(latest["wind_speed"]) * 0.55
    dll_pct += float(latest["solar_radiation"]) / 280.0
    dll_pct += max(float(latest["demand_mw"]) - recent_mean, 0.0) / 260.0
    dll_pct = float(np.clip(dll_pct, 58.0, 97.0))

    recent_outages = outage_df.copy()
    recent_outages["timestamp"] = pd.to_datetime(recent_outages["timestamp"])
    recent_outages = recent_outages.sort_values("timestamp", ascending=False)

    def outage_confidence(row: pd.Series) -> float:
        confidence = 0.58
        confidence += min(float(row["rainfall_mm"]) / 25.0, 0.14)
        confidence += min(float(row["wind_speed"]) / 25.0, 0.08)
        if row["root_cause"] in {"Lightning", "Equipment Failure"}:
            confidence += 0.08
        if row["root_cause"] == "Unknown":
            confidence -= 0.1
        return round(float(np.clip(confidence, 0.52, 0.96)), 2)

    outage_feed = [
        {
            "timestamp": row["timestamp"].isoformat(),
            "lineId": row["line_id"],
            "state": row["state"],
            "rootCause": row["root_cause"],
            "durationHours": safe_float(row["duration_hours"], 1),
            "voltageKv": int(row["voltage_kv"]),
            "confidence": outage_confidence(row),
        }
        for _, row in recent_outages.head(10).iterrows()
    ]

    cause_distribution = [{"cause": cause, "count": int(recent_outages["root_cause"].value_counts().get(cause, 0))} for cause in CAUSE_ORDER]

    outages_with_age = recent_outages.copy()
    outages_with_age["ageGroup"] = pd.cut(
        outages_with_age["line_age_years"],
        bins=[0, 5, 10, 15, 20, 100],
        labels=AGE_GROUPS,
        include_lowest=True,
        right=False,
    )
    heatmap = (
        outages_with_age.groupby(["root_cause", "ageGroup"], observed=False)
        .size()
        .reset_index(name="count")
    )
    max_count = max(int(heatmap["count"].max()), 1)
    heatmap_payload = [
        {
            "rootCause": row["root_cause"],
            "ageGroup": str(row["ageGroup"]),
            "count": int(row["count"]),
            "ratio": round(int(row["count"]) / max_count, 3),
        }
        for _, row in heatmap.iterrows()
        if pd.notna(row["ageGroup"])
    ]

    history = daily.tail(14)[["date", "demand_mw"]].rename(columns={"demand_mw": "actualMw"})
    latest_generation = {
        "thermal": round(float(latest["thermal_mw"]), 1),
        "hydro": round(float(latest["hydro_mw"]), 1),
        "renewable": round(float(latest["renewable_mw"]), 1),
    }
    current_demand = float(latest["demand_mw"])
    generation_mix = [
        {
            "source": source.title(),
            "mw": round(value, 1),
            "pct": round((value / current_demand) * 100.0, 1),
        }
        for source, value in latest_generation.items()
    ]

    return {
        "currentDemandMw": round(current_demand, 1),
        "demandDeltaMw": round(demand_delta, 1),
        "gridFrequencyHz": round(float(latest["frequency_hz"]), 3),
        "outagesToday": int(recent_outages[recent_outages["timestamp"].dt.date == latest["timestamp"].date()].shape[0]),
        "peakDllPct": round(dll_pct, 1),
        "weather": {
            "temperatureC": round(float(latest["temperature"]), 1),
            "windSpeedMs": round(float(latest["wind_speed"]), 1),
            "solarRadiationWm2": round(float(latest["solar_radiation"]), 1),
            "rainfallMm": round(float(latest["rainfall_mm"]), 2),
        },
        "loadHistory": sample_records(history, ["date", "actualMw"]),
        "loadForecast": forecast_rows,
        "outageFeed": outage_feed,
        "causeDistribution": cause_distribution,
        "failureHeatmap": heatmap_payload,
        "generationMix": generation_mix,
    }


def build_corridor_snapshot(corridor_df: pd.DataFrame, ndvi_df: pd.DataFrame) -> dict[str, Any]:
    corridor_df = corridor_df.copy()
    corridor_df["geometry"] = corridor_df["geometry_coords"].apply(clean_geometry)
    corridor_df["last_inspection"] = pd.to_datetime(corridor_df["last_inspection"])

    ndvi_df = ndvi_df.copy()
    ndvi_df["month"] = pd.to_datetime(ndvi_df["month"])

    segment_cards: list[dict[str, Any]] = []
    alerts: list[dict[str, Any]] = []

    for corridor in corridor_df.to_dict("records"):
        segment_id = corridor["segment_id"]
        history = ndvi_df[ndvi_df["segment_id"] == segment_id].sort_values("month").reset_index(drop=True)
        latest = history.iloc[-1]

        risk_label = classify_ndvi_risk(float(latest["ndvi"]), float(latest["ndvi_3m_delta"]))
        recent_trend = float(history.tail(6)["ndvi"].diff().fillna(0).mean())
        forecast_rows = []
        last_date = history["month"].iloc[-1]
        last_ndvi = float(history["ndvi"].iloc[-1])

        for step in range(1, 4):
            forecast_date = last_date + pd.DateOffset(months=step)
            seasonal = math.sin((forecast_date.month / 12.0) * math.pi * 2.0) * 0.015
            yhat = float(np.clip(last_ndvi + recent_trend * step + seasonal, 0.08, 0.92))
            band = max(0.02, abs(recent_trend) * 0.8)
            forecast_rows.append(
                {
                    "month": forecast_date.isoformat(),
                    "forecastNdvi": round(yhat, 3),
                    "lowerNdvi": round(max(0.0, yhat - band), 3),
                    "upperNdvi": round(min(1.0, yhat + band), 3),
                }
            )

        pre_monsoon = history[history["month"].dt.month.isin([3, 4, 5])]["ndvi"].mean()
        post_monsoon = history[history["month"].dt.month.isin([9, 10, 11])]["ndvi"].mean()
        seasonal_delta = float(post_monsoon - pre_monsoon)
        if seasonal_delta > 0.15:
            change_flag = "Significant"
        elif seasonal_delta > 0.05:
            change_flag = "Moderate"
        else:
            change_flag = "Stable"

        segment_card = {
            "segmentId": segment_id,
            "states": corridor["states"],
            "voltageKv": int(corridor["voltage_kv"]),
            "lengthKm": round(float(corridor["length_km"]), 1),
            "terrainSlope": round(float(corridor["terrain_slope"]), 1),
            "baseNdvi": round(float(corridor["base_ndvi"]), 3),
            "lastInspection": iso_timestamp(corridor["last_inspection"]),
            "latestNdvi": round(float(latest["ndvi"]), 3),
            "delta3m": round(float(latest["ndvi_3m_delta"]), 3),
            "delta6m": round(float(latest["ndvi_6m_delta"]), 3),
            "riskLabel": risk_label,
            "changeFlag": change_flag,
            "geometry": corridor["geometry"],
            "history": [
                {"month": row["month"].isoformat(), "ndvi": round(float(row["ndvi"]), 3)}
                for _, row in history.iterrows()
            ],
            "forecast": forecast_rows,
        }
        segment_cards.append(segment_card)

        if risk_label in {"Critical", "High"}:
            alerts.append(
                {
                    "segmentId": segment_id,
                    "states": corridor["states"],
                    "voltageKv": int(corridor["voltage_kv"]),
                    "latestNdvi": round(float(latest["ndvi"]), 3),
                    "delta3m": round(float(latest["ndvi_3m_delta"]), 3),
                    "riskLabel": risk_label,
                    "recommendedAction": "Immediate corridor patrol" if risk_label == "Critical" else "Schedule vegetation inspection",
                }
            )

    segment_cards.sort(key=lambda item: (RISK_ORDER.index(item["riskLabel"]), -item["latestNdvi"]))
    alerts.sort(key=lambda item: (RISK_ORDER.index(item["riskLabel"]), -item["latestNdvi"]))

    risk_summary = [{"riskLabel": risk, "count": sum(1 for item in segment_cards if item["riskLabel"] == risk)} for risk in RISK_ORDER]
    change_summary = [
        {"flag": flag, "count": sum(1 for item in segment_cards if item["changeFlag"] == flag)}
        for flag in ["Significant", "Moderate", "Stable"]
    ]

    return {
        "segments": segment_cards,
        "alerts": alerts,
        "riskSummary": risk_summary,
        "changeSummary": change_summary,
    }


def load_frames() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    assets_df = pd.read_csv(DATA_DIR / "assets.csv")
    sensor_df = pd.read_parquet(DATA_DIR / "sensor_readings.parquet")
    posoco_df = pd.read_parquet(DATA_DIR / "posoco_grid_data.parquet")
    outage_df = pd.read_csv(DATA_DIR / "outage_logs.csv")
    corridor_df = pd.read_csv(DATA_DIR / "corridor_segments.csv")
    ndvi_df = pd.read_csv(DATA_DIR / "ndvi_timeseries.csv")

    sensor_df["timestamp"] = pd.to_datetime(sensor_df["timestamp"])
    posoco_df["timestamp"] = pd.to_datetime(posoco_df["timestamp"])
    outage_df["timestamp"] = pd.to_datetime(outage_df["timestamp"])
    assets_df["last_maintenance"] = pd.to_datetime(assets_df["last_maintenance"])
    ndvi_df["month"] = pd.to_datetime(ndvi_df["month"])

    return assets_df, sensor_df, posoco_df, outage_df, corridor_df, ndvi_df


def build_split_snapshots() -> dict[str, dict[str, Any]]:
    assets_df, sensor_df, posoco_df, outage_df, corridor_df, ndvi_df = load_frames()

    asset_snapshot = build_assets_snapshot(assets_df, sensor_df)
    grid_snapshot = build_grid_snapshot(posoco_df, outage_df)
    corridor_snapshot = build_corridor_snapshot(corridor_df, ndvi_df)

    critical_assets = asset_snapshot["statusCounts"]["critical"]
    high_risk_corridors = sum(
        item["count"] for item in corridor_snapshot["riskSummary"] if item["riskLabel"] in {"Critical", "High"}
    )

    latest_sensor = sensor_df["timestamp"].max()
    earliest_sensor = sensor_df["timestamp"].min()

    meta = {
        "generatedAt": pd.Timestamp.utcnow().isoformat(),
        "app": {
            "title": "POWERGRID ER-I Intelligence Dashboard",
            "region": "Eastern Region-I",
            "deployment": "Vite + Vercel frontend, FastAPI + Render backend",
            "frontend": "React + Vite + Tailwind + Tremor + Recharts + React-Leaflet",
            "backend": "FastAPI + Render free web service",
            "database": "Render Postgres free tier",
            "llm": "Gemini 2.0 Flash",
            "rag": "Qdrant Cloud free tier",
        },
        "filters": {
            "states": asset_snapshot["states"],
            "voltageLevels": asset_snapshot["voltageLevels"],
            "defaultDateRange": {
                "start": earliest_sensor.date().isoformat(),
                "end": latest_sensor.date().isoformat(),
            },
        },
        "overview": {
            "assetCount": int(len(assets_df)),
            "sensorReadingCount": int(len(sensor_df)),
            "outageCount": int(len(outage_df)),
            "corridorCount": int(len(corridor_snapshot["segments"])),
            "criticalAssets": int(critical_assets),
            "highRiskCorridors": int(high_risk_corridors),
            "currentDemandMw": grid_snapshot["currentDemandMw"],
            "peakDllPct": grid_snapshot["peakDllPct"],
        },
    }

    return {
        "meta": meta,
        "assets": asset_snapshot,
        "grid": grid_snapshot,
        "corridors": corridor_snapshot,
    }


def write_split_snapshots(*destinations: Path) -> list[Path]:
    snapshots = build_split_snapshots()
    written_files: list[Path] = []
    for destination in destinations:
        destination.mkdir(parents=True, exist_ok=True)
        for name, payload in snapshots.items():
            output_path = destination / f"{name}.json"
            output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
            written_files.append(output_path)
    return written_files
