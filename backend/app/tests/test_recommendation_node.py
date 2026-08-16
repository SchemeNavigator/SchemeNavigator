from ..graph.recommendation_node import RecommendationNode
from ..graph.context import ExecutionContext
from ..graph.state import WorkflowState
from ..graph.recommendation_models import RecommendationResult, RecommendationEntry


class MockLLM:
    def __init__(self, result=None, exc=None):
        self._result = result
        self._exc = exc

    def generate_json(self, prompt_name, variables, model):
        if self._exc:
            raise self._exc
        return self._result


def test_recommendation_node_success():
    state = WorkflowState()
    # candidate_schemes: minimal objects with attributes used in node
    class S: pass
    s = S(); s.scheme_name = "A"; s.details = "details"; s.benefits = "ben"; s.eligibility = "elig"; s.documents = "doc"; s.level = "national"; s.scheme_category = "Education"
    state.candidate_schemes = [s]

    rec = RecommendationEntry(scheme_id="s1", scheme_name="A", overall_score=80, confidence=0.9, reason="Good match", pros=["pro"], cons=["con"], eligibility_analysis="ok", benefit_analysis="good", risk_analysis="low", required_documents_summary="doc", recommended_priority="High")
    result = RecommendationResult(recommendations=[rec], summary="top picks", overall_confidence=0.9, limitations=[], missing_information=[])

    mock = MockLLM(result=result)
    ctx = ExecutionContext(state=state, llm_service=mock)
    node = RecommendationNode(ctx)
    updated = node.execute(state)

    assert len(updated.ranked_schemes) == 1
    assert updated.selected_scheme.scheme_name == "A"


def test_recommendation_node_parsing_failure():
    state = WorkflowState()
    mock = MockLLM(exc=Exception("provider down"))
    ctx = ExecutionContext(state=state, llm_service=mock)
    node = RecommendationNode(ctx)
    updated = node.execute(state)
    assert len(updated.errors) >= 1
