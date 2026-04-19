from __future__ import annotations

import pickle
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from huggingface_hub import hf_hub_download

from app.core.config import Settings, get_settings
from app.services.data_service import get_frames
from app.services.snapshot_builder import calculate_rul_features, classify_ndvi_risk, compute_health_index


RUL_FEATURES = [
    "oil_temp_7d_mean",
    "oil_temp_30d_mean",
    "h2_ppm",
    "ch4_ppm",
    "co_ppm",
    "load_pct_mean",
    "age_years",
    "days_since_maintenance",
    "health_index_current",
]
OUTAGE_FEATURES = [
    "hour_of_day",
    "month",
    "wind_speed",
    "rainfall_mm",
    "temperature",
    "load_pct",
    "line_age_years",
    "voltage_kv",
]
NDVI_FEATURES = ["ndvi", "ndvi_3m_delta", "ndvi_6m_delta", "ndvi_stddev", "terrain_slope"]
DLL_FEATURES = ["ambient_temp", "wind_speed", "solar_radiation", "line_length_km", "voltage_220", "voltage_400", "voltage_765"]


class SimpleAutoencoder(nn.Module):
    def __init__(self, n_features: int) -> None:
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(n_features, 16),
            nn.ReLU(),
            nn.Linear(16, 8),
            nn.ReLU(),
        )
        self.decoder = nn.Sequential(
            nn.Linear(8, 16),
            nn.ReLU(),
            nn.Linear(16, n_features),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.decoder(self.encoder(x))


@dataclass
class LoadedAnomalyModel:
    model: SimpleAutoencoder
    threshold: float
    feature_names: list[str]
    mean: np.ndarray
    std: np.ndarray


class ModelRegistry:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.rul_model: Any | None = None
        self.outage_model: Any | None = None
        self.outage_label_encoder: Any | None = None
        self.dll_model: Any | None = None
        self.ndvi_risk_model: Any | None = None
        self.ndvi_risk_encoder: Any | None = None
        self.prophet_model: Any | None = None
        self.load_residual_model: Any | None = None
        self.vegetation_forecasters: dict[str, Any] = {}
        self.anomaly_model: LoadedAnomalyModel | None = None
        self.loaded_artifacts: list[str] = []

    def _resolve_model_path(self, filename: str) -> Path:
        for candidate_dir in self.settings.model_dir_candidates:
            candidate = candidate_dir / filename
            if candidate.exists():
                return candidate

        if self.settings.huggingface_model_repo:
            downloaded = hf_hub_download(repo_id=self.settings.huggingface_model_repo, filename=filename)
            return Path(downloaded)

        raise FileNotFoundError(f"Unable to resolve model artifact: {filename}")

    def _load_pickle(self, filename: str) -> Any:
        path = self._resolve_model_path(filename)
        with path.open("rb") as handle:
            payload = pickle.load(handle)
        self.loaded_artifacts.append(filename)
        return payload

    def load_all(self) -> None:
        self.rul_model = self._load_pickle("rul_model.pkl")
        self.outage_model = self._load_pickle("outage_classifier.pkl")
        self.outage_label_encoder = self._load_pickle("outage_label_encoder.pkl")
        self.dll_model = self._load_pickle("dll_predictor.pkl")
        self.ndvi_risk_model = self._load_pickle("ndvi_risk_classifier.pkl")
        self.ndvi_risk_encoder = self._load_pickle("ndvi_risk_encoder.pkl")
        self.prophet_model = self._load_pickle("load_forecast_prophet.pkl")
        self.load_residual_model = self._load_pickle("load_forecast_xgb_residual.pkl")
        self.vegetation_forecasters = self._load_pickle("vegetation_forecasters.pkl")

        checkpoint = torch.load(
            self._resolve_model_path("anomaly_autoencoder.pt"),
            map_location="cpu",
            weights_only=False,
        )
        autoencoder = SimpleAutoencoder(len(checkpoint["feature_names"]))
        autoencoder.load_state_dict(checkpoint["model_state_dict"])
        autoencoder.eval()
        self.anomaly_model = LoadedAnomalyModel(
            model=autoencoder,
            threshold=float(checkpoint["threshold"]),
            feature_names=list(checkpoint["feature_names"]),
            mean=np.array(checkpoint["mean"]),
            std=np.array(checkpoint["std"]),
        )
        self.loaded_artifacts.append("anomaly_autoencoder.pt")

    def predict_rul_for_asset(self, asset_id: str) -> dict[str, Any]:
        assets_df, sensor_df, _, _, _, _ = get_frames()
        asset_row = assets_df.loc[assets_df["asset_id"] == asset_id].iloc[0]
        asset_history = sensor_df.loc[sensor_df["asset_id"] == asset_id].sort_values("timestamp")
        features = calculate_rul_features(asset_row, asset_history)
        payload = pd.DataFrame([[features[column] for column in RUL_FEATURES]], columns=RUL_FEATURES)
        predicted = float(self.rul_model.predict(payload)[0])
        latest = asset_history.iloc[-1]
        health = compute_health_index(latest)
        severity = "critical" if predicted < 90 else "warning" if predicted < 180 else "stable"
        confidence = float(np.clip(0.94 - abs(predicted - 180.0) / 500.0, 0.52, 0.93))
        return {
            "asset_id": asset_id,
            "rul_days": round(predicted, 1),
            "health_index": round(health, 1),
            "severity": severity,
            "confidence": round(confidence, 2),
            "features": {key: round(float(value), 3) for key, value in features.items()},
        }

    def predict_anomaly_for_asset(self, asset_id: str) -> dict[str, Any]:
        _, sensor_df, _, _, _, _ = get_frames()
        asset_history = sensor_df.loc[sensor_df["asset_id"] == asset_id].sort_values("timestamp")
        recent = asset_history.tail(72)[self.anomaly_model.feature_names].values
        normalized = (recent - self.anomaly_model.mean) / self.anomaly_model.std
        tensor = torch.tensor(normalized, dtype=torch.float32)
        with torch.no_grad():
            reconstructed = self.anomaly_model.model(tensor)
            mse = torch.mean((tensor - reconstructed) ** 2, dim=1).numpy()

        score = float(np.max(mse))
        driver_values = pd.Series(np.abs(normalized[-1]), index=self.anomaly_model.feature_names).sort_values(ascending=False)
        drivers = [
            {"feature": feature.replace("_", " ").title(), "score": round(float(value), 3)}
            for feature, value in driver_values.head(4).items()
        ]
        severity = "critical" if score > self.anomaly_model.threshold * 1.35 else "warning" if score > self.anomaly_model.threshold else "stable"
        confidence = float(np.clip(score / max(self.anomaly_model.threshold * 2.0, 1e-6), 0.55, 0.96))
        return {
            "asset_id": asset_id,
            "score": round(score, 4),
            "threshold": round(self.anomaly_model.threshold, 4),
            "is_detected": score >= self.anomaly_model.threshold,
            "severity": severity,
            "confidence": round(confidence, 2),
            "drivers": drivers,
        }

    def forecast_load(self, horizon: int = 7) -> dict[str, Any]:
        _, _, posoco_df, _, _, _ = get_frames()
        daily = (
            posoco_df.assign(day=pd.to_datetime(posoco_df["timestamp"]).dt.floor("D"))
            .groupby("day", as_index=False)
            .agg(
                y=("demand_mw", "mean"),
                temperature=("temperature", "mean"),
                solar_radiation=("solar_radiation", "mean"),
                wind_speed=("wind_speed", "mean"),
            )
            .rename(columns={"day": "ds"})
        )
        future = self.prophet_model.make_future_dataframe(periods=horizon, freq="D")
        recent_weather = daily.tail(21)
        weekday_weather = recent_weather.assign(weekday=recent_weather["ds"].dt.dayofweek).groupby("weekday").agg(
            temperature=("temperature", "mean"),
            solar_radiation=("solar_radiation", "mean"),
            wind_speed=("wind_speed", "mean"),
        )
        future["weekday"] = future["ds"].dt.dayofweek
        future = future.merge(weekday_weather, left_on="weekday", right_index=True, how="left")
        fallback_weather = recent_weather[["temperature", "solar_radiation", "wind_speed"]].mean()
        for column in ["temperature", "solar_radiation", "wind_speed"]:
            future[column] = future[column].fillna(float(fallback_weather[column]))

        prophet_forecast = self.prophet_model.predict(future[["ds", "temperature"]])
        residual_features = future[["temperature", "solar_radiation", "wind_speed"]].values
        residual_adjustment = self.load_residual_model.predict(residual_features)

        rows = []
        for index in range(len(future) - horizon, len(future)):
            baseline = float(prophet_forecast.iloc[index]["yhat"])
            adjusted = baseline + float(residual_adjustment[index])
            band = max(220.0, adjusted * 0.05)
            rows.append(
                {
                    "date": pd.Timestamp(future.iloc[index]["ds"]).date().isoformat(),
                    "forecastMw": round(adjusted, 1),
                    "lowerMw": round(adjusted - band, 1),
                    "upperMw": round(adjusted + band, 1),
                }
            )

        return {
            "region": "ER-I",
            "horizon_days": horizon,
            "severity": "watch" if max(item["forecastMw"] for item in rows) > 9100 else "stable",
            "confidence": 0.79,
            "forecast": rows,
        }

    def predict_outage_cause(self, payload: dict[str, float]) -> dict[str, Any]:
        frame = pd.DataFrame([[payload[column] for column in OUTAGE_FEATURES]], columns=OUTAGE_FEATURES)
        probabilities = self.outage_model.predict_proba(frame)[0]
        best_index = int(np.argmax(probabilities))
        label = str(self.outage_label_encoder.inverse_transform([best_index])[0])
        confidence = float(probabilities[best_index])
        severity = "critical" if label in {"Equipment Failure", "Lightning"} else "warning" if confidence > 0.7 else "watch"
        ranked = sorted(
            [
                {
                    "label": str(label_name),
                    "probability": round(float(probability), 3),
                }
                for label_name, probability in zip(self.outage_label_encoder.classes_, probabilities, strict=False)
            ],
            key=lambda item: item["probability"],
            reverse=True,
        )
        return {
            "predicted_cause": label,
            "confidence": round(confidence, 2),
            "severity": severity,
            "top_candidates": ranked[:3],
        }

    def predict_ndvi_risk(self, payload: dict[str, float]) -> dict[str, Any]:
        frame = pd.DataFrame([[payload[column] for column in NDVI_FEATURES]], columns=NDVI_FEATURES)
        encoded = int(self.ndvi_risk_model.predict(frame)[0])
        probabilities = self.ndvi_risk_model.predict_proba(frame)[0]
        label = str(self.ndvi_risk_encoder.inverse_transform([encoded])[0])
        confidence = float(np.max(probabilities))
        severity = "critical" if label == "Critical" else "warning" if label in {"High", "Medium"} else "stable"
        return {
            "risk_label": label,
            "confidence": round(confidence, 2),
            "severity": severity,
            "threshold_label": classify_ndvi_risk(payload["ndvi"], payload["ndvi_3m_delta"]),
        }

    def predict_dll(self, ambient_temp: float, wind_speed: float, solar_radiation: float, line_length_km: float, voltage_kv: int) -> dict[str, Any]:
        payload = {
            "ambient_temp": ambient_temp,
            "wind_speed": wind_speed,
            "solar_radiation": solar_radiation,
            "line_length_km": line_length_km,
            "voltage_220": 1 if voltage_kv == 220 else 0,
            "voltage_400": 1 if voltage_kv == 400 else 0,
            "voltage_765": 1 if voltage_kv == 765 else 0,
        }
        frame = pd.DataFrame([[payload[column] for column in DLL_FEATURES]], columns=DLL_FEATURES)
        utilization = float(self.dll_model.predict(frame)[0])
        return {
            "dll_utilization_pct": round(utilization, 1),
            "severity": "critical" if utilization >= 90 else "warning" if utilization >= 80 else "stable",
        }
