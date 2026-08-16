from fastapi import APIRouter, Depends

from app.api.dependencies import get_service
from app.core.response import standard_response
from app.models.response import StandardResponse
from app.models.survey import SurveyRequest
from app.services.scheme_service import SchemeService


router = APIRouter(tags=["Survey"])


@router.post(
    "/survey",
    response_model=StandardResponse[SurveyRequest],
    summary="Validate survey request",
    description="Validates and echoes the submitted survey payload. No AI logic runs in this phase.",
    status_code=200,
)
def submit_survey(
    payload: SurveyRequest,
    service: SchemeService = Depends(get_service),
) -> StandardResponse[SurveyRequest]:
    service.log_survey_validation_success()
    return standard_response(True, "Survey validated successfully", payload)
