"""Pydantic models for verification agent output and reports."""
from __future__ import annotations

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ConsistencyReport(BaseModel):
    planner_references_selected_scheme: bool
    recommendation_exists: bool
    planner_uses_same_eligibility: bool
    planner_uses_same_documents: bool
    issues: List[str] = Field(default_factory=list)


class EligibilityAssessment(BaseModel):
    status: str  # Clearly Eligible | Possibly Eligible | Eligibility Uncertain | Likely Not Eligible
    reasons: List[str] = Field(default_factory=list)


class DocumentReport(BaseModel):
    required_documents_listed: List[str] = Field(default_factory=list)
    missing_documents: List[str] = Field(default_factory=list)
    duplicates_removed: List[str] = Field(default_factory=list)
    sufficient: bool = False


class WorkflowReport(BaseModel):
    roadmap_exists: bool
    timeline_complete: bool
    ordered: bool
    duplicates: List[str] = Field(default_factory=list)
    warnings_present: bool
    next_action_present: bool
    completeness_score: Optional[float]


class VerificationResult(BaseModel):
    overall_readiness_score: float
    overall_confidence: float
    audit_summary: Optional[str]
    consistency_assessment: ConsistencyReport
    eligibility_assessment: EligibilityAssessment
    document_assessment: DocumentReport
    workflow_assessment: WorkflowReport
    identified_risks: List[str] = Field(default_factory=list)
    identified_limitations: List[str] = Field(default_factory=list)
    recommended_actions: List[str] = Field(default_factory=list)
    missing_information: List[str] = Field(default_factory=list)
    final_verdict: str
