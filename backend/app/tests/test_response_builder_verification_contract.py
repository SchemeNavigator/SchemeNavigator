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

from app.agents.verification.models import (
    ConsistencyReport,
    DocumentReport,
    EligibilityAssessment,
    VerificationResult as DetailedVerificationResult,
    WorkflowReport,
)
from app.graph.response_builder import ResponseBuilder
from app.graph.state import WorkflowState


def test_response_builder_normalizes_detailed_verification_result():
    detailed = DetailedVerificationResult(
        overall_readiness_score=80.0,
        overall_confidence=0.9,
        audit_summary="Audit completed.",
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
        final_verdict="Ready for further review",
    )
    state = WorkflowState()
    state.verification_output = detailed

    result = ResponseBuilder().build(state)

    assert result.verification_result is not None
    assert result.verification_result.verification_status == "Ready for further review"
    assert result.verification_result.verified_scheme_ids == []
    assert result.verification_result.rejected_scheme_ids == []
    assert result.verification_result.notes == ["Audit completed."]
    assert state.verification_output is detailed
