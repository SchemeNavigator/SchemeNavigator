import sys

import app.agents as agents_package
import app.graph as graph_package
import app.llm as llm_package
import app.llm.exceptions as llm_exceptions
import app.models as models_package
import app.models.agent_models as agent_models_package
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
from app.graph.context import ExecutionContext
from app.graph.state import WorkflowState


class MockLLM:
    def __init__(self, result):
        self.result = result

    def generate_json(self, prompt_name, variables, model):
        return self.result


def test_planner_stores_detailed_result_in_metadata_and_routes():
    state = WorkflowState(next_node="planner")

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
        scheme_category = "Education"

    state.selected_scheme = SelectedScheme()
    state.candidate_schemes = [CandidateScheme()]
    detailed = PlannerResultDetailed(
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

    context = ExecutionContext(state=state, llm_service=MockLLM(detailed))
    updated = PlannerAgentImpl(context).plan(state)

    assert updated.metadata.planner_result["application_roadmap"][0]["title"] == "Collect identity document"
    assert updated.planner_output is not None
    assert updated.next_node == "verification"
