"""Shared local data loading utilities without any UI framework dependency."""

from __future__ import annotations

from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data" / "synthetic"


def load_assets() -> pd.DataFrame:
    return pd.read_csv(DATA_DIR / "assets.csv")


def load_sensor_readings() -> pd.DataFrame:
    frame = pd.read_parquet(DATA_DIR / "sensor_readings.parquet")
    frame["timestamp"] = pd.to_datetime(frame["timestamp"])
    return frame


def load_posoco_data() -> pd.DataFrame:
    frame = pd.read_parquet(DATA_DIR / "posoco_grid_data.parquet")
    frame["timestamp"] = pd.to_datetime(frame["timestamp"])
    return frame


def load_outage_data() -> pd.DataFrame:
    frame = pd.read_csv(DATA_DIR / "outage_logs.csv")
    frame["timestamp"] = pd.to_datetime(frame["timestamp"])
    return frame


def load_corridor_segments() -> pd.DataFrame:
    return pd.read_csv(DATA_DIR / "corridor_segments.csv")


def load_ndvi_timeseries() -> pd.DataFrame:
    frame = pd.read_csv(DATA_DIR / "ndvi_timeseries.csv")
    frame["month"] = pd.to_datetime(frame["month"])
    return frame
