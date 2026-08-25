from ..planner.planner_agent import PlannerAgentImpl
from ..planner.planner_models import PlannerResultDetailed, RoadmapStep
from ..planner.scheme_extractor import extract_scheme_context
from ..planner.timeline_builder import build_timeline
from ..context import ExecutionContext
from ...graph.state import WorkflowState


class MockLLM:
    def __init__(self, result=None, exc=None):
        self._result = result
        self._exc = exc

    def generate_json(self, prompt_name, variables, model):
        if self._exc:
            raise self._exc
        return self._result


def test_scheme_extractor_and_timeline():
    class S: pass
    s = S(); s.slug = "s1"; s.scheme_name = "A"; s.details = "desc"; s.benefits = "ben"; s.eligibility = "elig"; s.documents = "ID;Income"; s.application = "apply"; s.level = "national"; s.scheme_category = "Education"
    ctx = extract_scheme_context(s, [s])
    assert ctx["scheme_name"] == "A"
    timeline = build_timeline(ctx)
    assert isinstance(timeline, list)


def test_planner_agent_success():
    state = WorkflowState()
    # selected_scheme minimal
    class Sel: pass
    sel = Sel(); sel.scheme_id = "s1"; sel.scheme_name = "A"
    # candidate schemes provide details
    class S: pass
    s = S(); s.slug = "s1"; s.scheme_name = "A"; s.details = "desc"; s.benefits = "ben"; s.eligibility = "elig"; s.documents = "ID;Income"; s.application = "apply"; s.level = "national"; s.scheme_category = "Education"
    state.selected_scheme = sel
    state.candidate_schemes = [s]

    # build fake detailed planner result
    step = RoadmapStep(step=1, title="Collect ID", description="Get ID", estimated_time_minutes=60, dependencies=[], completion_criteria="Have ID")
    detailed = PlannerResultDetailed(application_roadmap=[step], timeline=[{}], required_documents=[{"name":"ID"}], document_descriptions={"ID":"Identity"}, eligibility_summary="maybe", estimated_effort="low", estimated_duration="1 day", warnings=[], tips=[], common_mistakes=[], next_action="Collect ID", application_summary="summary")

    mock = MockLLM(result=detailed)
    ctx = ExecutionContext(state=state, llm_service=mock)
    agent = PlannerAgentImpl(ctx)
    updated = agent.plan(state)
    assert updated.planner_output is not None
    assert updated.metadata.planner_result["application_roadmap"][0]["title"] == "Collect ID"
    assert updated.next_node == "verification"
