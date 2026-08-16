from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.api.dependencies import get_service
from app.core.response import standard_response
from app.models.response import StandardResponse
from app.api.dependencies import get_recommendation_service
from app.services.recommendation_service import RecommendationService
from app.services.scheme_service import SchemeService


router = APIRouter(tags=["System"])


@router.get(
    "/health",
    response_model=StandardResponse[dict],
    summary="Application health",
    description="Returns application status, CSV load state, and the current timestamp.",
    status_code=200,
)
def health(
    service: SchemeService = Depends(get_service),
    recommendation_service: RecommendationService = Depends(get_recommendation_service),
) -> StandardResponse[dict]:
    data = recommendation_service.build_health_snapshot()
    data["timestamp"] = datetime.now(timezone.utc).isoformat()
    data["csv_loaded"] = service.is_ready()
    return standard_response(True, "Application status", data)
