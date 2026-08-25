from __future__ import annotations

from typing import Any

from app.models.agent_models import VerificationResult as AggregateVerificationResult


def normalize_verification_result(value: Any) -> AggregateVerificationResult | None:
    if value is None:
        return None
    if isinstance(value, AggregateVerificationResult):
        return value

    raw = value.model_dump() if hasattr(value, "model_dump") else getattr(value, "__dict__", {})
    notes = raw.get("notes") or []
    if raw.get("audit_summary"):
        notes = list(notes) + [str(raw["audit_summary"])]

    return AggregateVerificationResult(
        verification_status=str(raw.get("verification_status") or raw.get("final_verdict") or "completed"),
        verified_scheme_ids=list(raw.get("verified_scheme_ids") or []),
        rejected_scheme_ids=list(raw.get("rejected_scheme_ids") or []),
        notes=[str(note) for note in notes],
    )
