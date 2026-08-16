"""Execution manager: execute nodes, handle retries, emit events."""
from __future__ import annotations

import time
import logging
from dataclasses import dataclass
from typing import Any, Dict, Optional

from .graph_events import EventBus, WorkflowEvent
from .state_manager import StateManager
from .checkpoint_manager import CheckpointManager
from .conditional_router import ConditionalRouter, DecisionTrace
from .context import ExecutionContext
from .registry import NodeRegistry
from .state import WorkflowState


@dataclass
class NodeExecutionResult:
    updated_state: WorkflowState
    next_node: str | None
    execution_status: str
    retry: bool = False
    retry_reason: str | None = None
    execution_time: float | None = None
    metadata: Dict[str, Any] = None
    errors: list = None


class ExecutionManager:
    def __init__(self, context: ExecutionContext, registry: NodeRegistry, event_bus: EventBus | None = None, state_manager: StateManager | None = None, checkpoint_manager: CheckpointManager | None = None, config: Dict[str, Any] | None = None) -> None:
        self.context = context
        self.registry = registry
        self.event_bus = event_bus or EventBus()
        self.state_manager = state_manager or StateManager()
        self.checkpoint_manager = checkpoint_manager or CheckpointManager()
        self.config = config or {}
        self.logger = context.logger or logging.getLogger("execution")
        self.router = ConditionalRouter(self.config.get("routing", {}))

    def _emit(self, name: str, node: str | None = None, duration: float | None = None, status: str | None = None, metadata: Dict[str, Any] | None = None) -> None:
        ev = WorkflowEvent(name=name, node=node, timestamp=time.strftime("%Y-%m-%dT%H:%M:%S"), duration=duration, status=status, metadata=metadata or {})
        self.event_bus.emit(ev)

    def execute_node(self, node_name: str, state: WorkflowState) -> NodeExecutionResult:
        start = time.time()
        self._emit("node_started", node=node_name, status="running")
        # instantiate node class from registry if available
        try:
            node_cls = self.registry.get(node_name)
            node = node_cls(self.context)
        except KeyError:
            # fallback: support special agent names handled externally
            node = None

        try:
            if node is not None:
                node.initialize()
                node.validate(state)
                before = time.time()
                updated = node.execute(state)
                after = time.time()
                duration = after - before
                status = "completed"
            else:
                # handle special handlers: planner and verification via context-less direct calls
                if node_name == "planner":
                    # import here to avoid circulars
                    from ..agents.planner.planner_agent import PlannerAgentImpl

                    agent = PlannerAgentImpl(self.context)
                    before = time.time()
                    updated = agent.plan(state)
                    after = time.time()
                    duration = after - before
                    status = "completed"
                elif node_name == "verification":
                    from ..agents.verification.verification_agent import VerificationAgent

                    agent = VerificationAgent(self.context)
                    before = time.time()
                    updated = agent.verify(state)
                    after = time.time()
                    duration = after - before
                    status = "completed"
                else:
                    raise KeyError(f"Unknown node: {node_name}")

            # post node cleanup
            try:
                if node is not None:
                    node.cleanup()
            except Exception:
                self.logger.exception("Node cleanup failed: %s", node_name)

            # merge and validate state
            merged = self.state_manager.merge(state, updated)
            valid = self.state_manager.validate_state(merged)
            if not valid:
                raise RuntimeError("State validation failed after node execution")

            # checkpoint
            snap = self.state_manager.snapshot(merged)
            self.checkpoint_manager.create_checkpoint(workflow_id=getattr(merged.metadata, "workflow_id", None), session_id=getattr(merged.metadata, "session_id", None), current_node=node_name, state_snapshot=snap, execution_history=[h.model_dump() if hasattr(h, "model_dump") else h for h in merged.execution_history])

            self._emit("node_finished", node=node_name, duration=duration, status=status, metadata={})

            return NodeExecutionResult(updated_state=merged, next_node=getattr(merged, "next_node", None), execution_status=status, retry=False, execution_time=duration, metadata={}, errors=getattr(merged, "errors", []))

        except Exception as exc:
            self.logger.exception("Execution failed for node %s", node_name)
            duration = time.time() - start
            self._emit("node_failed", node=node_name, duration=duration, status="failed", metadata={"error": str(exc)})
            if isinstance(exc, KeyError) and "Unknown node" in str(exc):
                state.next_node = None
            # determine retry policy
            retry_policy = self.config.get("retry_policy", {})
            node_policy = retry_policy.get(node_name, retry_policy.get("default", {}))
            should_retry = bool(node_policy.get("retry", False))
            return NodeExecutionResult(updated_state=state, next_node=state.next_node, execution_status="failed", retry=should_retry, retry_reason=str(exc), execution_time=duration, metadata={}, errors=state.errors)

    def run(self, start_node: str, state: WorkflowState) -> WorkflowState:
        current = start_node
        while current is not None:
            self.logger.info("Executing node: %s", current)
            result = self.execute_node(current, state)

            # record trace
            if result and result.updated_state:
                state = result.updated_state

            # if failed and retry requested, attempt once
            if result.execution_status == "failed" and result.retry:
                self.logger.info("Retrying node: %s", current)
                self._emit("retry_started", node=current, status="retry")
                # single retry
                result = self.execute_node(current, state)
                self._emit("retry_finished", node=current, status=result.execution_status)

            # decision routing
            next_node, trace = self.router.decide(state)
            # append decision trace to metadata
            if trace:
                dt = getattr(state.metadata, "decision_trace", [])
                dt.append(trace.__dict__)
                state.metadata.decision_trace = dt

            if next_node is None:
                break
            current = next_node

        return state
