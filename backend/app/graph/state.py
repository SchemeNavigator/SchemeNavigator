"""Workflow state models and enums."""
from __future__ import annotations

from enum import Enum
from typing import Any, List, Optional

from pydantic import BaseModel, Field, PrivateAttr

from ..models.survey import SurveyRequest
from ..models.scheme import Scheme
from ..models.agent_models import (
    Recommendation,
    PlannerResult,
    VerificationResult,
    WorkflowResult,
)


class WorkflowStatus(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    WAITING = "waiting"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class NodeStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    SKIPPED = "skipped"
    FAILED = "failed"


class Intent(BaseModel):
    keywords: List[str] = Field(default_factory=list)
    categories: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    levels: List[str] = Field(default_factory=list)
    confidence: Optional[float] = None
    missing_information: List[str] = Field(default_factory=list)
    user_profile_summary: Optional[str] = None


class RepositoryQuery(BaseModel):
    expanded_keywords: List[str] = Field(default_factory=list)
    filters: dict = Field(default_factory=dict)
    search_parameters: dict = Field(default_factory=dict)
    retrieval_metadata: dict = Field(default_factory=dict)


class ConversationMemory(BaseModel):
    messages: List["Message"] = Field(default_factory=list)


class Message(BaseModel):
    role: str
    content: str
    timestamp: Optional[str] = None
    metadata: dict = Field(default_factory=dict)


ConversationMemory.update_forward_refs()


class ExecutionStep(BaseModel):
    node_name: str
    started_at: Optional[str] = None
    finished_at: Optional[str] = None
    duration_seconds: Optional[float] = None
    status: NodeStatus = NodeStatus.PENDING
    notes: Optional[str] = None


class WorkflowMetadata(BaseModel):
    workflow_id: Optional[str] = None
    session_id: Optional[str] = None
    model_used: Optional[str] = None
    total_tokens: Optional[int] = None
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    latency_ms: Optional[int] = None
    repository_results_count: Optional[int] = None
    decision_trace: List[dict[str, Any]] = Field(default_factory=list)
    recommendation_result: dict[str, Any] = Field(default_factory=dict)
    overall_confidence: Optional[float] = None
    planner_result: dict[str, Any] = Field(default_factory=dict)
    started_at: Optional[str] = None
    finished_at: Optional[str] = None


class WorkflowError(BaseModel):
    node: Optional[str] = None
    message: Optional[str] = None
    exception_type: Optional[str] = None
    timestamp: Optional[str] = None
    recoverable: bool = False


class WorkflowState(BaseModel):
    survey: Optional[SurveyRequest] = None
    intent: Intent = Field(default_factory=Intent)
    repository_query: RepositoryQuery = Field(default_factory=RepositoryQuery)
    candidate_schemes: List[Scheme] = Field(default_factory=list)
    eligible_schemes: List[Scheme] = Field(default_factory=list)
    eligibility_decisions: dict[str, dict[str, Any]] = Field(default_factory=dict)
    ranked_schemes: List[Recommendation] = Field(default_factory=list)
    selected_scheme: Optional[Recommendation] = None
    planner_output: Optional[PlannerResult] = None
    verification_output: Optional[VerificationResult] = None
    final_response: Optional[WorkflowResult] = None
    conversation_memory: ConversationMemory = Field(default_factory=ConversationMemory)
    messages: List[Message] = Field(default_factory=list)
    workflow_status: WorkflowStatus = WorkflowStatus.IDLE
    execution_history: List[ExecutionStep] = Field(default_factory=list)
    metadata: WorkflowMetadata = Field(default_factory=WorkflowMetadata)
    errors: List[WorkflowError] = Field(default_factory=list)
    current_node: Optional[str] = None
    next_node: Optional[str] = None
    _cancellation_event: Any = PrivateAttr(default=None)


class SharedState(BaseModel):
    metadata: WorkflowMetadata | None = None
    conversation_memory: ConversationMemory = Field(default_factory=ConversationMemory)
    latest_message: Message | None = None
    workflow_result: WorkflowResult | None = None

