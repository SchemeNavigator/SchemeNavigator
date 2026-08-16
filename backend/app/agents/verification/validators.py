"""Deterministic validators for the Verification Agent (stages 1-4)."""
from __future__ import annotations

from typing import List, Dict, Any

from ..verification.models import (
    ConsistencyReport,
    EligibilityAssessment,
    DocumentReport,
    WorkflowReport,
)
from ..graph.state import WorkflowState


def consistency_validator(state: WorkflowState) -> ConsistencyReport:
    issues: List[str] = []
    planner = state.planner_output
    recommendation_exists = bool(state.ranked_schemes)

    planner_refs_selected = False
    planner_uses_same_elig = True
    planner_uses_same_docs = True

    selected_id = getattr(state.selected_scheme, "scheme_id", None) if state.selected_scheme else None
    if planner and selected_id:
        if getattr(planner, "selected_scheme_ids", None):
            planner_refs_selected = selected_id in getattr(planner, "selected_scheme_ids", [])
        else:
            planner_refs_selected = False

    # compare documents and eligibility using metadata if available
    planner_meta = getattr(state.metadata, "planner_result", {}) or {}
    scheme_docs = []
    scheme_elig = ""
    # try to find selected scheme details
    for s in state.candidate_schemes or []:
        if getattr(s, "slug", None) == selected_id or getattr(s, "scheme_name", None) == getattr(state.selected_scheme, "scheme_name", None):
            scheme_docs = _split_docs(getattr(s, "documents", ""))
            scheme_elig = getattr(s, "eligibility", "")
            break

    planner_docs = []
    planner_elig = ""
    if planner_meta:
        planner_docs = planner_meta.get("required_documents", [])
        planner_elig = planner_meta.get("eligibility_summary", "")

    # normalize compare
    if planner_docs and scheme_docs:
        # check if planner includes all scheme docs
        for d in scheme_docs:
            if d not in planner_docs:
                planner_uses_same_docs = False
                issues.append(f"Planner missing document: {d}")

    if planner_elig and scheme_elig:
        if planner_elig.strip().casefold() not in scheme_elig.strip().casefold():
            planner_uses_same_elig = False
            issues.append("Planner eligibility differs from scheme eligibility")

    return ConsistencyReport(
        planner_references_selected_scheme=planner_refs_selected,
        recommendation_exists=recommendation_exists,
        planner_uses_same_eligibility=planner_uses_same_elig,
        planner_uses_same_documents=planner_uses_same_docs,
        issues=issues,
    )


def _split_docs(docs) -> List[str]:
    if not docs:
        return []
    if isinstance(docs, list):
        return [str(d).strip() for d in docs if d]
    return [d.strip() for d in str(docs).split(";") if d.strip()]


def eligibility_validator(state: WorkflowState) -> EligibilityAssessment:
    # Compare survey fields to scheme eligibility text; conservative matching
    survey = state.survey
    selected = state.selected_scheme
    reasons: List[str] = []
    if not survey or not selected:
        return EligibilityAssessment(status="Eligibility Uncertain", reasons=["Missing survey or selected scheme"]) 

    # find selected scheme details
    scheme_text = ""
    for s in state.candidate_schemes or []:
        if getattr(s, "slug", None) == getattr(selected, "scheme_id", None) or getattr(s, "scheme_name", None) == getattr(selected, "scheme_name", None):
            scheme_text = (getattr(s, "eligibility", "") or "").casefold()
            break

    if not scheme_text:
        return EligibilityAssessment(status="Eligibility Uncertain", reasons=["No eligibility details available in repository"]) 

    # check for explicit contradictions: if scheme requires age>=X and survey age less than X -> Likely Not Eligible
    # naive detection: search for numbers and 'age' token
    if "age" in scheme_text:
        # try find number after 'age' keyword
        import re
        m = re.search(r"age[^0-9]*(\d{1,3})", scheme_text)
        if m and survey.age is not None:
            try:
                req_age = int(m.group(1))
                if survey.age < req_age:
                    return EligibilityAssessment(status="Likely Not Eligible", reasons=[f"User age {survey.age} < required {req_age}"])
            except Exception:
                pass

    # check presence of key survey attributes in eligibility text
    present = False
    for val in [survey.state, survey.category, survey.occupation]:
        if val and str(val).casefold() in scheme_text:
            present = True
            reasons.append(f"Eligibility mentions {val}")

    if present:
        return EligibilityAssessment(status="Possibly Eligible", reasons=reasons)

    return EligibilityAssessment(status="Eligibility Uncertain", reasons=["Survey lacks specific fields referenced by eligibility"]) 


def document_validator(state: WorkflowState) -> DocumentReport:
    selected = state.selected_scheme
    docs = []
    # find scheme documents
    for s in state.candidate_schemes or []:
        if getattr(s, "slug", None) == getattr(selected, "scheme_id", None) or getattr(s, "scheme_name", None) == getattr(selected, "scheme_name", None):
            docs = _split_docs(getattr(s, "documents", ""))
            break

    planner_meta = getattr(state.metadata, "planner_result", {}) or {}
    planner_docs = planner_meta.get("required_documents") or []

    duplicates = []
    unique_docs = []
    for d in docs:
        if d in unique_docs:
            duplicates.append(d)
        else:
            unique_docs.append(d)

    missing = [d for d in unique_docs if d not in planner_docs]
    sufficient = len(missing) == 0 and len(unique_docs) > 0

    return DocumentReport(required_documents_listed=unique_docs, missing_documents=missing, duplicates_removed=duplicates, sufficient=sufficient)


def workflow_validator(state: WorkflowState) -> WorkflowReport:
    planner_meta = getattr(state.metadata, "planner_result", {}) or {}
    roadmap = planner_meta.get("application_roadmap") or []
    timeline = planner_meta.get("timeline") or []
    warnings = planner_meta.get("warnings") or []
    next_action = planner_meta.get("next_action")

    roadmap_exists = bool(roadmap)
    timeline_complete = bool(timeline)
    ordered = True
    duplicates = []
    completeness_score = None

    if roadmap_exists:
        # check ordering and duplicates
        steps = [s.get("step") for s in roadmap if isinstance(s, dict) and s.get("step")]
        if steps:
            ordered = steps == sorted(steps)
            dup = set([x for x in steps if steps.count(x) > 1])
            duplicates = list(dup)
            # naive completeness: percent of steps with description
            total = len(roadmap)
            filled = sum(1 for s in roadmap if s.get("description"))
            completeness_score = round((filled / total) * 100, 2) if total else 0.0

    return WorkflowReport(
        roadmap_exists=roadmap_exists,
        timeline_complete=timeline_complete,
        ordered=ordered,
        duplicates=duplicates,
        warnings_present=bool(warnings),
        next_action_present=bool(next_action),
        completeness_score=completeness_score,
    )
