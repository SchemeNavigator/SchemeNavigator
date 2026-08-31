"""Intent extraction node: transforms survey + conversation into semantic intent.

Purpose:
    Provide a reusable node that calls the central `LLMService` to extract a
    strongly-typed `IntentResult` from the current `WorkflowState`.

Responsibilities:
    - Load prompt `intent` via the service's prompt manager (through
      `LLMService.generate_json`).
    - Validate and map the resulting `IntentResult` into the shared
      `WorkflowState.intent` and `WorkflowState.repository_query`.
    - Append a `Message` to `state.messages` documenting the extraction.
    - Update `state.metadata` with light telemetry (model used, timestamps).
    - On failure, append a structured `WorkflowError` to `state.errors`.

Notes:
    This node does not perform repository access or ranking. It only
    prepares structured intent for later stages.
"""
from __future__ import annotations

from datetime import datetime
import logging
from typing import Optional

from pydantic import BaseModel, Field

from .nodes import WorkflowNode
from .context import ExecutionContext
from .state import WorkflowState, Message, WorkflowError
from ..llm.exceptions import JSONParsingError, ModelUnavailableError


class RepositoryQueryOutput(BaseModel):
    keywords: list[str] = Field(default_factory=list)
    categories: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    levels: list[str] = Field(default_factory=list)
    filters: dict = Field(default_factory=dict)


class IntentResult(BaseModel):
    user_profile_summary: str
    repository_query: RepositoryQueryOutput
    confidence: float = 0.0
    missing_information: list[str] = Field(default_factory=list)
    reasoning: Optional[str] = None


class IntentExtractionNode(WorkflowNode):
    name = "intent_extraction"

    def __init__(self, context: ExecutionContext) -> None:
        super().__init__(context)
        self.logger = context.logger or logging.getLogger(__name__)

    def execute(self, state: WorkflowState) -> WorkflowState:
        self.logger.info("Intent Extraction Started")
        now = datetime.utcnow().isoformat()

        # gather inputs (read-only)
        survey = state.survey
        conv = state.conversation_memory

        if not survey:
            err = WorkflowError(node=self.name, message="No survey provided", exception_type="ValueError", timestamp=now, recoverable=False)
            state.errors.append(err)
            state.workflow_status = state.workflow_status
            return state

        # Prepare prompt variables
        variables = {
            "survey": survey.model_dump() if hasattr(survey, "model_dump") else {},
            "conversation_history": [m.model_dump() for m in conv.messages],
            "current_timestamp": now,
        }

        # call LLMService
        try:
            llm = self.context.llm_service
            if llm is None:
                raise ModelUnavailableError("LLMService not available in context")
            if self.context.is_cancelled():
                return self.context.stop_state(state)

            # LLMService.generate_json handles prompt loading/rendering/parsing
            intent: IntentResult = llm.generate_json("intent", variables, IntentResult)

            if self.context.is_cancelled():
                return self.context.stop_state(state)

            self.logger.info("JSON Parsed")

            # Map into WorkflowState.intent
            state.intent.keywords = intent.repository_query.keywords
            state.intent.categories = intent.repository_query.categories
            state.intent.tags = intent.repository_query.tags
            state.intent.levels = intent.repository_query.levels
            state.intent.confidence = float(intent.confidence)
            state.intent.missing_information = intent.missing_information
            state.intent.user_profile_summary = intent.user_profile_summary

            # Map into WorkflowState.repository_query
            # expanded_keywords -> repository_query.expanded_keywords
            state.repository_query.expanded_keywords = intent.repository_query.keywords
            # filters
            state.repository_query.filters = intent.repository_query.filters or {}
            # search parameters include categories/tags/levels
            state.repository_query.search_parameters = {
                "categories": intent.repository_query.categories,
                "tags": intent.repository_query.tags,
                "levels": intent.repository_query.levels,
            }

            # Append a system message documenting the extraction
            msg = Message(role="system", content=intent.user_profile_summary, timestamp=now, metadata={"node": self.name, "confidence": intent.confidence})
            state.messages.append(msg)

            # Update metadata
            try:
                model_used = getattr(llm.model, "model_name", None)
            except Exception:
                model_used = None
            state.metadata.model_used = model_used
            state.metadata.started_at = state.metadata.started_at or now
            state.metadata.finished_at = now

            self.logger.info("Workflow Updated")

            # set next node if unset
            state.next_node = state.next_node or "repository_retrieval"

            return state

        except JSONParsingError as exc:
            now2 = datetime.utcnow().isoformat()
            self.logger.exception("JSON parsing failed")
            state.errors.append(WorkflowError(node=self.name, message=str(exc), exception_type=type(exc).__name__, timestamp=now2, recoverable=True))
            return state
        except Exception as exc:
            now3 = datetime.utcnow().isoformat()
            self.logger.exception("Intent extraction failed")
            state.errors.append(WorkflowError(node=self.name, message=str(exc), exception_type=type(exc).__name__, timestamp=now3, recoverable=False))
            return state
