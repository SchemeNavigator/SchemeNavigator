"""Workflow node that separates deterministic eligibility from ranking."""
from __future__ import annotations

import logging

from .eligibility_gate import classify_scheme
from .nodes import WorkflowNode
from .state import WorkflowState


class EligibilityGateNode(WorkflowNode):
    name = "eligibility_gate"

    def __init__(self, context):
        super().__init__(context)
        self.logger = context.logger or logging.getLogger(__name__)

    def execute(self, state: WorkflowState) -> WorkflowState:
        eligible = []
        decisions = {}
        for scheme in state.candidate_schemes:
            decision = classify_scheme(scheme, state.survey)
            decisions[scheme.slug] = {"status": decision.status, "reasons": list(decision.reasons)}
            if decision.status == "eligible":
                eligible.append(scheme)

        state.eligibility_decisions = decisions
        state.eligible_schemes = eligible
        state.next_node = "recommendation"
        self.logger.info("Eligibility gate classified %d candidates; %d remain rankable", len(decisions), len(eligible))
        return state