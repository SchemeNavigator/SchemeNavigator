"""Pydantic models for verification agent output and reports."""
from __future__ import annotations

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ConsistencyReport(BaseModel):
    planner_references_selected_scheme: bool = False
    recommendation_exists: bool = False
    planner_uses_same_eligibility: bool = False
    planner_uses_same_documents: bool = False
    issues: List[str] = Field(default_factory=list)


class EligibilityAssessment(BaseModel):
    status: str = "Eligibility Uncertain"
    reasons: List[str] = Field(default_factory=list)


class DocumentReport(BaseModel):
    required_documents_listed: List[str] = Field(default_factory=list)
    missing_documents: List[str] = Field(default_factory=list)
    duplicates_removed: List[str] = Field(default_factory=list)
    sufficient: bool = False


class WorkflowReport(BaseModel):
    roadmap_exists: bool = False
    timeline_complete: bool = False
    ordered: bool = False
    duplicates: List[str] = Field(default_factory=list)
    warnings_present: bool = False
    next_action_present: bool = False
    completeness_score: Optional[float] = None


class VerificationResult(BaseModel):
    overall_readiness_score: float = 0.0
    overall_confidence: float = 0.0
    audit_summary: Optional[str] = None
    consistency_assessment: ConsistencyReport
    eligibility_assessment: EligibilityAssessment
    document_assessment: DocumentReport
    workflow_assessment: WorkflowReport
    identified_risks: List[str] = Field(default_factory=list)
    identified_limitations: List[str] = Field(default_factory=list)
    recommended_actions: List[str] = Field(default_factory=list)
    missing_information: List[str] = Field(default_factory=list)
    final_verdict: str = "Unknown"
