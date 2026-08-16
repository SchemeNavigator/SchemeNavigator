"""State management utilities: merging, validation, versioning."""
from __future__ import annotations

import copy
import hashlib
import json
from typing import Any, Dict

from .state import WorkflowState


class StateManager:
    """Merge node outputs into authoritative WorkflowState and validate."""

    def __init__(self) -> None:
        self._versions: Dict[int, str] = {}
        self._counter = 0

    def snapshot(self, state: WorkflowState) -> Dict[str, Any]:
        data = copy.deepcopy(state.model_dump() if hasattr(state, "model_dump") else state.__dict__)
        return data

    def checksum(self, snapshot: Dict[str, Any]) -> str:
        s = json.dumps(snapshot, sort_keys=True, default=str)
        return hashlib.sha256(s.encode("utf-8")).hexdigest()

    def record_version(self, state: WorkflowState) -> int:
        snap = self.snapshot(state)
        cs = self.checksum(snap)
        self._counter += 1
        ver = self._counter
        self._versions[ver] = cs
        return ver

    def validate_state(self, state: WorkflowState) -> bool:
        # Basic validation: ensure required fields exist and no corrupted types
        try:
            assert state.workflow_status is not None
            assert isinstance(state.execution_history, list)
            return True
        except AssertionError:
            return False

    def merge(self, base: WorkflowState, updated: WorkflowState) -> WorkflowState:
        # Nodes generally mutate in-place; defensively create a new state merging selected fields
        merged = base
        # copy important fields from updated
        for key in ["intent", "repository_query", "candidate_schemes", "ranked_schemes", "selected_scheme", "planner_output", "verification_output", "final_response", "messages", "metadata", "errors", "current_node", "next_node"]:
            if hasattr(updated, key):
                setattr(merged, key, getattr(updated, key))

        # record version
        self.record_version(merged)
        return merged

