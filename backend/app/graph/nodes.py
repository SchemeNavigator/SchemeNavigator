"""Workflow node base class and placeholder nodes."""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Optional

from .state import WorkflowState
from .context import ExecutionContext


class WorkflowNode(ABC):
    """Abstract workflow node.

    Responsibilities:
    - receive an `ExecutionContext` during initialization
    - implement `execute` which may modify the shared `WorkflowState`
    - not instantiate external services; use context-provided dependencies
    """

    name: str = "base"

    def __init__(self, context: ExecutionContext) -> None:
        self.context = context

    def initialize(self) -> None:
        pass

    @abstractmethod
    def execute(self, state: WorkflowState) -> WorkflowState:
        raise NotImplementedError()

    def validate(self, state: WorkflowState) -> None:
        pass

    def cleanup(self) -> None:
        pass


class StartNode(WorkflowNode):
    name = "start"

    def execute(self, state: WorkflowState) -> WorkflowState:
        state.workflow_status = state.workflow_status or state.workflow_status
        state.current_node = self.name
        state.next_node = "research"
        return state


class ResearchNode(WorkflowNode):
    name = "research"

    def execute(self, state: WorkflowState) -> WorkflowState:
        # placeholder: no business logic
        state.current_node = self.name
        state.next_node = "planner"
        return state


class PlannerNode(WorkflowNode):
    name = "planner"

    def execute(self, state: WorkflowState) -> WorkflowState:
        state.current_node = self.name
        state.next_node = "verification"
        return state


class VerificationNode(WorkflowNode):
    name = "verification"

    def execute(self, state: WorkflowState) -> WorkflowState:
        state.current_node = self.name
        state.next_node = "end"
        return state


class EndNode(WorkflowNode):
    name = "end"

    def execute(self, state: WorkflowState) -> WorkflowState:
        state.current_node = self.name
        state.next_node = None
        state.workflow_status = state.workflow_status or state.workflow_status
        return state
"""Node placeholders for future workflow steps.

Purpose:
    Reserve the node namespace for LangGraph-compatible workflow steps.
Responsibilities:
    Expose a base node type only; no execution logic in this phase.
Future implementation notes:
    Concrete nodes should inherit from the shared workflow node abstraction.
"""

from app.agents.shared import BaseWorkflowNode
from app.graph.state import SharedState


class BaseNode(BaseWorkflowNode[SharedState]):
    """Placeholder base node for future workflow execution.

    Purpose:
        Reserve a concrete workflow node type for later phases.
    Responsibilities:
        None in the current phase.
    Future implementation notes:
        Implement actual node behavior when graph execution is introduced.
    """

    # TODO: implement node execution in a later phase.
    pass

