from __future__ import annotations

import hashlib
from pathlib import Path
import sys
from typing import Iterable

import pdfplumber
from google import genai
from google.genai import types
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, PointStruct, VectorParams

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.append(str(BACKEND_ROOT))

from app.core.config import get_settings
from app.db.models import DocumentRecord
from app.db.session import SessionLocal, init_db


def chunk_text(text: str, chunk_size: int = 1400, overlap: int = 180) -> Iterable[str]:
    cleaned = " ".join(text.split())
    start = 0
    while start < len(cleaned):
        yield cleaned[start : start + chunk_size]
        start += max(1, chunk_size - overlap)


def ensure_collection(client: QdrantClient, name: str) -> None:
    if client.collection_exists(name):
        return
    client.create_collection(
        collection_name=name,
        vectors_config=VectorParams(size=768, distance=Distance.COSINE),
    )


def main() -> None:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is required for ingestion.")
    if not settings.qdrant_url:
        raise RuntimeError("QDRANT_URL is required for ingestion.")

    source_dir = settings.ingestion_root
    pdf_paths = sorted(source_dir.glob("*.pdf"))
    if not pdf_paths:
        raise RuntimeError(f"No PDFs found in {source_dir}")

    init_db()
    client = genai.Client(api_key=settings.gemini_api_key)
    qdrant = QdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_api_key)
    ensure_collection(qdrant, settings.qdrant_collection)

    with SessionLocal() as session:
        for pdf_path in pdf_paths:
            with pdfplumber.open(pdf_path) as pdf:
                for page_index, page in enumerate(pdf.pages, start=1):
                    text = page.extract_text() or ""
                    if not text.strip():
                        continue
                    for chunk_index, chunk in enumerate(chunk_text(text)):
                        doc_id = hashlib.sha1(f"{pdf_path.name}:{page_index}:{chunk_index}".encode("utf-8")).hexdigest()
                        embed_result = client.models.embed_content(
                            model=settings.gemini_embedding_model,
                            contents=chunk,
                            config=types.EmbedContentConfig(output_dimensionality=768),
                        )
                        vector = list(embed_result.embeddings[0].values)
                        payload = {
                            "title": pdf_path.stem,
                            "source_path": str(pdf_path),
                            "page_number": page_index,
                            "chunk_index": chunk_index,
                            "content": chunk,
                        }
                        qdrant.upsert(
                            collection_name=settings.qdrant_collection,
                            wait=True,
                            points=[PointStruct(id=doc_id, vector=vector, payload=payload)],
                        )
                        session.merge(
                            DocumentRecord(
                                id=doc_id,
                                document_title=pdf_path.stem,
                                source_url=None,
                                source_path=str(pdf_path),
                                page_number=page_index,
                                chunk_index=chunk_index,
                                content=chunk,
                                metadata_json=payload,
                            )
                        )
        session.commit()

    print(f"Ingested {len(pdf_paths)} documents into {settings.qdrant_collection}.")


if __name__ == "__main__":
    main()
