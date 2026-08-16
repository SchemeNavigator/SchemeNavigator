import logging
from datetime import datetime

from app.graph.recommendation_node import RecommendationNode
from app.graph.context import ExecutionContext
from app.graph.state import WorkflowState
from app.graph.recommendation_models import RecommendationResult, RecommendationEntry
from app.llm.exceptions import JSONParsingError


class FakeLLMSuccess:
    def generate_json(self, prompt_name, variables, model):
        # return a valid RecommendationResult
        rec = RecommendationEntry(
            scheme_id="s1",
            scheme_name="Scheme 1",
            overall_score=90.0,
            confidence=0.9,
            reason="Good match",
            pros=[],
            cons=[],
            eligibility_analysis=None,
            benefit_analysis=None,
            risk_analysis=None,
            required_documents_summary=None,
            recommended_priority=None,
        )
        return RecommendationResult(recommendations=[rec], summary="ok", overall_confidence=0.9)


class FakeLLMFailThenFail:
    def __init__(self):
        self.calls = 0

    def generate_json(self, prompt_name, variables, model):
        self.calls += 1
        if self.calls == 1:
            raise JSONParsingError("first parse fail")
        # second attempt also fails
        raise Exception("second attempt fail")


def test_recommendation_success_sets_planner():
    state = WorkflowState()
    ctx = ExecutionContext(state=state, llm_service=FakeLLMSuccess(), repository=None, logger=logging.getLogger("test"))
    node = RecommendationNode(ctx)

    result_state = node.execute(state)

    assert result_state.next_node == "planner"
    assert getattr(result_state, "ranked_schemes", []) is not None


def test_recommendation_failure_clears_next_node_and_appends_error():
    state = WorkflowState()
    llm = FakeLLMFailThenFail()
    ctx = ExecutionContext(state=state, llm_service=llm, repository=None, logger=logging.getLogger("test"))
    node = RecommendationNode(ctx)

    result_state = node.execute(state)

    assert result_state.next_node is None
    assert any(err.node == "recommendation" for err in result_state.errors)


def test_recommendation_never_returns_recommendation_on_failure():
    state = WorkflowState()
    llm = FakeLLMFailThenFail()
    ctx = ExecutionContext(state=state, llm_service=llm, repository=None, logger=logging.getLogger("test"))
    node = RecommendationNode(ctx)

    result_state = node.execute(state)

    assert result_state.next_node != "recommendation"
