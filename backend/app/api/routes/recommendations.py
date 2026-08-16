from __future__ import annotations

from fastapi import APIRouter, Request, Response, status

from app.api.dependencies import get_recommendation_service
from app.api.schemas import RecommendationPayload
from app.models.survey import SurveyRequest
from app.services.recommendation_service import RecommendationService


router = APIRouter(prefix="/api/v1", tags=["Recommendations"])


@router.post(
    "/recommendations",
    response_model=RecommendationPayload,
    summary="Generate recommendation report",
    description="Executes the AI workflow and returns the full citizen recommendation report.",
    status_code=status.HTTP_200_OK,
)
async def create_recommendation(
    payload: SurveyRequest,
    request: Request,
    response: Response,
) -> RecommendationPayload:
    request_id = getattr(request.state, "request_id", None) or "-"
    correlation_id = getattr(request.state, "correlation_id", None) or request_id

    override = request.app.dependency_overrides.get(get_recommendation_service)
    if override is not None:
        try:
            service = override(request)
        except TypeError:
            service = override()
    else:
        service = get_recommendation_service(request)

    result = await service.recommend(payload, request_id=request_id, correlation_id=correlation_id)

    if hasattr(result, "data") and result.data is not None:
        if isinstance(result.data, dict):
            result.data.setdefault("workflow_id", result.workflow_id)
            result.data.setdefault("request_id", request_id)
            result.data.setdefault("correlation_id", correlation_id)
        elif hasattr(result.data, "workflow_id"):
            result.data.workflow_id = result.workflow_id
            result.data.request_id = request_id
            result.data.correlation_id = correlation_id

    request.state.workflow_id = result.workflow_id
    response.headers["X-Workflow-ID"] = result.workflow_id or ""
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Correlation-ID"] = correlation_id
    return result
