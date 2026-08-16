"""Structured agent result models for Scheme Navigator.

Purpose:
    Define typed output models that future agents will return.
Responsibilities:
    Provide serializable, testable containers for agent outputs.
Future implementation notes:
    Populate these models from future reasoning and verification phases.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class Recommendation(BaseModel):
    """Placeholder recommendation model.

    Purpose:
        Represent a future scheme recommendation.
    Responsibilities:
        Store recommendation metadata in a structured format.
    Future implementation notes:
        Add confidence, explanation, and provenance fields as needed later.
    """

    scheme_id: str | None = None
    scheme_name: str | None = None
    reason: str | None = None


class ResearchResult(BaseModel):
    """Placeholder result for the future Research Agent.

    Purpose:
        Hold outputs produced by research-oriented workflow steps.
    Responsibilities:
        Provide typed storage for future search and synthesis results.
    Future implementation notes:
        Populate from agent logic in a later phase.
    """

    query: str | None = None
    summary: str | None = None
    recommendations: list[Recommendation] = Field(default_factory=list)


class PlannerResult(BaseModel):
    """Placeholder result for the future Planner Agent.

    Purpose:
        Hold planning outputs for downstream workflow steps.
    Responsibilities:
        Store ordered plan steps and related references.
    Future implementation notes:
        Replace placeholders with real planning outputs later.
    """

    goal: str | None = None
    plan_steps: list[str] = Field(default_factory=list)
    selected_scheme_ids: list[str] = Field(default_factory=list)


class VerificationResult(BaseModel):
    """Placeholder result for the future Verification Agent.

    Purpose:
        Hold document and eligibility verification outputs.
    Responsibilities:
        Store validation status and any future issues or notes.
    Future implementation notes:
        Add verification evidence fields when the verification phase begins.
    """

    verification_status: str | None = None
    verified_scheme_ids: list[str] = Field(default_factory=list)
    rejected_scheme_ids: list[str] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class WorkflowResult(BaseModel):
    """Placeholder aggregate result for the full workflow.

    Purpose:
        Aggregate outputs from future multi-agent runs.
    Responsibilities:
        Provide a single serializable response model for workflow execution.
    Future implementation notes:
        Extend with execution metadata and trace fields when needed.
    """

    workflow_id: str | None = None
    request_id: str | None = None
    correlation_id: str | None = None
    recommendations: list[Recommendation] = Field(default_factory=list)
    research_result: ResearchResult | None = None
    planner_result: PlannerResult | None = None
    verification_result: VerificationResult | None = None
    decision_trace: list[dict[str, Any]] = Field(default_factory=list)
    execution_metadata: dict[str, Any] = Field(default_factory=dict)
    readiness_score: float | None = None
    final_verdict: str | None = None

