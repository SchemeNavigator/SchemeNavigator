import sys
from types import SimpleNamespace

import app.agents as agents_package
import app.graph as graph_package
import app.llm as llm_package
import app.llm.exceptions as llm_exceptions
import app.models.agent_models as agent_models_package
import app.models as models_package
import app.repositories as repositories_package
import app.services as services_package

sys.modules.setdefault("app.agents.agents", agents_package)
sys.modules.setdefault("app.agents.graph", graph_package)
sys.modules.setdefault("app.agents.llm", llm_package)
sys.modules.setdefault("app.agents.llm.exceptions", llm_exceptions)
sys.modules.setdefault("app.agents.models", models_package)
sys.modules.setdefault("app.agents.models.agent_models", agent_models_package)
sys.modules.setdefault("app.agents.repositories", repositories_package)
sys.modules.setdefault("app.agents.services", services_package)

from app.agents.planner.planner_agent import PlannerAgentImpl
from app.agents.planner.planner_models import PlannerResultDetailed, RoadmapStep
from app.agents.verification.models import (
    ConsistencyReport,
    DocumentReport,
    EligibilityAssessment,
    VerificationResult,
    WorkflowReport,
)
from app.agents.verification.verification_agent import VerificationAgent
from app.graph.context import ExecutionContext
from app.graph.state import WorkflowState
from app.llm.exceptions import JSONParsingError
from app.models.agent_models import VerificationResult as StateVerificationResult


class MockLLM:
    def __init__(self, result=None, exc=None):
        self.result = result
        self.exc = exc

    def generate_json(self, prompt_name, variables, model):
        if self.exc:
            raise self.exc
        return self.result


def planner_result():
    return PlannerResultDetailed(
        application_roadmap=[
            RoadmapStep(
                step=1,
                title="Collect identity document",
                description="Collect the supported identity document.",
                estimated_time_minutes=30,
                dependencies=[],
                completion_criteria="Identity document is ready.",
            )
        ],
        timeline=[],
        required_documents=[],
        document_descriptions={},
        eligibility_summary=None,
        estimated_effort=None,
        estimated_duration=None,
        warnings=[],
        tips=[],
        common_mistakes=[],
        next_action=None,
        application_summary=None,
    )


def verification_result():
    return StateVerificationResult(verification_status="Review required", notes=[])


def planner_state():
    state = WorkflowState()
    state.next_node = "planner"
    state.metadata = SimpleNamespace()

    class SelectedScheme:
        scheme_id = "scheme-1"
        scheme_name = "Example Scheme"

    class CandidateScheme:
        slug = "scheme-1"
        scheme_name = "Example Scheme"
        details = "Example details"
        benefits = "Example benefits"
        eligibility = "Example eligibility"
        documents = "Identity document"
        application = "Apply using the supplied process"
        level = "State"

    state.selected_scheme = SelectedScheme()
    state.candidate_schemes = [CandidateScheme()]
    return state


def test_planner_success_routes_to_verification():
    state = planner_state()
    context = ExecutionContext(state=state, llm_service=MockLLM(result=planner_result()))

    updated = PlannerAgentImpl(context).plan(state)

    assert updated.next_node == "verification"


def test_planner_recoverable_failure_clears_stale_route():
    state = planner_state()
    context = ExecutionContext(state=state, llm_service=MockLLM(exc=JSONParsingError("invalid JSON")))

    updated = PlannerAgentImpl(context).plan(state)

    assert updated.next_node != "planner"
    assert updated.next_node is None


def test_verification_success_terminates_routing(monkeypatch):
    state = WorkflowState(next_node="verification")
    context = ExecutionContext(state=state, llm_service=MockLLM(result=verification_result()))

    class WorkflowResultStub:
        def __init__(self, **values):
            self.values = values

    import app.models.agent_models as agent_models

    monkeypatch.setattr(agent_models, "WorkflowResult", WorkflowResultStub)

    updated = VerificationAgent(context).verify(state)

    assert updated.next_node is None


def test_verification_recoverable_failure_clears_stale_route():
    state = WorkflowState(next_node="verification")
    context = ExecutionContext(state=state, llm_service=MockLLM(exc=JSONParsingError("invalid JSON")))

    updated = VerificationAgent(context).verify(state)

    assert updated.next_node != "verification"
    assert updated.next_node is None