"""Models for expanded repository queries."""
from __future__ import annotations

from typing import List, Dict, Any

from pydantic import BaseModel, Field


class WeightedKeyword(BaseModel):
    keyword: str
    weight: float


class QueryStatistics(BaseModel):
    keyword_count: int = 0
    removed_stopwords: int = 0
    expanded_keywords: int = 0
    duplicate_count: int = 0
    average_weight: float = 0.0


class ExpandedRepositoryQuery(BaseModel):
    keywords: List[str] = Field(default_factory=list)
    weighted_keywords: List[WeightedKeyword] = Field(default_factory=list)
    categories: List[str] = Field(default_factory=list)
    expanded_categories: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    expanded_tags: List[str] = Field(default_factory=list)
    levels: List[str] = Field(default_factory=list)
    filters: Dict[str, Any] = Field(default_factory=dict)
    search_string: str = ""
    priority_keywords: List[str] = Field(default_factory=list)
    removed_keywords: List[str] = Field(default_factory=list)
    query_statistics: QueryStatistics = Field(default_factory=QueryStatistics)
