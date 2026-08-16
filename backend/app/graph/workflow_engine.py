"""High-level WorkflowEngine orchestrating the multi-agent workflow."""
from __future__ import annotations

import logging
from typing import Optional, List

from .context import ExecutionContext
from .registry import NodeRegistry
from .workflow_builder import WorkflowBuilder
from .execution_manager import ExecutionManager
from .state_manager import StateManager
from .checkpoint_manager import CheckpointManager
from .graph_events import EventBus
from .response_builder import ResponseBuilder
from .state import WorkflowState


class WorkflowEngine:
    def __init__(self, llm_service=None, repository=None, config: Optional[dict] = None) -> None:
        self.logger = logging.getLogger("workflow_engine")
        self.registry = NodeRegistry()
        # register known graph node classes
        # dynamic: import graph nodes and register
        try:
            from .intent_node import IntentExtractionNode
            from .query_expansion_node import QueryExpansionNode
            from .repository_retrieval_node import RepositoryRetrievalNode
            from .recommendation_node import RecommendationNode
        except Exception:
            # missing optional nodes are fine
            IntentExtractionNode = None
            QueryExpansionNode = None
            RepositoryRetrievalNode = None
            RecommendationNode = None

        for cls in (IntentExtractionNode, QueryExpansionNode, RepositoryRetrievalNode, RecommendationNode):
            if cls is None:
                continue
            try:
                self.registry.register(cls)
            except Exception:
                pass

        self.config = config or {}
        self.llm_service = llm_service
        self.repository = repository
        self.event_bus = EventBus()
        self.state_manager = StateManager()
        self.checkpoint_manager = CheckpointManager()
        self.builder = WorkflowBuilder(self.registry, self.config)
        self.response_builder = ResponseBuilder()

    def new_state(self) -> WorkflowState:
        state = WorkflowState()
        # initialize metadata
        state.metadata.workflow_id = state.metadata.workflow_id or None
        return state

    def run(self, state: Optional[WorkflowState] = None) -> WorkflowState:
        state = state or self.new_state()
        ctx = ExecutionContext(state=state, llm_service=self.llm_service, repository=self.repository, logger=self.logger, config=self.config)

        exec_mgr = ExecutionManager(context=ctx, registry=self.registry, event_bus=self.event_bus, state_manager=self.state_manager, checkpoint_manager=self.checkpoint_manager, config=self.config)

        sequence = self.builder.build()
        start_node = sequence[0] if sequence else None
        if start_node is None:
            self.logger.error("No nodes to execute")
            return state

        # run manager starting at first node
        final_state = exec_mgr.run(start_node, state)

        # build response
        result = self.response_builder.build(final_state)
        final_state.final_response = result
        return final_state
