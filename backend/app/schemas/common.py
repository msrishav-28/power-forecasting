from __future__ import annotations

from pydantic import BaseModel, Field


class Citation(BaseModel):
    title: str
    source: str | None = None
    page: int | None = None
    chunk: int | None = None


class InsightRequest(BaseModel):
    scope: str = Field(examples=["asset", "grid", "corridor"])
    context: dict
    prompt: str | None = None


class InsightResponse(BaseModel):
    text: str
    cached: bool
    expires_at: str


class RagChatRequest(BaseModel):
    question: str


class RagChatResponse(BaseModel):
    answer: str
    citations: list[Citation]
