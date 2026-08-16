"""Deterministic Timeline Builder for Planner Agent."""
from __future__ import annotations

from typing import Any, Dict, List


def build_timeline(planning_context: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Create an ordered timeline of steps from planning context.

    Deterministic rules:
    - If `required_documents` present, create collect-document steps in listed order.
    - Add step to fill application, submit, and track.
    - Preserve ordering where possible.
    """
    timeline: List[Dict[str, Any]] = []
    docs = planning_context.get("required_documents")
    step_no = 1
    if docs:
        # split by common separators if it's a string
        if isinstance(docs, str):
            items = [d.strip() for d in docs.split(";") if d.strip()]
        elif isinstance(docs, list):
            items = [str(d).strip() for d in docs if d]
        else:
            items = [str(docs)]

        for doc in items:
            timeline.append({
                "step": step_no,
                "title": f"Collect document: {doc}",
                "description": f"Obtain {doc} required for application.",
                "estimated_time_minutes": 60,
                "dependencies": [],
                "completion_criteria": f"Have a valid {doc} ready",
            })
            step_no += 1

    # application form
    timeline.append({
        "step": step_no,
        "title": "Fill Application Form",
        "description": "Complete the official application form with accurate details.",
        "estimated_time_minutes": 30,
        "dependencies": [],
        "completion_criteria": "All required fields filled",
    })
    step_no += 1

    timeline.append({
        "step": step_no,
        "title": "Submit Documents",
        "description": "Upload or physically submit required documents as instructed.",
        "estimated_time_minutes": 15,
        "dependencies": [],
        "completion_criteria": "Submission reference received",
    })
    step_no += 1

    timeline.append({
        "step": step_no,
        "title": "Track Application",
        "description": "Monitor application status via the official portal or contact point.",
        "estimated_time_minutes": 10,
        "dependencies": [],
        "completion_criteria": "Final decision communicated",
    })

    return timeline
