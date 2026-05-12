from __future__ import annotations

import sys
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = REPO_ROOT / "backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.append(str(BACKEND_ROOT))

from app.db.session import _normalize_database_url


class DatabaseUrlTests(unittest.TestCase):
    def test_render_style_postgresql_url_is_normalized_for_psycopg(self) -> None:
        url = "postgresql://poweruser:secret@example.com:5432/powergrid"
        self.assertEqual(
            _normalize_database_url(url),
            "postgresql+psycopg://poweruser:secret@example.com:5432/powergrid",
        )

    def test_legacy_postgres_url_is_normalized_for_psycopg(self) -> None:
        url = "postgres://poweruser:secret@example.com:5432/powergrid"
        self.assertEqual(
            _normalize_database_url(url),
            "postgresql+psycopg://poweruser:secret@example.com:5432/powergrid",
        )

    def test_existing_driver_url_is_left_unchanged(self) -> None:
        url = "postgresql+psycopg://poweruser:secret@example.com:5432/powergrid"
        self.assertEqual(_normalize_database_url(url), url)


if __name__ == "__main__":
    unittest.main()
