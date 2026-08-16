"""Recommendation Intelligence Node: synthesize recommendations using LLMService.

This node builds a compact context from candidate schemes and user intent,
calls `LLMService.generate_json("recommendation", variables, RecommendationResult)`,
validates the output, applies deterministic validation rules, and updates
the workflow state with ranked summaries and the chosen scheme.
"""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime
from typing import Optional

from pydantic import ValidationError

from .nodes import WorkflowNode
from .context import ExecutionContext
from .state import WorkflowState, Message, WorkflowError
from .recommendation_models import RecommendationResult, RecommendationEntry
from ..llm.exceptions import JSONParsingError


CONFIG_PATH = os.path.join(os.path.dirname(__file__), "recommendation_config.json")


def _load_config():
    if not os.path.exists(CONFIG_PATH):
        return {}
    with open(CONFIG_PATH, "r", encoding="utf-8") as fh:
        return json.load(fh)


CONFIG = _load_config()


class RecommendationNode(WorkflowNode):
    name = "recommendation"

    def __init__(self, context: ExecutionContext) -> None:
        super().__init__(context)
        self.logger = context.logger or logging.getLogger(__name__)

    def _build_context(self, state: WorkflowState) -> dict:
        # compact representation of each candidate
        candidates = []
        # candidate_schemes assumed to be list of Scheme; include retrieval metadata if available
        for scheme in getattr(state, "candidate_schemes", []) or []:
            # retrieval metadata may be in state.metadata or in repository_query.retrieval_metadata
            # best-effort: include minimal fields
            candidates.append({
                "scheme_name": getattr(scheme, "scheme_name", None),
                "summary": getattr(scheme, "details", None),
                "benefits": getattr(scheme, "benefits", None),
                "eligibility": getattr(scheme, "eligibility", None),
                "required_documents": getattr(scheme, "documents", None),
                "level": getattr(scheme, "level", None),
                "scheme_category": getattr(scheme, "scheme_category", None),
                # retrieval fields may be absent; include placeholders
                "matched_keywords": [],
                "retrieval_score": None,
                "retrieval_explanation": None,
            })

        context = {
            "candidates": candidates,
            "user_profile_summary": getattr(state.intent, "user_profile_summary", None),
            "missing_information": getattr(state.intent, "missing_information", []),
            "repository_statistics": {
                "repository_results_count": getattr(state.metadata, "repository_results_count", None)
            },
            "current_timestamp": datetime.utcnow().isoformat(),
        }
        return context

    def _validate_recommendation_result(self, result: RecommendationResult) -> None:
        # deterministic checks
        seen = set()
        min_score = float(CONFIG.get("min_score", 0))
        min_conf = float(CONFIG.get("min_confidence", 0.0))
        for rec in result.recommendations:
            if rec.scheme_id in seen and rec.scheme_id is not None:
                raise ValueError("Duplicate scheme in recommendations")
            seen.add(rec.scheme_id)
            if not (0 <= rec.overall_score <= 100):
                raise ValueError(f"Invalid score {rec.overall_score}")
            if not (0.0 <= rec.confidence <= 1.0):
                raise ValueError(f"Invalid confidence {rec.confidence}")
            if rec.overall_score < min_score or rec.confidence < min_conf:
                # marks for filtering later
                continue

    def execute(self, state: WorkflowState) -> WorkflowState:
        self.logger.info("Recommendation Started")
        now = datetime.utcnow().isoformat()

        llm = self.context.llm_service
        if llm is None:
            err = WorkflowError(node=self.name, message="LLMService not available", exception_type="ModelUnavailable", timestamp=now, recoverable=False)
            state.errors.append(err)
            return state

        variables = self._build_context(state)

        try:
            # call LLM
            result: RecommendationResult = llm.generate_json("recommendation", variables, RecommendationResult)
            self.logger.info("JSON Parsed")
        except JSONParsingError as exc:
            self.logger.exception("Parsing failed, retrying once")
            try:
                result = llm.generate_json("recommendation", variables, RecommendationResult)
            except Exception as exc2:
                state.errors.append(WorkflowError(node=self.name, message=str(exc2), exception_type=type(exc2).__name__, timestamp=datetime.utcnow().isoformat(), recoverable=True))
                # prevent workflow-level retry loop by clearing next_node on recoverable LLM parse failure
                try:
                    state.next_node = None
                except Exception:
                    self.logger.exception("Failed to clear next_node after parsing retry failure")
                return state
        except Exception as exc:
            self.logger.exception("Recommendation LLM call failed")
            state.errors.append(WorkflowError(node=self.name, message=str(exc), exception_type=type(exc).__name__, timestamp=datetime.utcnow().isoformat(), recoverable=False))
            return state

        # post-parse validation
        try:
            self._validate_recommendation_result(result)
        except Exception as exc:
            self.logger.exception("Validation failed")
            state.errors.append(WorkflowError(node=self.name, message=str(exc), exception_type=type(exc).__name__, timestamp=datetime.utcnow().isoformat(), recoverable=False))
            # On validation failure treat as non-recoverable and terminate workflow routing
            try:
                state.next_node = None
            except Exception:
                self.logger.exception("Failed to clear next_node after validation failure")
            return state

        # filter & select top recommendations
        max_rec = int(CONFIG.get("max_recommendations", 5))
        filtered = [r for r in result.recommendations if r.overall_score >= float(CONFIG.get("min_score", 0)) and r.confidence >= float(CONFIG.get("min_confidence", 0.0))]

        # sort by overall_score descending
        filtered.sort(key=lambda r: r.overall_score, reverse=True)

        # update state.ranked_schemes (map to minimal Recommendation model for compatibility)
        from ..models.agent_models import Recommendation as SimpleRec

        state.ranked_schemes = []
        for rec in filtered[:max_rec]:
            state.ranked_schemes.append(SimpleRec(scheme_id=rec.scheme_id, scheme_name=rec.scheme_name, reason=rec.reason))

        # selected_scheme = top recommendation
        top = filtered[0] if filtered else None
        state.selected_scheme = SimpleRec(scheme_id=top.scheme_id, scheme_name=top.scheme_name, reason=top.reason) if top else None

        # append system message and metadata
        msg = Message(role="system", content=f"Generated {len(filtered[:max_rec])} recommendations", timestamp=now, metadata={"node": self.name})
        state.messages.append(msg)
        # store full result for traceability
        # store full result for traceability - guard against metadata schema that disallows extra fields
        try:
            state.metadata.recommendation_result = result.model_dump() if hasattr(result, "model_dump") else result.dict()
        except Exception:
            self.logger.exception("Failed to store recommendation_result in metadata; skipping")
        try:
            state.metadata.overall_confidence = result.overall_confidence
        except Exception:
            self.logger.exception("Failed to store overall_confidence in metadata; skipping")
        state.metadata.finished_at = now

        self.logger.info("Recommendations Generated: %d", len(filtered[:max_rec]))

        # On successful recommendation generation, explicitly advance to planner
        try:
            state.next_node = "planner"
        except Exception:
            self.logger.exception("Failed to set next_node to planner after successful recommendation")

        return state
