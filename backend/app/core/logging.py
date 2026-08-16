import logging
import time
from typing import Callable

from fastapi import Request, Response


class SafeRequestFormatter(logging.Formatter):
    """Formatter that guarantees request context fields are present."""

    _DEFAULTS = {
        "request_id": "-",
        "correlation_id": "-",
        "workflow_id": "-",
    }

    def format(self, record: logging.LogRecord) -> str:
        for key, value in self._DEFAULTS.items():
            if not hasattr(record, key):
                setattr(record, key, value)
        return super().format(record)


def configure_logging(level: str = "INFO") -> None:
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper(), logging.INFO))

    fmt = "%(asctime)s | %(levelname)s | %(name)s | request_id=%(request_id)s | correlation_id=%(correlation_id)s | workflow_id=%(workflow_id)s | %(message)s"

    if not root_logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(SafeRequestFormatter(fmt))
        root_logger.addHandler(handler)
    else:
        for handler in root_logger.handlers:
            handler.setFormatter(SafeRequestFormatter(fmt))

    try:
        from app.middleware.request_tracking import RequestContextFilter
    except Exception:
        return

    if not any(isinstance(log_filter, RequestContextFilter) for log_filter in root_logger.filters):
        root_logger.addFilter(RequestContextFilter())

    for handler in root_logger.handlers:
        if not any(isinstance(log_filter, RequestContextFilter) for log_filter in handler.filters):
            handler.addFilter(RequestContextFilter())


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


class RequestLoggerMixin:
    async def request_logging_middleware(self, request: Request, call_next: Callable) -> Response:
        logger = get_logger("scheme_navigator.request")
        start_time = time.perf_counter()
        logger.info("Incoming request: %s %s", request.method, request.url.path)
        try:
            response = await call_next(request)
        except Exception:
            logger.exception("Server error while processing request: %s %s", request.method, request.url.path)
            raise
        elapsed_ms = (time.perf_counter() - start_time) * 1000
        logger.info("Response sent: %s %s -> %s in %.2fms", request.method, request.url.path, response.status_code, elapsed_ms)
        return response
