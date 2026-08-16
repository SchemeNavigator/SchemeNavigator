from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.logging import get_logger
from app.core.response import standard_response


logger = get_logger(__name__)


class AppError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class NotFoundError(AppError):
    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__(message, status_code=404)


class BadRequestError(AppError):
    def __init__(self, message: str = "Bad request") -> None:
        super().__init__(message, status_code=400)


class CSVLoadError(AppError):
    def __init__(self, message: str = "Unable to load CSV data") -> None:
        super().__init__(message, status_code=500)


class WorkflowError(AppError):
    def __init__(self, message: str = "Workflow execution failed") -> None:
        super().__init__(message, status_code=503)


class WorkflowTimeoutError(WorkflowError):
    def __init__(self, message: str = "Workflow execution timed out") -> None:
        super().__init__(message)
        self.status_code = 503


class WorkflowDependencyError(WorkflowError):
    def __init__(self, message: str = "Workflow dependency unavailable") -> None:
        super().__init__(message)
        self.status_code = 503


class WorkflowValidationError(AppError):
    def __init__(self, message: str = "Workflow validation failed") -> None:
        super().__init__(message, status_code=422)


class WorkflowNotFoundError(NotFoundError):
    def __init__(self, message: str = "Workflow not found") -> None:
        super().__init__(message)


class RateLimitError(AppError):
    def __init__(self, message: str = "Rate limit exceeded") -> None:
        super().__init__(message, status_code=429)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        logger.warning("Client error: %s", exc.detail)
        return JSONResponse(
            status_code=exc.status_code,
            content=standard_response(False, str(exc.detail), None).model_dump(),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
        logger.warning("Validation error: %s", exc.errors())
        return JSONResponse(
            status_code=422,
            content=standard_response(False, "Validation failed", {"errors": exc.errors()}).model_dump(),
        )

    @app.exception_handler(AppError)
    async def app_exception_handler(_: Request, exc: AppError) -> JSONResponse:
        logger.warning("Application error: %s", exc.message)
        return JSONResponse(
            status_code=exc.status_code,
            content=standard_response(False, exc.message, None).model_dump(),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled server error")
        return JSONResponse(
            status_code=500,
            content=standard_response(False, "Internal server error", None).model_dump(),
        )
