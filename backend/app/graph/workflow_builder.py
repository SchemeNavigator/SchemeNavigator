"""Build a workflow graph (list of node names) from configuration and registry."""
from __future__ import annotations

from typing import List, Dict

from .registry import NodeRegistry


class WorkflowBuilder:
    def __init__(self, registry: NodeRegistry, config: Dict | None = None) -> None:
        self.registry = registry
        self.config = config or {}

    def default_sequence(self) -> List[str]:
        # prefer explicit orchestration of research nodes then planning and verification
        seq = [
            "intent_extraction",
            "query_expansion",
            "repository_retrieval",
            "recommendation",
            # decision node handled by ExecutionManager.router
            "planner",
            "verification",
            "response_builder",
        ]
        # filter by registry presence for safety
        available = set(self.registry.list())
        filtered = [n for n in seq if (n in available) or n in ("planner", "verification", "response_builder")]
        return filtered

    def build(self) -> List[str]:
        # allow override via config
        seq = self.config.get("sequence")
        if seq:
            return seq
        return self.default_sequence()
