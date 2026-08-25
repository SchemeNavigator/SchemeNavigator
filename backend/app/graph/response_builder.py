"""Build a final WorkflowResult from WorkflowState."""
from __future__ import annotations

from typing import Optional

from ..models.agent_models import WorkflowResult
from ..utils.verification import normalize_verification_result
from .state import WorkflowState


class ResponseBuilder:
    def build(self, state: WorkflowState) -> WorkflowResult:
        # combine minimal pieces into WorkflowResult
        wf = WorkflowResult(
            workflow_id=getattr(state.metadata, "workflow_id", None),
            recommendations=getattr(state, "ranked_schemes", []),
            research_result=None,
            planner_result=getattr(state, "planner_output", None),
            verification_result=normalize_verification_result(getattr(state, "verification_output", None)),
        )
        return wf
