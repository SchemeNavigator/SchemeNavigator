"""Conditional routing logic for workflow decisions."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .state import WorkflowState


@dataclass
class DecisionTrace:
    reason: str
    decision: str
    node: str | None = None
    timestamp: str | None = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class ConditionalRouter:
    """Decide next node based on state and configurable thresholds."""

    def __init__(self, config: Dict[str, Any] | None = None) -> None:
        self.config = config or {}

    def decide(self, state: WorkflowState) -> (str | None, DecisionTrace | None):
        # Decision points examine research confidence and errors
        # simple rules: if research confidence exists and < threshold -> retry or ask
        conf_threshold = float(self.config.get("research_confidence_threshold", 0.6))
        action_low = self.config.get("on_low_confidence", "retry")

        # if errors present and any are non-recoverable -> terminate
        for err in getattr(state, "errors", []) or []:
            if getattr(err, "recoverable", False) is False:
                trace = DecisionTrace(reason="Non-recoverable error present", decision="terminate", node=state.current_node)
                return None, trace

        # research confidence
        research_conf = getattr(state.intent, "confidence", None)
        if research_conf is not None:
            if research_conf < conf_threshold:
                # decision based on configured action
                if action_low == "retry":
                    return state.current_node, DecisionTrace(reason=f"Low research confidence {research_conf}", decision="retry", node=state.current_node)
                if action_low == "ask":
                    return "ask_additional_info", DecisionTrace(reason=f"Low research confidence {research_conf}", decision="ask", node=state.current_node)
                if action_low == "terminate":
                    return None, DecisionTrace(reason=f"Low research confidence {research_conf}", decision="terminate", node=state.current_node)

        # if verification already present and status is ready -> skip planner
        ver = getattr(state, "verification_output", None)
        if ver and getattr(ver, "verification_status", None) == "Ready":
            return "response_builder", DecisionTrace(reason="Verification ready, skip planner", decision="skip_planner", node=state.current_node)

        # default: continue to next logical node
        return state.next_node or None, DecisionTrace(reason="Default continue", decision="continue", node=state.current_node)
