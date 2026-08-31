"""Execution context provided to nodes during workflow execution."""
from __future__ import annotations

import logging
import time
from threading import Event
from typing import Any, Optional

from ..services.llm_service import LLMService
from ..repositories.scheme_repository import SchemeRepository
from .state import WorkflowState, WorkflowStatus


class ExecutionContext:
    """Hold dependencies and runtime context for node execution.

    Purpose:
    - Provide access to shared state, services and configuration without
      allowing nodes to create dependencies directly.
    """

    def __init__(
        self,
        state: WorkflowState,
        llm_service: Optional[LLMService] = None,
        repository: Optional[SchemeRepository] = None,
        logger: Optional[logging.Logger] = None,
        config: Optional[dict] = None,
        workflow_deadline: Optional[float] = None,
        cancellation_event: Optional[Event] = None,
    ) -> None:
        self.state = state
        self.llm_service = llm_service
        self.repository = repository
        self.logger = logger or logging.getLogger("workflow")
        self.config = config or {}
        self.workflow_deadline = workflow_deadline
        self.cancellation_event = cancellation_event

    def is_cancelled(self) -> bool:
        return bool(
            self.cancellation_event is not None
            and self.cancellation_event.is_set()
        ) or bool(
            self.workflow_deadline is not None
            and time.monotonic() >= self.workflow_deadline
        )

    def cancel(self) -> None:
        if self.cancellation_event is not None:
            self.cancellation_event.set()

    def stop_state(self, state: WorkflowState) -> WorkflowState:
        state.workflow_status = WorkflowStatus.CANCELLED
        state.next_node = None
        return state
