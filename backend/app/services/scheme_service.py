from typing import Callable

from fastapi import Request, Response

from app.core.logging import get_logger
from app.models.scheme import Scheme
from app.models.search import SchemeSearchQuery
from app.models.survey import SurveyRequest
from app.repositories.scheme_repository import SchemeRepository


logger = get_logger(__name__)


class SchemeService:
    def __init__(self, repository: SchemeRepository) -> None:
        self._repository = repository

    def warm_up(self) -> None:
        self._repository.load_all()

    def is_ready(self) -> bool:
        return self._repository.is_loaded()

    def get_all_schemes(self) -> list[Scheme]:
        return self._repository.load_all()

    def get_scheme_by_id(self, scheme_id: str) -> Scheme:
        return self._repository.find_by_id(scheme_id)

    def search_schemes(self, filters: SchemeSearchQuery) -> list[Scheme]:
        return self._repository.search(**filters.model_dump(exclude_none=True))

    def validate_survey(self, payload: SurveyRequest) -> SurveyRequest:
        return payload

    def log_survey_validation_success(self) -> None:
        logger.info("Validation success: survey payload accepted")

    async def request_logging_middleware(self, request: Request, call_next: Callable) -> Response:
        from app.core.logging import RequestLoggerMixin

        return await RequestLoggerMixin().request_logging_middleware(request, call_next)
