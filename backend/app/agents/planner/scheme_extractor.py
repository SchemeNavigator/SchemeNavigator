"""Deterministic Scheme Information Extractor for Planner Agent."""
from __future__ import annotations

from typing import Any, Dict

def extract_scheme_context(selected_scheme: Any, candidates: list[Any]) -> Dict[str, Any]:
    """Extract structured information for planning from a selected scheme.

    - `selected_scheme` may be a minimal Recommendation (with scheme_id)
    - `candidates` is a list of Scheme objects to locate detailed info

    Returns a dict with normalized planning context fields.
    """
    scheme_id = getattr(selected_scheme, "scheme_id", None)
    scheme_name = getattr(selected_scheme, "scheme_name", None)

    # find detailed scheme in candidates
    detail = None
    for s in candidates or []:
        sid = getattr(s, "slug", None)
        name = getattr(s, "scheme_name", None)
        if scheme_id and sid == scheme_id:
            detail = s
            break
        if scheme_name and name == scheme_name:
            detail = s
            break

    context = {
        "scheme_id": scheme_id,
        "scheme_name": scheme_name or getattr(detail, "scheme_name", None),
        "summary": getattr(detail, "details", None) if detail else None,
        "benefits": getattr(detail, "benefits", None) if detail else None,
        "eligibility": getattr(detail, "eligibility", None) if detail else None,
        "required_documents": getattr(detail, "documents", None) if detail else None,
        "application_notes": getattr(detail, "application", None) if detail else None,
        "official_link": None,  # repository has no link column; keep None
        "deadlines": None,  # if unavailable
        "location_level": getattr(detail, "level", None) if detail else None,
    }

    return context
