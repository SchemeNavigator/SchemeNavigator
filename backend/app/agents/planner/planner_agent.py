"""Planner Agent implementation coordinating extraction, timeline, LLM and validation."""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from .scheme_extractor import extract_scheme_context
from .timeline_builder import build_timeline
from .planner_models import PlannerResultDetailed
from .roadmap_validator import validate_roadmap
from . import PlannerAgent as Placeholder
from ...graph.context import ExecutionContext
from ...graph.state import WorkflowState, Message, WorkflowError
from ...llm.exceptions import JSONParsingError


class PlannerAgentImpl(Placeholder):
    """Concrete Planner Agent used by the application.

    Responsibilities:
    - Extract scheme info deterministically
    - Build timeline deterministically
    - Call LLMService for roadmap generation
    - Validate roadmap deterministically
    - Update `state.planner_output` minimally and store full result in metadata
    """

    def __init__(self, context: ExecutionContext, logger: Optional[logging.Logger] = None) -> None:
        self.context = context
        self.logger = logger or logging.getLogger("planner")

    def plan(self, state: WorkflowState) -> WorkflowState:
        self.logger.info("Planner Started")
        now = datetime.utcnow().isoformat()

        selected = state.selected_scheme
        if not selected:
            err = WorkflowError(node="planner", message="No selected scheme", exception_type="ValueError", timestamp=now, recoverable=False)
            state.errors.append(err)
            return state

        # Stage 1: Extract scheme context
        planning_context = extract_scheme_context(selected, state.candidate_schemes)
        self.logger.info("Scheme Extracted")

        # Stage 2: Timeline builder
        timeline = build_timeline(planning_context)
        self.logger.info("Timeline Generated")

        # Stage 3: Planner intelligence (LLM)
        llm = self.context.llm_service
        if llm is None:
            err = WorkflowError(node="planner", message="LLMService not available", exception_type="ModelUnavailable", timestamp=now, recoverable=False)
            state.errors.append(err)
            return state

        if self.context.is_cancelled():
            return self.context.stop_state(state)

        variables = {
            "survey_summary": getattr(state.intent, "user_profile_summary", None),
            "selected_scheme": planning_context,
            "planning_context": planning_context,
            "timeline": timeline,
            "conversation_history": [m.model_dump() for m in state.conversation_memory.messages],
            "current_timestamp": now,
        }

        try:
            detailed: PlannerResultDetailed = llm.generate_json("planner", variables, PlannerResultDetailed)
            if self.context.is_cancelled():
                return self.context.stop_state(state)
            self.logger.info("LLM Parsed Planner Result")
        except JSONParsingError as exc:
            state.errors.append(WorkflowError(node="planner", message=str(exc), exception_type=type(exc).__name__, timestamp=datetime.utcnow().isoformat(), recoverable=True))
            state.next_node = None
            return state
        except Exception as exc:
            state.errors.append(WorkflowError(node="planner", message=str(exc), exception_type=type(exc).__name__, timestamp=datetime.utcnow().isoformat(), recoverable=False))
            state.next_node = None
            return state

        # Stage 4: Roadmap validation
        val_errors = validate_roadmap(detailed)
        if val_errors:
            state.errors.extend(val_errors)
            return state

        # Map minimal PlannerResult to state's planner_output (use existing model shape)
        from ...models.agent_models import PlannerResult as SimplePlanner

        plan_steps = [step.title for step in detailed.application_roadmap]
        simple = SimplePlanner(goal=planning_context.get("scheme_name"), plan_steps=plan_steps, selected_scheme_ids=[planning_context.get("scheme_id")])
        state.planner_output = simple

        # Save full detailed result for traceability
        state.metadata.planner_result = detailed.model_dump() if hasattr(detailed, "model_dump") else detailed.dict()

        # Append system message
        msg = Message(role="system", content=f"Planner generated {len(plan_steps)} steps", timestamp=now, metadata={"node": "planner"})
        state.messages.append(msg)
        state.metadata.finished_at = now
        state.next_node = "verification"

        self.logger.info("Planner Finished")
        return state
