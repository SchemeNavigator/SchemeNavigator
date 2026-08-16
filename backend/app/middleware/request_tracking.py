"""Request tracking middleware and logging context helpers."""

from __future__ import annotations

import logging
import time
from contextvars import ContextVar
from typing import Callable
from uuid import uuid4

from fastapi import Request, Response


request_id_context: ContextVar[str] = ContextVar("request_id", default="-")
correlation_id_context: ContextVar[str] = ContextVar("correlation_id", default="-")
workflow_id_context: ContextVar[str] = ContextVar("workflow_id", default="-")


class RequestContextFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = getattr(record, "request_id", request_id_context.get("-"))
        record.correlation_id = getattr(record, "correlation_id", correlation_id_context.get("-"))
        record.workflow_id = getattr(record, "workflow_id", workflow_id_context.get("-"))
        return True


def set_workflow_context(workflow_id: str | None) -> None:
    workflow_id_context.set(workflow_id or "-")


async def request_tracking_middleware(request: Request, call_next: Callable) -> Response:
    logger = logging.getLogger("scheme_navigator.request")
    request_id = request.headers.get("x-request-id") or str(uuid4())
    correlation_id = request.headers.get("x-correlation-id") or request_id

    request.state.request_id = request_id
    request.state.correlation_id = correlation_id
    request.state.workflow_id = None

    request_token = request_id_context.set(request_id)
    correlation_token = correlation_id_context.set(correlation_id)
    workflow_token = workflow_id_context.set("-")

    start_time = time.perf_counter()
    logger.info("Request received: %s %s", request.method, request.url.path)

    response: Response | None = None
    try:
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start_time) * 1000
        workflow_id = getattr(request.state, "workflow_id", None) or response.headers.get("X-Workflow-ID") or "-"
        workflow_id_context.set(workflow_id)
        logger.info(
            "Response sent: %s %s -> %s in %.2fms",
            request.method,
            request.url.path,
            response.status_code,
            elapsed_ms,
        )

        response.headers["X-Request-ID"] = request_id
        response.headers["X-Correlation-ID"] = correlation_id
        if workflow_id != "-":
            response.headers["X-Workflow-ID"] = workflow_id
        return response
    except Exception:
        logger.exception("Server error while processing request: %s %s", request.method, request.url.path)
        raise
    finally:
        request_id_context.reset(request_token)
        correlation_id_context.reset(correlation_token)
        workflow_id_context.reset(workflow_token)