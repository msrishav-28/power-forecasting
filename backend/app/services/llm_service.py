from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from google import genai
from google.genai import types
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.services.cache_service import build_hash, get_llm_cache, upsert_llm_cache


def _fallback_insight(scope: str, context: dict[str, Any]) -> str:
    if scope == "asset":
        return (
            f"Asset {context.get('assetId', 'unknown')} is trending at a health score of {context.get('healthIndex', 'n/a')} "
            f"with estimated RUL near {context.get('rulDays', 'n/a')} days. Prioritize inspection around thermal stress, "
            f"load margin, and dissolved gas rise before the next maintenance window."
        )
    if scope == "grid":
        return (
            f"Current ER-I demand is {context.get('currentDemandMw', 'n/a')} MW with DLL pressure near {context.get('peakDllPct', 'n/a')}%. "
            "Keep outage crews aligned to the highest-frequency causes and monitor weather-linked demand swings over the next week."
        )
    if scope == "corridor":
        return (
            f"Corridor {context.get('segmentId', 'unknown')} is showing NDVI at {context.get('latestNdvi', 'n/a')} with "
            f"three-month growth of {context.get('delta3m', 'n/a')}. Move high-risk spans into the next vegetation patrol cycle "
            "and confirm post-monsoon clearance windows."
        )
    return "Operational context is available, but no model-backed summary could be generated. Use the dashboard metrics as the source of truth."


def _build_prompt(scope: str, context: dict[str, Any], prompt: str | None) -> str:
    user_prompt = prompt or "Summarize the operational significance and recommend the next practical action."
    return (
        "You are supporting POWERGRID ER-I field and operations engineers.\n"
        f"Scope: {scope}\n"
        f"Context: {context}\n"
        f"Task: {user_prompt}\n"
        "Write 3 concise bullet points. Keep it technical, specific, and actionable."
    )


def generate_insight(db: Session, scope: str, context: dict[str, Any], prompt: str | None = None) -> dict[str, Any]:
    settings = get_settings()
    request_payload = {"scope": scope, "context": context, "prompt": prompt}
    context_hash = build_hash(request_payload)

    cached = get_llm_cache(db, context_hash)
    if cached:
        return {
            "text": cached.insight,
            "cached": True,
            "expires_at": cached.expires_at.isoformat(),
        }

    prompt_text = _build_prompt(scope, context, prompt)
    response_text: str
    if settings.gemini_api_key:
        client = genai.Client(api_key=settings.gemini_api_key)
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt_text,
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )
        response_text = response.text or _fallback_insight(scope, context)
    else:
        response_text = _fallback_insight(scope, context)

    record = upsert_llm_cache(
        db=db,
        context_hash=context_hash,
        scope=scope,
        prompt=prompt_text,
        insight=response_text,
        ttl_hours=settings.llm_cache_ttl_hours,
    )
    return {
        "text": record.insight,
        "cached": False,
        "expires_at": record.expires_at.isoformat(),
    }


def default_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()
