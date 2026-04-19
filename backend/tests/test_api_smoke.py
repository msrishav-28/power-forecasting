from __future__ import annotations

import sys
import unittest
import warnings
from pathlib import Path

import pandas as pd
from fastapi.testclient import TestClient

warnings.filterwarnings(
    "ignore",
    message="numpy.core.multiarray is deprecated.*",
    category=DeprecationWarning,
)


REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = REPO_ROOT / "backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.append(str(BACKEND_ROOT))

from app.main import app


class ApiSmokeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        assets = pd.read_csv(REPO_ROOT / "data" / "synthetic" / "assets.csv")
        segments = pd.read_csv(REPO_ROOT / "data" / "synthetic" / "corridor_segments.csv")
        cls.asset_id = str(assets.iloc[0]["asset_id"])
        cls.segment_id = str(segments.iloc[0]["segment_id"])
        cls.client_context = TestClient(app)
        cls.client = cls.client_context.__enter__()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.client_context.__exit__(None, None, None)

    def test_health_endpoint(self) -> None:
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["status"], "ok")
        self.assertIn("rul_model.pkl", payload["loaded_artifacts"])

    def test_prediction_endpoints(self) -> None:
        rul = self.client.post("/api/predict/rul", json={"asset_id": self.asset_id})
        self.assertEqual(rul.status_code, 200)
        rul_payload = rul.json()
        self.assertEqual(rul_payload["asset_id"], self.asset_id)
        self.assertIn("rul_days", rul_payload)
        self.assertIn("timestamp", rul_payload)

        anomaly = self.client.post("/api/predict/anomaly", json={"asset_id": self.asset_id})
        self.assertEqual(anomaly.status_code, 200)
        anomaly_payload = anomaly.json()
        self.assertEqual(anomaly_payload["asset_id"], self.asset_id)
        self.assertIn("drivers", anomaly_payload)

        forecast = self.client.get("/api/forecast/load?region=ER-I&horizon=5")
        self.assertEqual(forecast.status_code, 200)
        forecast_payload = forecast.json()
        self.assertEqual(forecast_payload["region"], "ER-I")
        self.assertEqual(len(forecast_payload["forecast"]), 5)

        outage = self.client.post(
            "/api/predict/outage-cause",
            json={
                "hour_of_day": 14,
                "month": 7,
                "wind_speed": 8.5,
                "rainfall_mm": 12.0,
                "temperature": 34.2,
                "load_pct": 82.5,
                "line_age_years": 11.0,
                "voltage_kv": 400,
            },
        )
        self.assertEqual(outage.status_code, 200)
        outage_payload = outage.json()
        self.assertIn("predicted_cause", outage_payload)
        self.assertIn("top_candidates", outage_payload)

        ndvi = self.client.post(
            "/api/predict/ndvi-risk",
            json={
                "segment_id": self.segment_id,
                "ndvi": 0.46,
                "ndvi_3m_delta": 0.04,
                "ndvi_6m_delta": 0.08,
                "ndvi_stddev": 0.05,
                "terrain_slope": 6.0,
            },
        )
        self.assertEqual(ndvi.status_code, 200)
        ndvi_payload = ndvi.json()
        self.assertIn("risk_label", ndvi_payload)
        self.assertIn("severity", ndvi_payload)

    def test_ai_endpoints_fallback_cleanly(self) -> None:
        insight = self.client.post(
            "/api/llm/insight",
            json={
                "scope": "asset",
                "context": {
                    "assetId": self.asset_id,
                    "healthIndex": 66,
                    "rulDays": 104,
                },
                "prompt": "Summarize maintenance priority.",
            },
        )
        self.assertEqual(insight.status_code, 200)
        insight_payload = insight.json()
        self.assertTrue(insight_payload["text"])
        self.assertIn("expires_at", insight_payload)

        rag = self.client.post(
            "/api/chat/rag",
            json={"question": "What outage pattern should engineers watch during monsoon?"},
        )
        self.assertEqual(rag.status_code, 200)
        rag_payload = rag.json()
        self.assertIn("answer", rag_payload)
        self.assertIn("citations", rag_payload)
