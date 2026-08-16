from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.api.dependencies import get_api_configuration, get_recommendation_service
from app.api.schemas import WorkflowDebugPayload
from app.services.recommendation_service import RecommendationService


router = APIRouter(prefix="/api/v1", tags=["Workflow Debug"])


@router.get(
    "/workflow/{workflow_id}",
    response_model=WorkflowDebugPayload,
    summary="Inspect workflow execution",
    description="Returns execution metadata and decision trace for a stored workflow run.",
    status_code=status.HTTP_200_OK,
)
def get_workflow_debug(
    workflow_id: str,
    request: Request,
    service: RecommendationService = Depends(get_recommendation_service),
    api_config=Depends(get_api_configuration),
) -> WorkflowDebugPayload:
    if not api_config.debug:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow debug endpoint is disabled")

    response = service.build_workflow_debug_payload(workflow_id)
    request.state.workflow_id = workflow_id
    return response
