from __future__ import annotations

from typing import Any

from google import genai
from google.genai import types
from qdrant_client import QdrantClient
from qdrant_client.http import models as qdrant_models
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models import DocumentRecord


def _get_qdrant_client() -> QdrantClient | None:
    settings = get_settings()
    if not settings.qdrant_url:
        return None
    return QdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_api_key)


def _embed_text(client: genai.Client, text: str) -> list[float]:
    settings = get_settings()
    response = client.models.embed_content(
        model=settings.gemini_embedding_model,
        contents=text,
        config=types.EmbedContentConfig(output_dimensionality=768),
    )
    return list(response.embeddings[0].values)


def _local_document_search(db: Session, question: str, limit: int = 4) -> list[DocumentRecord]:
    tokens = [token for token in question.split() if len(token) > 3][:6]
    if not tokens:
        return []
    clauses = [DocumentRecord.content.ilike(f"%{token}%") for token in tokens]
    statement = select(DocumentRecord).where(or_(*clauses)).limit(limit)
    return list(db.scalars(statement))


def answer_question(db: Session, question: str) -> dict[str, Any]:
    settings = get_settings()
    citations: list[dict[str, Any]] = []
    context_chunks: list[str] = []

    if settings.gemini_api_key and settings.qdrant_url:
        genai_client = genai.Client(api_key=settings.gemini_api_key)
        qdrant_client = _get_qdrant_client()
        embedding = _embed_text(genai_client, question)
        results = qdrant_client.search(
            collection_name=settings.qdrant_collection,
            query_vector=embedding,
            limit=4,
            with_payload=True,
        )
        for point in results:
            payload = point.payload or {}
            context_chunks.append(payload.get("content", ""))
            citations.append(
                {
                    "title": payload.get("title", "Public document"),
                    "source": payload.get("source_url") or payload.get("source_path"),
                    "page": payload.get("page_number"),
                    "chunk": payload.get("chunk_index"),
                }
            )

        prompt = (
            "You are a POWERGRID ER-I documentation assistant.\n"
            f"Question: {question}\n"
            f"Context: {context_chunks}\n"
            "Answer briefly and only use the supplied context. End with one operational takeaway."
        )
        response = genai_client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(thinking_config=types.ThinkingConfig(thinking_budget=0)),
        )
        return {"answer": response.text or "No answer generated.", "citations": citations}

    local_hits = _local_document_search(db, question)
    if not local_hits:
        return {
            "answer": "No indexed public documents are available yet. Add PDFs under data/ingestion and run the ingestion script to enable RAG answers.",
            "citations": [],
        }

    for hit in local_hits:
        context_chunks.append(hit.content[:1200])
        citations.append(
            {
                "title": hit.document_title,
                "source": hit.source_url or hit.source_path,
                "page": hit.page_number,
                "chunk": hit.chunk_index,
            }
        )
    answer = (
        "Based on the indexed public documents, the strongest matching passages point to: "
        + " ".join(chunk[:220] for chunk in context_chunks[:2])
    )
    return {"answer": answer, "citations": citations}
