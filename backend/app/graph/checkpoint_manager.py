"""Checkpoint manager for workflow state snapshots (in-memory)."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List


@dataclass
class Checkpoint:
    workflow_id: str | None
    session_id: str | None
    current_node: str | None
    state_snapshot: Dict[str, Any]
    execution_history: List[Dict[str, Any]]
    timestamp: str


class CheckpointManager:
    def __init__(self) -> None:
        self._store: List[Checkpoint] = []

    def create_checkpoint(self, workflow_id: str | None, session_id: str | None, current_node: str | None, state_snapshot: Dict[str, Any], execution_history: List[Dict[str, Any]]) -> Checkpoint:
        cp = Checkpoint(workflow_id=workflow_id, session_id=session_id, current_node=current_node, state_snapshot=state_snapshot, execution_history=execution_history, timestamp=datetime.utcnow().isoformat())
        self._store.append(cp)
        return cp

    def list_checkpoints(self) -> List[Checkpoint]:
        return list(self._store)

    def latest(self) -> Checkpoint | None:
        return self._store[-1] if self._store else None
