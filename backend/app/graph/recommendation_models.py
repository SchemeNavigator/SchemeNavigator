"""Pydantic models for recommendation results returned by the LLM."""
from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class RecommendationEntry(BaseModel):
    scheme_id: Optional[str]
    scheme_name: Optional[str]
    overall_score: float
    confidence: float
    reason: Optional[str]
    pros: List[str] = Field(default_factory=list)
    cons: List[str] = Field(default_factory=list)
    eligibility_analysis: Optional[str]
    benefit_analysis: Optional[str]
    risk_analysis: Optional[str]
    required_documents_summary: Optional[str]
    recommended_priority: Optional[str]


class RecommendationResult(BaseModel):
    recommendations: List[RecommendationEntry] = Field(default_factory=list)
    summary: Optional[str]
    overall_confidence: float = 0.0
    limitations: List[str] = Field(default_factory=list)
    missing_information: List[str] = Field(default_factory=list)
