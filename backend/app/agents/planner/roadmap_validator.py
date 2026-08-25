"""Deterministic Roadmap Validator for Planner Agent."""
from __future__ import annotations

from typing import List

from .planner_models import PlannerResultDetailed, RoadmapStep
from ...graph.state import WorkflowError


def validate_roadmap(result: PlannerResultDetailed) -> List[WorkflowError]:
    errors: List[WorkflowError] = []

    roadmap = result.application_roadmap
    if not roadmap:
        errors.append(WorkflowError(node="planner", message="Empty roadmap", exception_type="ValidationError", recoverable=False))
        return errors

    # check numbering and duplicates
    seen_steps = set()
    for step in roadmap:
        if not step.title or not step.description:
            errors.append(WorkflowError(node="planner", message=f"Empty title/description in step {step.step}", exception_type="ValidationError", recoverable=False))
        if step.step in seen_steps:
            errors.append(WorkflowError(node="planner", message=f"Duplicate step number {step.step}", exception_type="ValidationError", recoverable=False))
        seen_steps.add(step.step)

    # ensure sequential numbering starting at 1
    numbers = sorted([s.step for s in roadmap])
    if numbers != list(range(1, len(numbers) + 1)):
        errors.append(WorkflowError(node="planner", message="Missing or non-sequential step numbers", exception_type="ValidationError", recoverable=False))

    return errors
