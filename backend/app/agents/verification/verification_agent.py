"""Verification Agent: combines deterministic validators and an LLM audit."""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime
from typing import Optional

from .models import VerificationResult
from .validators import consistency_validator, eligibility_validator, document_validator, workflow_validator
from ...graph.context import ExecutionContext
from ...graph.state import WorkflowState, Message, WorkflowError
from ...llm.exceptions import JSONParsingError
from ...utils.verification import normalize_verification_result as _normalize_verification_result

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "verification_config.json")


def _load_config():
    if not os.path.exists(CONFIG_PATH):
        return {}
    with open(CONFIG_PATH, "r", encoding="utf-8") as fh:
        return json.load(fh)


CONFIG = _load_config()


class VerificationAgent:
    """Run verification stages and produce a VerificationResult and final WorkflowResult.

    Stages 1-4 are deterministic validators. Stage 5 uses the LLMService to
    produce an audit and final verdict.
    """

    def __init__(self, context: ExecutionContext, logger: Optional[logging.Logger] = None) -> None:
        self.context = context
        self.logger = logger or logging.getLogger("verification")

    def verify(self, state: WorkflowState) -> WorkflowState:
        self.logger.info("Verification Started")
        now = datetime.utcnow().isoformat()

        # Stage 1
        consistency = consistency_validator(state)
        self.logger.info("Consistency Validation Complete")

        # Stage 2
        eligibility = eligibility_validator(state)
        self.logger.info("Eligibility Validation Complete")

        # Stage 3
        documents = document_validator(state)
        self.logger.info("Document Validation Complete")

        # Stage 4
        workflow = workflow_validator(state)
        self.logger.info("Workflow Validation Complete")

        # Stage 5: LLM audit - build compact context
        llm = self.context.llm_service
        if llm is None:
            err = WorkflowError(node="verification", message="LLMService not available", exception_type="ModelUnavailable", timestamp=now, recoverable=False)
            state.errors.append(err)
            return state

        if self.context.is_cancelled():
            return self.context.stop_state(state)

        variables = {
            "consistency": consistency.model_dump() if hasattr(consistency, "model_dump") else consistency.dict(),
            "eligibility": eligibility.model_dump() if hasattr(eligibility, "model_dump") else eligibility.dict(),
            "documents": documents.model_dump() if hasattr(documents, "model_dump") else documents.dict(),
            "workflow": workflow.model_dump() if hasattr(workflow, "model_dump") else workflow.dict(),
            "survey": state.survey.model_dump() if getattr(state.survey, "model_dump", None) else {},
            "ranked_schemes": [r.model_dump() if hasattr(r, "model_dump") else r.dict() for r in (state.ranked_schemes or [])],
            "planner_output": getattr(state, "planner_output", None),
            "conversation_history": [m.model_dump() for m in state.conversation_memory.messages],
            "current_timestamp": now,
        }

        try:
            result: VerificationResult = llm.generate_json("verification", variables, VerificationResult)
            if self.context.is_cancelled():
                return self.context.stop_state(state)
            self.logger.info("Audit Generated")
        except JSONParsingError as exc:
            state.errors.append(WorkflowError(node="verification", message=str(exc), exception_type=type(exc).__name__, timestamp=datetime.utcnow().isoformat(), recoverable=True))
            state.next_node = None
            return state
        except Exception as exc:
            state.errors.append(WorkflowError(node="verification", message=str(exc), exception_type=type(exc).__name__, timestamp=datetime.utcnow().isoformat(), recoverable=False))
            state.next_node = None
            return state

        # Update state.verification_output and final_response (WorkflowResult)
        state.verification_output = result
        aggregate_result = _normalize_verification_result(result)

        # Build final WorkflowResult minimal mapping
        from ...models.agent_models import WorkflowResult as WFResult, Recommendation

        wf = WFResult(
            workflow_id=None,
            recommendations=state.ranked_schemes,
            research_result=None,
            planner_result=state.planner_output,
            verification_result=aggregate_result,
        )

        state.final_response = wf

        msg = Message(role="system", content="Verification completed", timestamp=now, metadata={"node": "verification"})
        state.messages.append(msg)
        state.metadata.finished_at = now
        state.next_node = None

        self.logger.info("Verification Finished")
        return state
