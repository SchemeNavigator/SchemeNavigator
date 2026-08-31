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
from app.graph.execution_manager import ExecutionManager
from app.graph.nodes import WorkflowNode
from app.graph.registry import NodeRegistry
from app.graph.state import WorkflowState
from app.llm.exceptions import JSONParsingError
from app.models.agent_models import VerificationResult as StateVerificationResult


class MockLLM:
    def __init__(self, result=None, exc=None):
        self.result = result
        self.exc = exc
        self.calls = 0

    def generate_json(self, prompt_name, variables, model):
        self.calls += 1
        if self.exc:
            raise self.exc
        return self.result


class CountingJSONParsingLLM:
    def __init__(self):
        self.calls = 0

    def generate_json(self, prompt_name, variables, model):
        self.calls += 1
        raise JSONParsingError("invalid JSON")


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


def test_planner_does_not_retry_at_agent_boundary():
    state = planner_state()
    llm = CountingJSONParsingLLM()
    context = ExecutionContext(state=state, llm_service=llm)

    updated = PlannerAgentImpl(context).plan(state)

    assert llm.calls == 1
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
    llm = MockLLM(exc=JSONParsingError("invalid JSON"))
    context = ExecutionContext(state=state, llm_service=llm)

    updated = VerificationAgent(context).verify(state)

    assert llm.calls == 1
    assert updated.next_node != "verification"
    assert updated.next_node is None


def test_verification_unrecoverable_agent_failure_clears_stale_route():
    state = WorkflowState(next_node="verification")
    context = ExecutionContext(state=state, llm_service=MockLLM(exc=RuntimeError("provider failed")))

    updated = VerificationAgent(context).verify(state)

    assert updated.next_node is None
    assert updated.errors[-1].recoverable is False


def test_unrecoverable_verification_exception_terminates_without_loop():
    calls = 0

    class FailingVerificationNode(WorkflowNode):
        name = "verification"

        def execute(self, state):
            nonlocal calls
            calls += 1
            raise ModuleNotFoundError("No module named 'app.agents.graph'")

    state = WorkflowState(next_node="verification")
    registry = NodeRegistry()
    registry.register(FailingVerificationNode)
    manager = ExecutionManager(
        context=ExecutionContext(state=state),
        registry=registry,
        config={"retry_policy": {"verification": {"retry": True}}},
    )

    updated = manager.run("verification", state)

    assert calls == 2
    assert updated.next_node is None
    assert len(updated.errors) == 2
    assert all(error.exception_type == "ModuleNotFoundError" for error in updated.errors)
    assert all(error.recoverable is False for error in updated.errors)