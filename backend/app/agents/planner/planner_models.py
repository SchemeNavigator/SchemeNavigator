"""Pydantic models for Planner Agent output used for LLM parsing and validation."""
from __future__ import annotations

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class RoadmapStep(BaseModel):
    step: int
    title: str
    description: str
    estimated_time_minutes: Optional[int] = None
    dependencies: List[str] = Field(default_factory=list)
    completion_criteria: Optional[str] = None


class PlannerResultDetailed(BaseModel):
    application_roadmap: List[RoadmapStep] = Field(default_factory=list)
    timeline: List[Dict[str, Any]] = Field(default_factory=list)
    required_documents: List[Dict[str, Any]] = Field(default_factory=list)
    document_descriptions: Dict[str, str] = Field(default_factory=dict)
    eligibility_summary: Optional[str] = None
    estimated_effort: Optional[str] = None
    estimated_duration: Optional[str] = None
    warnings: List[str] = Field(default_factory=list)
    tips: List[str] = Field(default_factory=list)
    common_mistakes: List[str] = Field(default_factory=list)
    next_action: Optional[str] = None
    application_summary: Optional[str] = None
