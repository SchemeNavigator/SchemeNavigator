"""Pydantic models for recommendation results returned by the LLM."""
from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class RecommendationEntry(BaseModel):
    scheme_id: Optional[str] = None
    scheme_name: Optional[str] = None
    overall_score: float
    confidence: float
    reason: Optional[str] = None
    pros: List[str] = Field(default_factory=list)
    cons: List[str] = Field(default_factory=list)
    eligibility_analysis: Optional[str] = None
    benefit_analysis: Optional[str] = None
    risk_analysis: Optional[str] = None
    required_documents_summary: Optional[str] = None
    recommended_priority: Optional[str] = None


class RecommendationResult(BaseModel):
    recommendations: List[RecommendationEntry] = Field(default_factory=list)
    summary: Optional[str] = None
    overall_confidence: float = 0.0
    limitations: List[str] = Field(default_factory=list)
    missing_information: List[str] = Field(default_factory=list)
