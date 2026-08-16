from fastapi import HTTPException, Query, Request, status

from app.core.api_config import ApiConfig, get_api_config
from app.models.search import SchemeSearchQuery
from app.repositories.scheme_repository import SchemeRepository
from app.services.recommendation_service import RecommendationService, WorkflowStore
from app.services.scheme_service import SchemeService


def get_repository(request: Request) -> SchemeRepository:
    return request.app.state.repository


def get_service(request: Request) -> SchemeService:
    return request.app.state.service


def get_recommendation_service(request: Request) -> RecommendationService:
    service = getattr(request.app.state, "recommendation_service", None)
    if service is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Recommendation service unavailable")
    return service


def get_workflow_store(request: Request) -> WorkflowStore:
    store = getattr(request.app.state, "workflow_store", None)
    if store is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Workflow store unavailable")
    return store


def get_api_configuration(request: Request) -> ApiConfig:
    return getattr(request.app.state, "api_config", get_api_config())


def get_scheme_search_filters(
    request: Request,
    keyword: str | None = Query(default=None, description="Generic keyword search"),
    level: str | None = Query(default=None, description="Filter by level"),
    scheme_category: str | None = Query(default=None, description="Filter by scheme category"),
    tag: str | None = Query(default=None, description="Filter by tag"),
) -> SchemeSearchQuery:
    allowed_keys = {"keyword", "level", "scheme_category", "tag"}
    unexpected_keys = sorted({key for key in request.query_params.keys() if key not in allowed_keys})
    if unexpected_keys:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Unexpected query parameter(s): {', '.join(unexpected_keys)}",
        )

    return SchemeSearchQuery(keyword=keyword, level=level, scheme_category=scheme_category, tag=tag)
