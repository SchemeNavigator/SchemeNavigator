"""Execution context provided to nodes during workflow execution."""
from __future__ import annotations

import logging
from typing import Any, Optional

from ..services.llm_service import LLMService
from ..repositories.scheme_repository import SchemeRepository
from .state import WorkflowState


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
    ) -> None:
        self.state = state
        self.llm_service = llm_service
        self.repository = repository
        self.logger = logger or logging.getLogger("workflow")
        self.config = config or {}
