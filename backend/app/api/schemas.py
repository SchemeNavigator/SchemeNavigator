"""Pydantic schemas for API request and response envelopes."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, ConfigDict

from app.models.agent_models import WorkflowResult
from app.models.survey import SurveyRequest


class ApiEnvelope(BaseModel):
    success: bool
    message: str
    version: str
    workflow_id: str | None = None
    request_id: str | None = None
    correlation_id: str | None = None
    timestamp: datetime
    execution_time: float = Field(
        default=0.0,
        validation_alias="execution_time_ms",
        serialization_alias="execution_time",
    )
    data: Any | None = None

    model_config = ConfigDict(populate_by_name=True)


class RecommendationPayload(ApiEnvelope):
    data: WorkflowResult | dict[str, Any] | None = None


class AIHealthData(BaseModel):
    backend_status: str
    csv_loaded: bool
    repository: bool
    repository_status: dict[str, Any]
    llm: dict[str, Any]
    llm_status: dict[str, Any]
    workflow: dict[str, Any]
    workflow_status: dict[str, Any]
    prompt: dict[str, Any]
    prompt_status: dict[str, Any]


class AIHealthPayload(ApiEnvelope):
    data: AIHealthData | dict[str, Any] | None = None


class WorkflowExecutionMetadata(BaseModel):
    workflow_id: str | None = None
    request_id: str | None = None
    correlation_id: str | None = None
    workflow_status: str | None = None
    current_node: str | None = None
    next_node: str | None = None
    started_at: str | None = None
    finished_at: str | None = None
    execution_time_ms: float | None = None
    node_durations_ms: dict[str, float] = Field(default_factory=dict)
    repository_duration_ms: float | None = None
    llm_duration_ms: float | None = None
    total_tokens: int | None = None
    prompt_tokens: int | None = None
    completion_tokens: int | None = None


class WorkflowDebugData(BaseModel):
    workflow_status: str | None = None
    decision_trace: list[dict[str, Any]] = Field(default_factory=list)
    execution_metadata: WorkflowExecutionMetadata | dict[str, Any]
    node_durations_ms: dict[str, float] = Field(default_factory=dict)
    workflow_result: WorkflowResult | dict[str, Any] | None = None


class WorkflowDebugPayload(ApiEnvelope):
    data: WorkflowDebugData | dict[str, Any] | None = None


__all__ = [
    "AIHealthData",
    "AIHealthPayload",
    "ApiEnvelope",
    "RecommendationPayload",
    "SurveyRequest",
    "WorkflowDebugData",
    "WorkflowDebugPayload",
    "WorkflowExecutionMetadata",
]