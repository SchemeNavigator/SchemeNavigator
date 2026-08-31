"""Recommendation service that executes the workflow engine for the API layer."""

from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from threading import RLock
from threading import Event
from typing import Any
from uuid import uuid4

from app.api.schemas import AIHealthData, AIHealthPayload, RecommendationPayload, WorkflowDebugData, WorkflowDebugPayload, WorkflowExecutionMetadata
from app.core.api_config import ApiConfig
from app.core.exceptions import (
    BadRequestError,
    NotFoundError,
    RateLimitError,
    WorkflowDependencyError,
    WorkflowNotFoundError,
    WorkflowTimeoutError,
    WorkflowValidationError,
)
from app.graph.state import WorkflowState, WorkflowStatus
from app.models.agent_models import PlannerResult, Recommendation, ResearchResult, VerificationResult, WorkflowResult
from app.models.survey import SurveyRequest
from app.repositories.scheme_repository import SchemeRepository
from app.utils.verification import normalize_verification_result


class UnavailableLLMService:
    """Fallback LLM service used when the environment is not configured."""

    def __init__(self) -> None:
        from app.llm.prompt_manager import PromptManager

        self.prompt_manager = PromptManager()
        self.model_name = None

    def health_check(self) -> dict[str, Any]:
        return {"healthy": False, "reason": "LLM service not configured"}

    def health(self) -> bool:
        return False

    def generate(self, prompt: str, **kwargs: Any) -> str:
        raise WorkflowDependencyError("LLM service not configured")

    def generate_json(self, prompt_name: str, variables: dict[str, Any], model: type[Any]) -> Any:
        raise WorkflowDependencyError("LLM service not configured")

    def stream(self, prompt: str, **kwargs: Any):
        raise WorkflowDependencyError("LLM service not configured")


@dataclass(slots=True)
class WorkflowRecord:
    workflow_id: str
    state: WorkflowState
    created_at: datetime
    updated_at: datetime


class WorkflowStore:
    def __init__(self) -> None:
        self._records: dict[str, WorkflowRecord] = {}
        self._lock = RLock()

    def save(self, workflow_id: str, state: WorkflowState) -> WorkflowRecord:
        now = datetime.now(timezone.utc)
        with self._lock:
            record = WorkflowRecord(
                workflow_id=workflow_id,
                state=state,
                created_at=self._records.get(workflow_id, WorkflowRecord(workflow_id, state, now, now)).created_at,
                updated_at=now,
            )
            self._records[workflow_id] = record
            return record

    def get(self, workflow_id: str) -> WorkflowRecord | None:
        with self._lock:
            return self._records.get(workflow_id)

    def list_ids(self) -> list[str]:
        with self._lock:
            return sorted(self._records.keys())


class RecommendationService:
    def __init__(
        self,
        workflow_engine: Any,
        repository: SchemeRepository,
        llm_service: Any,
        api_config: ApiConfig,
        workflow_store: WorkflowStore | None = None,
    ) -> None:
        self.workflow_engine = workflow_engine
        self.repository = repository
        self.llm_service = llm_service
        self.api_config = api_config
        self.workflow_store = workflow_store or WorkflowStore()
        self.prompt_manager = getattr(llm_service, "prompt_manager", None)
        self._workflow_timeout_seconds = max(
            0.1,
            min(float(api_config.timeout_seconds), float(api_config.maximum_execution_time_seconds)),
        )

    def is_ready(self) -> bool:
        return bool(self.repository and self.repository.is_loaded())

    def _component_status(self, healthy: bool, detail: str | None = None, **extra: Any) -> dict[str, Any]:
        status = "healthy" if healthy else "unhealthy"
        payload = {"status": status, "healthy": healthy, "detail": detail}
        payload.update({key: value for key, value in extra.items() if value is not None})
        return payload

    def build_health_snapshot(self) -> dict[str, Any]:
        repository_ready = bool(self.repository and self.repository.is_loaded())
        llm_health = self._llm_health()
        workflow_health = self._workflow_health()
        prompt_health = self._prompt_health()
        return {
            "backend_status": "healthy",
            "csv_loaded": repository_ready,
            "repository": repository_ready,
            "repository_status": self._component_status(repository_ready, "CSV repository loaded" if repository_ready else "CSV repository unavailable"),
            "llm": llm_health,
            "llm_status": llm_health,
            "workflow": workflow_health,
            "workflow_status": workflow_health,
            "prompt": prompt_health,
            "prompt_status": prompt_health,
        }

    def build_ai_health_payload(self) -> AIHealthPayload:
        snapshot = self.build_health_snapshot()
        return AIHealthPayload(
            success=True,
            message="AI health check completed",
            version=self.api_config.version,
            workflow_id=None,
            timestamp=datetime.now(timezone.utc),
            execution_time=0.0,
            data=AIHealthData(**snapshot),
        )

    def _llm_health(self) -> dict[str, Any]:
        if self.llm_service is None:
            return self._component_status(False, "LLM service unavailable")

        health_check = getattr(self.llm_service, "health_check", None)
        if callable(health_check):
            try:
                result = health_check()
            except Exception as exc:
                return self._component_status(False, str(exc))
            if isinstance(result, dict):
                healthy = bool(result.get("healthy"))
                detail = result.get("reason") or result.get("detail")
                return self._component_status(healthy, detail, latency_ms=result.get("latency_ms"))
            return self._component_status(bool(result), None)

        return self._component_status(True, "LLM service available")

    def _workflow_health(self) -> dict[str, Any]:
        if self.workflow_engine is None:
            return self._component_status(False, "Workflow engine unavailable")

        try:
            sequence = list(self.workflow_engine.builder.build())
        except Exception as exc:
            return self._component_status(False, str(exc))

        return self._component_status(bool(sequence), "Workflow engine ready", sequence=sequence)

    def _prompt_health(self) -> dict[str, Any]:
        prompt_manager = self.prompt_manager
        if prompt_manager is None:
            return self._component_status(False, "Prompt manager unavailable")
        return self._component_status(True, "Prompt manager available")

    async def recommend(self, survey: SurveyRequest, request_id: str, correlation_id: str | None = None) -> RecommendationPayload:
        if survey is None:
            raise BadRequestError("Survey payload is required")

        if self.workflow_engine is None:
            raise WorkflowDependencyError("Workflow engine unavailable")

        workflow_id = str(uuid4())
        started_at = datetime.now(timezone.utc)
        start_time = time.perf_counter()

        from app.middleware.request_tracking import set_workflow_context

        set_workflow_context(workflow_id)

        state = self.workflow_engine.new_state()
        state.survey = survey
        state.workflow_status = WorkflowStatus.RUNNING
        state.metadata.workflow_id = workflow_id
        state.metadata.session_id = request_id
        state.metadata.started_at = started_at.isoformat()
        state.metadata.model_used = getattr(self.llm_service, "model_name", None)
        state._cancellation_event = Event()
        self.workflow_store.save(workflow_id, state)

        try:
            final_state = await asyncio.wait_for(
                asyncio.to_thread(self.workflow_engine.run, state),
                timeout=self._workflow_timeout_seconds,
            )
        except asyncio.TimeoutError as exc:
            state._cancellation_event.set()
            state.workflow_status = WorkflowStatus.CANCELLED
            state.metadata.finished_at = datetime.now(timezone.utc).isoformat()
            self.workflow_store.save(workflow_id, state)
            raise WorkflowTimeoutError("Workflow execution timed out") from exc
        except RateLimitError:
            state.workflow_status = WorkflowStatus.FAILED
            self.workflow_store.save(workflow_id, state)
            raise
        except (WorkflowValidationError, WorkflowDependencyError):
            state.workflow_status = WorkflowStatus.FAILED
            self.workflow_store.save(workflow_id, state)
            raise
        except Exception:
            state.workflow_status = WorkflowStatus.FAILED
            state.metadata.finished_at = datetime.now(timezone.utc).isoformat()
            self.workflow_store.save(workflow_id, state)
            raise
        else:
            has_non_recoverable_error = any(
                getattr(error, "recoverable", False) is False
                for error in getattr(final_state, "errors", []) or []
            )

            if has_non_recoverable_error:
                final_state.workflow_status = WorkflowStatus.FAILED
                final_state.metadata.workflow_id = workflow_id
                final_state.metadata.finished_at = datetime.now(timezone.utc).isoformat()
                self.workflow_store.save(workflow_id, final_state)

                error_messages = [
                    str(getattr(error, "message", None) or "Workflow error")
                    for error in getattr(final_state, "errors", []) or []
                    if getattr(error, "recoverable", False) is False
                ]
                failure_message = "; ".join(error_messages) or "Workflow failed because a non-recoverable workflow error occurred"
                raise WorkflowDependencyError(
                    f"Workflow failed because a non-recoverable workflow error occurred: {failure_message}"
                )

            if self.api_config.require_verification and getattr(final_state, "verification_output", None) is None:
                final_state.workflow_status = WorkflowStatus.FAILED
                final_state.metadata.workflow_id = workflow_id
                final_state.metadata.finished_at = datetime.now(timezone.utc).isoformat()
                self.workflow_store.save(workflow_id, final_state)
                raise WorkflowDependencyError("Workflow verification did not complete")

            final_state.workflow_status = WorkflowStatus.COMPLETED
            final_state.metadata.workflow_id = workflow_id
            final_state.metadata.finished_at = datetime.now(timezone.utc).isoformat()
            self.workflow_store.save(workflow_id, final_state)

        workflow_result = self._build_workflow_result(final_state, workflow_id, request_id, correlation_id)
        final_state.final_response = workflow_result
        final_state.metadata.finished_at = final_state.metadata.finished_at or datetime.now(timezone.utc).isoformat()
        self.workflow_store.save(workflow_id, final_state)

        execution_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return RecommendationPayload(
            success=True,
            message="Workflow completed successfully",
            version=self.api_config.version,
            workflow_id=workflow_id,
            request_id=request_id,
            correlation_id=correlation_id,
            timestamp=datetime.now(timezone.utc),
            execution_time=execution_time_ms,
            data=workflow_result,
        )

    def get_workflow_record(self, workflow_id: str) -> WorkflowRecord | None:
        return self.workflow_store.get(workflow_id)

    def build_workflow_debug_payload(self, workflow_id: str) -> WorkflowDebugPayload:
        record = self.workflow_store.get(workflow_id)
        if record is None:
            raise WorkflowNotFoundError(f"Workflow '{workflow_id}' not found")

        state = record.state
        workflow_result = getattr(state, "final_response", None)
        execution_metadata = self._build_execution_metadata(state, workflow_id)
        node_durations = execution_metadata.node_durations_ms
        decision_trace = self._normalize_decision_trace(getattr(getattr(state, "metadata", None), "decision_trace", []))

        return WorkflowDebugPayload(
            success=True,
            message="Workflow retrieved successfully",
            version=self.api_config.version,
            workflow_id=workflow_id,
            timestamp=datetime.now(timezone.utc),
            execution_time=0.0,
            data=WorkflowDebugData(
                workflow_status=self._stringify_status(getattr(state, "workflow_status", None)),
                decision_trace=decision_trace,
                execution_metadata=execution_metadata,
                node_durations_ms=node_durations,
                workflow_result=workflow_result,
            ),
        )

    def _build_workflow_result(
        self,
        state: WorkflowState,
        workflow_id: str,
        request_id: str,
        correlation_id: str | None,
    ) -> WorkflowResult:
        research_result = ResearchResult(
            query=getattr(getattr(state, "survey", None), "category", None),
            summary="Workflow executed successfully",
            recommendations=list(getattr(state, "ranked_schemes", []) or []),
        )

        planner_result = getattr(state, "planner_output", None) or PlannerResult()
        verification_result = self._normalize_verification_result(getattr(state, "verification_output", None))
        decision_trace = self._normalize_decision_trace(getattr(getattr(state, "metadata", None), "decision_trace", []))
        execution_metadata = self._build_execution_metadata(state, workflow_id).model_dump()

        readiness_score = self._extract_float(
            getattr(getattr(state, "verification_output", None), "overall_readiness_score", None)
        )
        if readiness_score is None:
            readiness_score = self._extract_float(getattr(getattr(state, "verification_output", None), "overall_confidence", None))

        final_verdict = getattr(getattr(state, "verification_output", None), "final_verdict", None)
        if not final_verdict:
            final_verdict = self._derive_verdict(readiness_score, verification_result)

        return WorkflowResult(
            workflow_id=workflow_id,
            request_id=request_id,
            correlation_id=correlation_id,
            recommendations=list(getattr(state, "ranked_schemes", []) or []),
            research_result=research_result,
            planner_result=planner_result,
            verification_result=verification_result,
            decision_trace=decision_trace,
            execution_metadata=execution_metadata,
            readiness_score=readiness_score,
            final_verdict=final_verdict,
        )

    def _build_execution_metadata(self, state: WorkflowState, workflow_id: str) -> WorkflowExecutionMetadata:
        execution_history = list(getattr(state, "execution_history", []) or [])
        node_durations: dict[str, float] = {}
        for step in execution_history:
            node_name = getattr(step, "node_name", None)
            duration_seconds = getattr(step, "duration_seconds", None)
            if node_name and duration_seconds is not None:
                node_durations[node_name] = round(float(duration_seconds) * 1000, 2)

        metadata = getattr(state, "metadata", None)
        return WorkflowExecutionMetadata(
            workflow_id=workflow_id,
            request_id=getattr(metadata, "session_id", None),
            correlation_id=None,
            workflow_status=self._stringify_status(getattr(state, "workflow_status", None)),
            current_node=getattr(state, "current_node", None),
            next_node=getattr(state, "next_node", None),
            started_at=getattr(metadata, "started_at", None),
            finished_at=getattr(metadata, "finished_at", None),
            execution_time_ms=self._extract_float(getattr(metadata, "latency_ms", None)),
            node_durations_ms=node_durations,
            repository_duration_ms=self._extract_float(getattr(metadata, "repository_duration_ms", None)),
            llm_duration_ms=self._extract_float(getattr(metadata, "llm_duration_ms", None)),
            total_tokens=getattr(metadata, "total_tokens", None),
            prompt_tokens=getattr(metadata, "prompt_tokens", None),
            completion_tokens=getattr(metadata, "completion_tokens", None),
        )

    def _normalize_decision_trace(self, trace: Any) -> list[dict[str, Any]]:
        normalized: list[dict[str, Any]] = []
        for item in trace or []:
            if hasattr(item, "model_dump"):
                normalized.append(item.model_dump())
            elif isinstance(item, dict):
                normalized.append(item)
            else:
                normalized.append(getattr(item, "__dict__", {"value": str(item)}))
        return normalized

    def _normalize_verification_result(self, value: Any) -> VerificationResult | None:
        return normalize_verification_result(value)

    def _derive_verdict(self, readiness_score: float | None, verification_result: VerificationResult | None) -> str:
        if verification_result and verification_result.verification_status:
            return str(verification_result.verification_status)
        if readiness_score is None:
            return "Unknown"
        if readiness_score >= 80:
            return "Ready"
        if readiness_score >= 50:
            return "Needs Review"
        return "Not Ready"

    def _extract_float(self, value: Any) -> float | None:
        try:
            if value is None:
                return None
            return float(value)
        except (TypeError, ValueError):
            return None

    def _stringify_status(self, value: Any) -> str | None:
        if value is None:
            return None
        return getattr(value, "value", str(value))
