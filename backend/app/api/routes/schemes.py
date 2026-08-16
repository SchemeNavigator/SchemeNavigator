from fastapi import APIRouter, Depends

from app.api.dependencies import get_service, get_scheme_search_filters
from app.core.response import standard_response
from app.models.response import StandardResponse
from app.models.search import SchemeSearchQuery
from app.models.scheme import Scheme
from app.services.scheme_service import SchemeService


router = APIRouter(prefix="/schemes", tags=["Schemes"])


@router.get(
    "",
    response_model=StandardResponse[list[Scheme]],
    summary="List all schemes",
    description="Returns every scheme available in the CSV data source.",
    status_code=200,
)
def get_all_schemes(service: SchemeService = Depends(get_service)) -> StandardResponse[list[Scheme]]:
    schemes = service.get_all_schemes()
    return standard_response(True, "Schemes retrieved successfully", schemes)


@router.get(
    "/search",
    response_model=StandardResponse[list[Scheme]],
    summary="Generic scheme search",
    description="Searches schemes by keyword, level, scheme category, and tag.",
    status_code=200,
)
def search_schemes(
    filters: SchemeSearchQuery = Depends(get_scheme_search_filters),
    service: SchemeService = Depends(get_service),
) -> StandardResponse[list[Scheme]]:
    schemes = service.search_schemes(filters)
    return standard_response(True, "Search completed successfully", schemes)


@router.get(
    "/{scheme_id}",
    response_model=StandardResponse[Scheme],
    summary="Get scheme by ID",
    description="Returns a single scheme identified by its slug.",
    status_code=200,
)
def get_scheme_by_id(scheme_id: str, service: SchemeService = Depends(get_service)) -> StandardResponse[Scheme]:
    scheme = service.get_scheme_by_id(scheme_id)
    return standard_response(True, "Scheme retrieved successfully", scheme)
