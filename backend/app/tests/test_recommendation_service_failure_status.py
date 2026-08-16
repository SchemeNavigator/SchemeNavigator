import asyncio

import pytest

from app.core.api_config import ApiConfig
from app.core.exceptions import WorkflowDependencyError
from app.graph.state import WorkflowError as WorkflowStateError
from app.graph.state import WorkflowState, WorkflowStatus
from app.models.survey import SurveyRequest
from app.services.recommendation_service import RecommendationService


class DummyRepository:
    def is_loaded(self):
        return True


class DummyLLMService:
    model_name = "fake-model"


class DummyWorkflowEngine:
    def __init__(self, result_state_factory):
        self._result_state_factory = result_state_factory

    def new_state(self):
        return WorkflowState()

    def run(self, state):
        return self._result_state_factory(state)


def make_service(result_state_factory):
    return RecommendationService(
        workflow_engine=DummyWorkflowEngine(result_state_factory),
        repository=DummyRepository(),
        llm_service=DummyLLMService(),
        api_config=ApiConfig(),
    )


def test_recommend_success_workflow_remains_completed():
    service = make_service(lambda state: state)

    payload = asyncio.run(
        service.recommend(
            SurveyRequest(citizen_id="123", age=30, state="Odisha", category="Education"),
            request_id="req-1",
        )
    )

    assert payload.success is True
    assert payload.message == "Workflow completed successfully"
    assert payload.data is not None
    workflow_record = service.workflow_store.get(payload.workflow_id)
    assert workflow_record is not None
    assert workflow_record.state.workflow_status == WorkflowStatus.COMPLETED


def test_recommend_recoverable_error_only_does_not_trigger_failure_path():
    def final_state_factory(state):
        state.errors = [WorkflowStateError(node="intent", message="Recovered", recoverable=True)]
        return state

    service = make_service(final_state_factory)

    payload = asyncio.run(
        service.recommend(
            SurveyRequest(citizen_id="123", age=30, state="Odisha", category="Education"),
            request_id="req-2",
        )
    )

    assert payload.success is True
    assert payload.message == "Workflow completed successfully"
    workflow_record = service.workflow_store.get(payload.workflow_id)
    assert workflow_record is not None
    assert workflow_record.state.workflow_status == WorkflowStatus.COMPLETED


def test_recommend_non_recoverable_error_marks_workflow_failed_and_raises_dependency_error():
    def final_state_factory(state):
        state.errors = [WorkflowStateError(node="intent", message="Hard failure", recoverable=False)]
        return state

    service = make_service(final_state_factory)

    with pytest.raises(WorkflowDependencyError, match="non-recoverable"):
        asyncio.run(
            service.recommend(
                SurveyRequest(citizen_id="123", age=30, state="Odisha", category="Education"),
                request_id="req-3",
            )
        )

    workflow_id = next(iter(service.workflow_store.list_ids()))
    record = service.workflow_store.get(workflow_id)
    assert record is not None
    assert record.state.workflow_status == WorkflowStatus.FAILED
    assert record.state.errors[0].recoverable is False


def test_recommend_mixed_errors_treats_workflow_as_failed():
    def final_state_factory(state):
        state.errors = [
            WorkflowStateError(node="intent", message="Recoverable issue", recoverable=True),
            WorkflowStateError(node="router", message="Terminal failure", recoverable=False),
        ]
        return state

    service = make_service(final_state_factory)

    with pytest.raises(WorkflowDependencyError, match="non-recoverable"):
        asyncio.run(
            service.recommend(
                SurveyRequest(citizen_id="123", age=30, state="Odisha", category="Education"),
                request_id="req-4",
            )
        )

    workflow_id = next(iter(service.workflow_store.list_ids()))
    record = service.workflow_store.get(workflow_id)
    assert record is not None
    assert record.state.workflow_status == WorkflowStatus.FAILED


def test_non_recoverable_workflow_failure_raises_503_via_app_exception_handler(client):
    from app.api.dependencies import get_recommendation_service

    class DummyService:
        async def recommend(self, survey, request_id: str, correlation_id=None):
            raise WorkflowDependencyError("Workflow failed because a non-recoverable workflow error occurred")

    def override_recommendation_service(request):
        return DummyService()

    client.app.dependency_overrides[get_recommendation_service] = override_recommendation_service
    try:
        response = client.post(
            "/api/v1/recommendations",
            json={"citizen_id": "123", "age": 30, "state": "Odisha", "category": "Education"},
        )
        assert response.status_code == 503
        body = response.json()
        assert body["success"] is False
        assert "non-recoverable" in body["message"].lower()
    finally:
        client.app.dependency_overrides.clear()
