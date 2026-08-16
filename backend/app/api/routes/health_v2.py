from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.api.dependencies import get_recommendation_service
from app.api.schemas import AIHealthPayload
from app.services.recommendation_service import RecommendationService


router = APIRouter(prefix="/api/v1/ai", tags=["AI Health"])


@router.get(
    "/health",
    response_model=AIHealthPayload,
    summary="AI workflow health",
    description="Verifies the workflow engine, LLM service, repository, and prompt manager.",
    status_code=status.HTTP_200_OK,
)
def ai_health(service: RecommendationService = Depends(get_recommendation_service)) -> AIHealthPayload:
    return service.build_ai_health_payload()
