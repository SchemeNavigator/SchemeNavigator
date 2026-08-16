"""Event classes for workflow lifecycle notifications."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional

from .state import WorkflowStatus, NodeStatus


@dataclass
class WorkflowEvent:
    name: str
    workflow_id: Optional[str]
    payload: Dict[str, Any]


@dataclass
class WorkflowStarted(WorkflowEvent):
    pass


@dataclass
class NodeStarted(WorkflowEvent):
    node_name: str
    pass


@dataclass
class NodeFinished(WorkflowEvent):
    node_name: str
    status: NodeStatus
    pass


@dataclass
class NodeFailed(WorkflowEvent):
    node_name: str
    error: str
    pass


@dataclass
class WorkflowFinished(WorkflowEvent):
    status: WorkflowStatus
    pass


@dataclass
class WorkflowCancelled(WorkflowEvent):
    reason: Optional[str] = None
    pass
