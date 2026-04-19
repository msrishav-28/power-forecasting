"""Generate split dashboard snapshots for the Vite frontend and local data cache."""

from __future__ import annotations

import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = ROOT / "backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.append(str(BACKEND_ROOT))

from app.services.snapshot_builder import write_split_snapshots


def main() -> None:
    destinations = [
        ROOT / "frontend" / "public" / "snapshots",
        ROOT / "data" / "processed" / "snapshots",
    ]
    written = write_split_snapshots(*destinations)
    for path in written:
        print(f"Wrote {path}")


if __name__ == "__main__":
    main()
