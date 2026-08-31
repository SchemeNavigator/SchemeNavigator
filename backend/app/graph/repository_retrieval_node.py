"""Repository Retrieval Node: uses RetrievalEngine to fetch candidate schemes."""
from __future__ import annotations

import logging
from typing import Any

from .nodes import WorkflowNode
from .context import ExecutionContext
from .retrieval_engine import RetrievalEngine
from .state import WorkflowState, Message


class RepositoryRetrievalNode(WorkflowNode):
    name = "repository_retrieval"

    def __init__(self, context: ExecutionContext) -> None:
        super().__init__(context)
        self.logger = context.logger or logging.getLogger(__name__)
        self.engine = RetrievalEngine(context.repository)

    def execute(self, state: WorkflowState) -> WorkflowState:
        self.logger.info("Retrieval Started")

        # Build expanded query payload for the engine. Prefer detailed metadata if available.
        retrieval_meta = getattr(state.repository_query, "retrieval_metadata", {}) or {}

        weighted_keywords = retrieval_meta.get("weighted_keywords") or []
        # Fallback: use expanded_keywords as simple keywords with default weight 1.0
        if not weighted_keywords:
            expanded_kws = getattr(state.repository_query, "expanded_keywords", []) or []
            weighted_keywords = [{"keyword": k, "weight": 1.0} for k in expanded_kws]

        categories = (state.repository_query.search_parameters or {}).get("categories", [])
        expanded_categories = retrieval_meta.get("expanded_categories", []) or []
        tags = (state.repository_query.search_parameters or {}).get("tags", [])
        expanded_tags = retrieval_meta.get("expanded_tags", []) or []
        levels = (state.repository_query.search_parameters or {}).get("levels", [])
        filters = getattr(state.repository_query, "filters", {}) or {}

        expanded = {
            "weighted_keywords": weighted_keywords,
            "categories": categories,
            "expanded_categories": expanded_categories,
            "tags": tags,
            "expanded_tags": expanded_tags,
            "levels": levels,
            "filters": filters,
        }

        # The RetrievalEngine expects weighted_keywords as list of dicts
        collection = self.engine.retrieve(expanded)

        # Update state.candidate_schemes with plain Scheme objects
        state.candidate_schemes = [c.scheme for c in collection.candidate_schemes]

        # Append message and metadata
        msg = Message(role="system", content=f"Retrieved {len(collection.candidate_schemes)} candidates", timestamp=None, metadata={"node": self.name, "retrieval_time_ms": collection.retrieval_time_ms})
        state.messages.append(msg)
        state.metadata.repository_results_count = collection.statistics.get("candidate_count")

        self.logger.info("Retrieval Finished: %s candidates", len(collection.candidate_schemes))

        # Eligibility must be decided before ranking. Do not skip directly to
        # recommendation generation with raw retrieval candidates.
        try:
            state.next_node = "eligibility_gate"
        except Exception:
            self.logger.exception("Failed to set next_node to eligibility_gate")

        return state
