from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field

from agents.insight_agent import (
    GeminiUnavailableError,
    answer_question,
    compact,
)
from services.auth_service import get_current_user
from services.dataset_store import require_dataset


router = APIRouter(tags=["Chat"])


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    datasetId: str | None = None
    history: list[ChatTurn] = Field(default_factory=list)


def chat_context(record: dict) -> dict:
    """
    The dataset facts the assistant is allowed to use.
    """

    processing = record.get("processing") or {}

    return {
        "filename": record["original_filename"],
        "status": record.get("status"),
        "profile": processing.get("profile") or record.get("profile"),
        "original_quality_score": processing.get("original_quality_score"),
        "quality_score_after_cleaning": processing.get("quality_score"),
        "cleaning_actions": compact(processing.get("cleaning_actions", [])),
        "anomalies": compact(processing.get("anomalies", [])),
        "validation": processing.get("validation"),
        "insights": (processing.get("insights") or {}).get("insights"),
    }


@router.post("/chat")
async def chat(
    payload: ChatRequest,
    user: dict = Depends(get_current_user),
):

    context = None

    if payload.datasetId:
        record = await require_dataset(payload.datasetId, user)
        context = chat_context(record)

    try:
        return await run_in_threadpool(
            answer_question,
            payload.message,
            context,
            [turn.model_dump() for turn in payload.history],
        )

    except GeminiUnavailableError as e:
        raise HTTPException(
            status_code=503,
            detail=str(e),
        )
