from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import InsightRequest, InsightResponse, RagChatRequest, RagChatResponse
from app.services.llm_service import generate_insight
from app.services.rag_service import answer_question


router = APIRouter(tags=["llm"])


@router.post("/llm/insight", response_model=InsightResponse)
def create_insight(payload: InsightRequest, db: Session = Depends(get_db)) -> InsightResponse:
    return InsightResponse(**generate_insight(db=db, scope=payload.scope, context=payload.context, prompt=payload.prompt))


@router.post("/chat/rag", response_model=RagChatResponse)
def rag_chat(payload: RagChatRequest, db: Session = Depends(get_db)) -> RagChatResponse:
    return RagChatResponse(**answer_question(db=db, question=payload.question))
