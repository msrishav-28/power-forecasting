from __future__ import annotations

import sys
import unittest
import warnings
from pathlib import Path

warnings.filterwarnings(
    "ignore",
    message="numpy.core.multiarray is deprecated.*",
    category=DeprecationWarning,
)


REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = REPO_ROOT / "backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.append(str(BACKEND_ROOT))

from app.services.snapshot_builder import build_split_snapshots


class SnapshotContractTests(unittest.TestCase):
    def test_split_snapshot_shape(self) -> None:
        payload = build_split_snapshots()

        self.assertEqual(set(payload.keys()), {"meta", "assets", "grid", "corridors"})
        self.assertIn("filters", payload["meta"])
        self.assertTrue(payload["assets"]["assets"])
        self.assertTrue(payload["grid"]["loadForecast"])
        self.assertTrue(payload["corridors"]["segments"])

        asset = payload["assets"]["assets"][0]
        self.assertIn("assetId", asset)
        self.assertIn("history", asset)

        corridor = payload["corridors"]["segments"][0]
        self.assertIn("geometry", corridor)
        self.assertIn("forecast", corridor)
