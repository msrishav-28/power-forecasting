from __future__ import annotations

from functools import lru_cache

import pandas as pd

from app.services.snapshot_builder import load_frames


@lru_cache(maxsize=1)
def get_frames() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    frames = load_frames()
    return tuple(frame.copy() for frame in frames)


def clear_frames_cache() -> None:
    get_frames.cache_clear()
