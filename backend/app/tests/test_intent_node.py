from ..graph.intent_node import IntentExtractionNode, IntentResult, RepositoryQueryOutput
from ..graph.context import ExecutionContext
from ..graph.state import WorkflowState, Message
from ..models.survey import SurveyRequest


class MockLLMService:
    def __init__(self, result: IntentResult | None = None, raise_exc: Exception | None = None):
        self._result = result
        self._exc = raise_exc
        self.model = type("M", (), {"model_name": "mock-model"})()

    def generate_json(self, prompt_name: str, variables: dict, model_cls):
        if self._exc:
            raise self._exc
        # return an instance of the model_cls
        return self._result


def sample_survey():
    return SurveyRequest(age=25, gender="F", state="Delhi", category="student", minority=False, disability=False, employment_status="student", occupation="student", bpl=False, annual_income=0.0)


def test_intent_node_success():
    state = WorkflowState()
    state.survey = sample_survey()
    state.conversation_memory = state.conversation_memory

    repo_q = RepositoryQueryOutput(keywords=["scholarship", "education"], categories=["Education & Learning"], tags=["student", "financial"], levels=["national"], filters={})
    intent_result = IntentResult(user_profile_summary="A 25-year-old student from Delhi.", repository_query=repo_q, confidence=0.9, missing_information=["current_semester"], reasoning="Based on age and category")

    mock = MockLLMService(result=intent_result)
    ctx = ExecutionContext(state=state, llm_service=mock)

    node = IntentExtractionNode(ctx)
    updated = node.execute(state)

    assert updated.intent.user_profile_summary.startswith("A 25-year-old")
    assert "scholarship" in updated.intent.keywords
    assert updated.repository_query.expanded_keywords == ["scholarship", "education"]
    assert updated.metadata.model_used == "mock-model"
    assert any(m.role == "system" for m in updated.messages)


def test_intent_node_llm_failure():
    state = WorkflowState()
    state.survey = sample_survey()

    mock = MockLLMService(result=None, raise_exc=Exception("provider down"))
    ctx = ExecutionContext(state=state, llm_service=mock)
    node = IntentExtractionNode(ctx)
    updated = node.execute(state)

    assert len(updated.errors) >= 1
    assert updated.errors[-1].message == "provider down"
