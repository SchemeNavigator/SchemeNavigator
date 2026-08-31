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
from ..llm.exceptions import JSONParsingError, JSONSchemaValidationError


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
        fields = CONFIG.get("candidate_fields", [])
        max_detail_chars = int(CONFIG.get("max_detail_chars", 800))
        max_candidates = int(CONFIG.get("max_candidates_for_prompt", len(getattr(state, "eligible_schemes", []) or [])))
        candidates = []
        source_schemes = list(getattr(state, "eligible_schemes", []) or [])

        # Safety boundary: never prompt on unfiltered retrieval results. If the gate
        # has not run yet, do not silently fall back to all candidates.
        if not source_schemes and getattr(state, "eligibility_decisions", {}):
            source_schemes = []

        for scheme in source_schemes[:max_candidates]:
            candidate = {}
            for field in fields:
                source_field = "slug" if field == "scheme_id" else field
                value = getattr(scheme, source_field, None)
                if field == "details" and value and len(value) > max_detail_chars:
                    value = None
                candidate[field] = value
            candidates.append(candidate)

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

    @staticmethod
    def _canonicalize_recommendations(
        recommendations: list[RecommendationEntry], eligible_schemes: list[object]
    ) -> list[RecommendationEntry]:
        """Keep only eligible recommendations and restore their repository IDs.

        An LLM may omit an optional ``scheme_id`` or return a slightly different
        value even when it identifies the supplied scheme by name.  The planner
        needs the canonical repository ID, so resolve recommendations against the
        eligibility-gated candidates before continuing the workflow.
        """
        eligible_by_id = {}
        eligible_by_name = {}
        for scheme in eligible_schemes:
            scheme_id = str(getattr(scheme, "slug", "") or "").strip()
            scheme_name = str(getattr(scheme, "scheme_name", "") or "").strip()
            if scheme_id:
                eligible_by_id[scheme_id] = scheme
            if scheme_name:
                eligible_by_name[scheme_name.casefold()] = scheme

        canonical: list[RecommendationEntry] = []
        seen_ids: set[str] = set()
        for recommendation in recommendations:
            scheme_id = str(recommendation.scheme_id or "").strip()
            scheme_name = str(recommendation.scheme_name or "").strip()
            scheme = eligible_by_id.get(scheme_id)
            if scheme is None and scheme_name:
                scheme = eligible_by_name.get(scheme_name.casefold())
            if scheme is None:
                continue

            canonical_id = str(getattr(scheme, "slug", "") or "").strip()
            if not canonical_id or canonical_id in seen_ids:
                continue

            canonical_name = getattr(scheme, "scheme_name", None)
            canonical.append(
                recommendation.model_copy(
                    update={"scheme_id": canonical_id, "scheme_name": canonical_name}
                )
            )
            seen_ids.add(canonical_id)

        return canonical

    def execute(self, state: WorkflowState) -> WorkflowState:
        self.logger.info("Recommendation Started")
        now = datetime.utcnow().isoformat()

        llm = self.context.llm_service
        if llm is None:
            err = WorkflowError(node=self.name, message="LLMService not available", exception_type="ModelUnavailable", timestamp=now, recoverable=False)
            state.errors.append(err)
            return state

        if self.context.is_cancelled():
            return self.context.stop_state(state)

        variables = self._build_context(state)

        try:
            # call LLM
            generate_kwargs = {}
            if self.context.workflow_deadline is not None:
                generate_kwargs["retry_deadline"] = self.context.workflow_deadline
            result: RecommendationResult = llm.generate_json(
                "recommendation",
                variables,
                RecommendationResult,
                **generate_kwargs,
            )
            if self.context.is_cancelled():
                return self.context.stop_state(state)
            self.logger.info("JSON Parsed")
        except JSONSchemaValidationError as exc:
            self.logger.exception("Recommendation schema validation failed")
            state.errors.append(WorkflowError(node=self.name, message=str(exc), exception_type=type(exc).__name__, timestamp=datetime.utcnow().isoformat(), recoverable=False))
            state.next_node = None
            return state
        except JSONParsingError as exc:
            self.logger.exception("Parsing failed")
            state.errors.append(WorkflowError(node=self.name, message=str(exc), exception_type=type(exc).__name__, timestamp=datetime.utcnow().isoformat(), recoverable=True))
            # prevent workflow-level retry loop by clearing next_node on recoverable LLM parse failure
            try:
                state.next_node = None
            except Exception:
                self.logger.exception("Failed to clear next_node after parsing failure")
            return state
        except Exception as exc:
            self.logger.exception("Recommendation LLM call failed")
            state.errors.append(WorkflowError(node=self.name, message=str(exc), exception_type=type(exc).__name__, timestamp=datetime.utcnow().isoformat(), recoverable=False))
            state.next_node = None
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
        eligible_schemes = list(getattr(state, "eligible_schemes", []) or [])
        eligibility_evaluated = bool(getattr(state, "eligibility_decisions", {}))
        if eligible_schemes or eligibility_evaluated:
            canonical_recommendations = self._canonicalize_recommendations(
                result.recommendations, eligible_schemes
            )
        else:
            # Preserve the node's standalone behaviour for callers that do not
            # include the eligibility gate in their workflow.
            canonical_recommendations = list(result.recommendations)
        filtered = [
            recommendation
            for recommendation in canonical_recommendations
            if recommendation.overall_score >= float(CONFIG.get("min_score", 0))
            and recommendation.confidence >= float(CONFIG.get("min_confidence", 0.0))
        ]

        # sort by overall_score descending
        filtered.sort(key=lambda r: r.overall_score, reverse=True)

        # update state.ranked_schemes (map to minimal Recommendation model for compatibility)
        from ..models.agent_models import Recommendation as SimpleRec

        fallback_used = False
        state.ranked_schemes = []
        for rec in filtered[:max_rec]:
            state.ranked_schemes.append(SimpleRec(scheme_id=rec.scheme_id, scheme_name=rec.scheme_name, reason=rec.reason))

        # If an eligible candidate exists but the LLM supplies no usable rank,
        # preserve the safe eligibility result instead of sending the planner a
        # missing selection.  This avoids a false service failure caused only by
        # an incomplete ranking response.
        top = filtered[0] if filtered else None
        if top is not None:
            state.selected_scheme = SimpleRec(
                scheme_id=top.scheme_id,
                scheme_name=top.scheme_name,
                reason=top.reason,
            )
        elif eligible_schemes:
            fallback = eligible_schemes[0]
            state.selected_scheme = SimpleRec(
                scheme_id=getattr(fallback, "slug", None),
                scheme_name=getattr(fallback, "scheme_name", None),
                reason="The scheme passed deterministic eligibility screening; review its details before applying.",
            )
            state.ranked_schemes.append(state.selected_scheme)
            fallback_used = True
        else:
            state.selected_scheme = None

        # append system message and metadata
        msg = Message(role="system", content=f"Generated {len(filtered[:max_rec])} recommendations", timestamp=now, metadata={"node": self.name})
        state.messages.append(msg)
        # store full result for traceability
        # store full result for traceability - guard against metadata schema that disallows extra fields
        try:
            recommendation_result = result.model_dump() if hasattr(result, "model_dump") else result.dict()
            recommendation_result["fallback_used"] = fallback_used
            state.metadata.recommendation_result = recommendation_result
        except Exception:
            self.logger.exception("Failed to store recommendation_result in metadata; skipping")
        try:
            state.metadata.overall_confidence = result.overall_confidence
        except Exception:
            self.logger.exception("Failed to store overall_confidence in metadata; skipping")
        state.metadata.finished_at = now

        self.logger.info("Recommendations Generated: %d", len(filtered[:max_rec]))

        # Do not invoke the planner unless there is a selected scheme.  If no
        # scheme passed the gate, let verification return an evidence-backed
        # no-match result instead of failing with "No selected scheme".
        try:
            state.next_node = "planner" if state.selected_scheme else "verification"
        except Exception:
            self.logger.exception("Failed to set the next node after recommendation")

        return state
