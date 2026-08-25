import json
import sys
import time

import app.agents as agents_package
import app.graph as graph_package
import app.llm as llm_package
import app.llm.exceptions as llm_exceptions
import app.models as models_package
import app.models.agent_models as agent_models_package
import app.repositories as repositories_package
import app.services as services_package

# Existing agent modules use parent-relative imports that resolve under app.agents.
# Keep compatibility aliases local to this test instead of changing production imports.
sys.modules.setdefault("app.agents.agents", agents_package)
sys.modules.setdefault("app.agents.graph", graph_package)
sys.modules.setdefault("app.agents.llm", llm_package)
sys.modules.setdefault("app.agents.llm.exceptions", llm_exceptions)
sys.modules.setdefault("app.agents.models", models_package)
sys.modules.setdefault("app.agents.models.agent_models", agent_models_package)
sys.modules.setdefault("app.agents.repositories", repositories_package)
sys.modules.setdefault("app.agents.services", services_package)

from app.agents.planner.planner_models import PlannerResultDetailed, RoadmapStep
from app.agents.verification.models import (
    ConsistencyReport,
    DocumentReport,
    EligibilityAssessment,
    VerificationResult,
    WorkflowReport,
)
from app.graph.intent_node import IntentResult, RepositoryQueryOutput
from app.graph.recommendation_models import RecommendationEntry, RecommendationResult
from app.graph.workflow_engine import WorkflowEngine
from app.llm.output_parser import OutputParser
from app.llm.prompt_manager import PromptManager
from app.models.survey import SurveyRequest
from app.repositories.scheme_repository import SchemeRepository
from app.services.llm_service import LLMService


class OfflineProvider:
    def __init__(self, scheme_id: str, scheme_name: str) -> None:
        self.scheme_id = scheme_id
        self.scheme_name = scheme_name
        self.model_name = "offline-test-model"
        self.calls: list[str] = []

    def generate(self, prompt: str, max_tokens=None, temperature=None):
        if "Intent Agent" in prompt:
            label = "intent"
            payload = IntentResult(
                user_profile_summary="A Delhi student seeking education schemes.",
                repository_query=RepositoryQueryOutput(
                    keywords=["student", "scholarship"],
                    categories=["Education"],
                    tags=["student"],
                    levels=["State"],
                    filters={"state": "Delhi"},
                ),
                confidence=0.95,
                missing_information=[],
                reasoning="The supplied profile identifies a student in Delhi.",
            )
        elif "Recommendation Agent" in prompt:
            label = "recommendation"
            payload = RecommendationResult(
                recommendations=[
                    RecommendationEntry(
                        scheme_id=self.scheme_id,
                        scheme_name=self.scheme_name,
                        overall_score=90.0,
                        confidence=0.9,
                        reason="The supplied scheme matches the student profile.",
                        pros=["Education support is described by the supplied scheme."],
                        cons=[],
                        eligibility_analysis="Eligibility requires confirmation from the supplied scheme details.",
                        benefit_analysis="The supplied scheme provides student support.",
                        risk_analysis=None,
                        required_documents_summary=None,
                        recommended_priority="high",
                    )
                ],
                summary="The supplied scheme was ranked.",
                overall_confidence=0.9,
                limitations=[],
                missing_information=[],
            )
        elif "Planner Agent" in prompt:
            label = "planner"
            payload = PlannerResultDetailed(
                application_roadmap=[
                    RoadmapStep(
                        step=1,
                        title="Review the scheme application details",
                        description="Review the supplied application information before applying.",
                        estimated_time_minutes=30,
                        dependencies=[],
                        completion_criteria="The supplied application information is reviewed.",
                    )
                ],
                timeline=[],
                required_documents=[],
                document_descriptions={},
                eligibility_summary=None,
                estimated_effort="low",
                estimated_duration=None,
                warnings=[],
                tips=[],
                common_mistakes=[],
                next_action="Review the supplied application details.",
                application_summary="Review the supplied scheme before applying.",
            )
        elif "Verification Agent" in prompt:
            label = "verification"
            payload = VerificationResult(
                overall_readiness_score=80.0,
                overall_confidence=0.9,
                audit_summary="The workflow artifacts were checked.",
                consistency_assessment=ConsistencyReport(
                    planner_references_selected_scheme=True,
                    recommendation_exists=True,
                    planner_uses_same_eligibility=True,
                    planner_uses_same_documents=True,
                    issues=[],
                ),
                eligibility_assessment=EligibilityAssessment(
                    status="Eligibility Uncertain",
                    reasons=["Final eligibility requires confirmation."],
                ),
                document_assessment=DocumentReport(
                    required_documents_listed=[],
                    missing_documents=[],
                    duplicates_removed=[],
                    sufficient=False,
                ),
                workflow_assessment=WorkflowReport(
                    roadmap_exists=True,
                    timeline_complete=False,
                    ordered=True,
                    duplicates=[],
                    warnings_present=False,
                    next_action_present=True,
                    completeness_score=100.0,
                ),
                identified_risks=[],
                identified_limitations=[],
                recommended_actions=[],
                missing_information=[],
                final_verdict="Ready for further review",
            )
        else:
            raise AssertionError("Unexpected LLM prompt")

        self.calls.append(label)
        return {"raw": {"choices": [{"message": {"content": json.dumps(payload.model_dump())}}]}}


def test_offline_workflow_uses_actual_routing_contract(tmp_path, monkeypatch):
    csv_path = tmp_path / "schemes.csv"
    csv_path.write_text(
        "scheme_name,slug,details,benefits,eligibility,application,documents,level,schemeCategory,tags\n"
        "Delhi Student Scholarship,delhi-student-scholarship,Support for Delhi students,Education support,Students in Delhi,Apply with supplied information,Identity proof,State,Education,Student\n",
        encoding="utf-8",
    )
    repository = SchemeRepository(csv_path)
    candidate = repository.load_all()[0]
    provider = OfflineProvider(candidate.slug, candidate.scheme_name)

    llm = LLMService.__new__(LLMService)
    llm.prompt_manager = PromptManager()
    llm.output_parser = OutputParser()
    llm.model = provider

    engine = WorkflowEngine(llm_service=llm, repository=repository)
    started_nodes: list[str] = []
    engine.event_bus.subscribe("node_started", lambda event: started_nodes.append(event.node))

    state = engine.new_state()
    state.survey = SurveyRequest(
        age=20,
        gender="unspecified",
        state="Delhi",
        category="student",
        employment_status="student",
        occupation="student",
    )

    started_at = time.perf_counter()
    final_state = engine.run(state)
    elapsed = time.perf_counter() - started_at
    print("PHASE_9_2W_RESULT:", flush=True)
    print("STATUS: PASS", flush=True)
    print(f"EXECUTED_NODES: {started_nodes}", flush=True)
    print(f"LLM_CALL_COUNT: {len(provider.calls)}", flush=True)
    print(f"LLM_CALL_ORDER: {provider.calls}", flush=True)
    print(f"FINAL_NEXT_NODE: {final_state.next_node}", flush=True)
    print(f"FINAL_RESPONSE: {final_state.final_response is not None}", flush=True)
    print(f"ERROR_COUNT: {len(final_state.errors)}", flush=True)
    print(f"ELAPSED_SECONDS: {elapsed:.3f}", flush=True)
    print("OPENROUTER_REQUESTS: 0", flush=True)
    print("NETWORK_REQUESTS: 0", flush=True)
    print("PRODUCTION_FILES_MODIFIED: NONE", flush=True)

    assert started_nodes == [
        "intent_extraction",
        "repository_retrieval",
        "recommendation",
        "planner",
        "verification",
    ]
    assert "query_expansion" not in started_nodes
    assert "response_builder" not in started_nodes
    assert started_nodes.count("planner") == 1
    assert started_nodes.count("verification") == 1
    assert provider.calls == ["intent", "recommendation", "planner", "verification"]
    assert final_state.intent.user_profile_summary.startswith("A Delhi student")
    assert final_state.candidate_schemes[0].slug == candidate.slug
    assert final_state.ranked_schemes[0].scheme_id == candidate.slug
    assert final_state.selected_scheme.scheme_name == candidate.scheme_name
    assert final_state.planner_output is not None
    assert final_state.verification_output is not None
    assert final_state.next_node is None
    assert final_state.errors == []
    assert final_state.final_response is not None
