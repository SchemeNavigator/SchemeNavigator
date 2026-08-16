"""Deterministic retrieval engine for repository schemes."""
from __future__ import annotations

import json
import os
import time
from typing import List, Dict, Any, Tuple

from pydantic import BaseModel

from app.models.scheme import Scheme

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "retrieval_config.json")


def _load_config():
    if not os.path.exists(CONFIG_PATH):
        return {}
    with open(CONFIG_PATH, "r", encoding="utf-8") as fh:
        return json.load(fh)


CONFIG = _load_config()


class CandidateScheme(BaseModel):
    scheme: Scheme
    relevance_score: float
    matched_keywords: List[str]
    matched_tags: List[str]
    matched_categories: List[str]
    matched_fields: List[str]
    field_scores: Dict[str, float]
    explanation: str


class CandidateCollection(BaseModel):
    total_examined: int
    total_candidates: int
    retrieval_time_ms: int
    candidate_schemes: List[CandidateScheme]
    statistics: Dict[str, Any]


class RetrievalEngine:
    """Search and rank schemes deterministically.

    The engine accepts an expanded query (a dict-like with keywords, categories,
    tags, levels, filters) and returns a ranked CandidateCollection.
    """

    def __init__(self, repository, config: Dict | None = None) -> None:
        self.repository = repository
        self.config = config or CONFIG

    @staticmethod
    def _normalize_text(value: Any) -> str:
        if value is None:
            return ""
        return str(value).casefold()

    def _field_value(self, scheme: Scheme, field: str) -> str:
        val = getattr(scheme, field, "")
        if isinstance(val, list):
            return " ".join(val)
        return str(val)

    def score_scheme(self, scheme: Scheme, weighted_keywords: List[Dict[str, Any]], categories: List[str], tags: List[str], levels: List[str]) -> Tuple[float, Dict[str, Any]]:
        field_weights = self.config.get("field_weights", {})
        category_bonus = float(self.config.get("category_bonus", 0.0))
        tag_bonus = float(self.config.get("tag_bonus", 0.0))
        level_bonus = float(self.config.get("level_bonus", 0.0))
        penalty_missing = float(self.config.get("penalty_missing_keyword", 0.0))
        weak_match_penalty = float(self.config.get("weak_match_penalty", 0.0))

        total_score = 0.0
        matched_keywords = []
        matched_tags = []
        matched_categories = []
        matched_fields = set()
        field_scores = {}

        # Precompute normalized field text
        fields_to_check = [
            "scheme_name",
            "details",
            "benefits",
            "eligibility",
            "application",
            "documents",
            "scheme_category",
            "tags",
            "level",
        ]

        normalized_fields = {f: self._normalize_text(self._field_value(scheme, f)) for f in fields_to_check}

        # Keyword matching
        for wk in weighted_keywords:
            kw = self._normalize_text(wk.get("keyword") or wk.get("keyword"))
            w = float(wk.get("weight", 1.0))
            matched = False
            # check across fields
            for field in fields_to_check:
                text = normalized_fields.get(field, "")
                if not text:
                    continue
                if kw in text:
                    fw = float(field_weights.get(field, 1.0))
                    score_inc = w * fw
                    total_score += score_inc
                    field_scores[field] = field_scores.get(field, 0.0) + score_inc
                    matched = True
                    matched_fields.add(field)
            if matched:
                matched_keywords.append(kw)
            else:
                # penalty for missing important keyword
                total_score -= penalty_missing * w

        # Category bonus
        for c in categories or []:
            c_norm = self._normalize_text(c)
            scheme_cat = normalized_fields.get("scheme_category", "")
            if c_norm in scheme_cat:
                total_score += category_bonus
                matched_categories.append(c_norm)

        # Tag bonus
        for t in tags or []:
            t_norm = self._normalize_text(t)
            # tags field normalization already covers tag list
            if t_norm in normalized_fields.get("tags", ""):
                total_score += tag_bonus
                matched_tags.append(t_norm)

        # Level bonus
        for l in levels or []:
            l_norm = self._normalize_text(l)
            if l_norm in normalized_fields.get("level", ""):
                total_score += level_bonus

        # penalties for low field scores
        # small normalization
        if total_score < 0:
            total_score = max(total_score, -10.0)

        explanation = f"Matched keywords: {matched_keywords}; categories: {matched_categories}; tags: {matched_tags}; fields: {list(matched_fields)}"

        return total_score, {
            "matched_keywords": matched_keywords,
            "matched_tags": matched_tags,
            "matched_categories": matched_categories,
            "matched_fields": list(matched_fields),
            "field_scores": field_scores,
            "explanation": explanation,
        }

    def retrieve(self, expanded_query: Dict[str, Any]) -> CandidateCollection:
        start = time.time()

        # initial fetch
        all_schemes = self.repository.load_all()
        total_examined = len(all_schemes)

        # Prepare weights
        weighted_keywords = expanded_query.get("weighted_keywords") or []
        # weighted_keywords may be list of dicts or models
        wk_list = []
        for wk in weighted_keywords:
            if hasattr(wk, "keyword"):
                wk_list.append({"keyword": wk.keyword, "weight": wk.weight})
            elif isinstance(wk, dict):
                wk_list.append({"keyword": wk.get("keyword"), "weight": wk.get("weight", 1.0)})

        categories = expanded_query.get("categories") or []
        expanded_categories = expanded_query.get("expanded_categories") or []
        tags = expanded_query.get("tags") or []
        expanded_tags = expanded_query.get("expanded_tags") or []
        levels = expanded_query.get("levels") or []

        candidates: List[CandidateScheme] = []

        for scheme in all_schemes:
            score, details = self.score_scheme(scheme, wk_list, categories + expanded_categories, tags + expanded_tags, levels)
            if score <= 0:
                continue
            cs = CandidateScheme(
                scheme=scheme,
                relevance_score=round(score, 4),
                matched_keywords=details["matched_keywords"],
                matched_tags=details["matched_tags"],
                matched_categories=details["matched_categories"],
                matched_fields=details["matched_fields"],
                field_scores=details["field_scores"],
                explanation=details["explanation"],
            )
            candidates.append(cs)

        # sort
        candidates.sort(key=lambda c: c.relevance_score, reverse=True)

        # dedupe by slug
        seen = set()
        deduped = []
        for c in candidates:
            slug = c.scheme.slug
            if slug in seen:
                continue
            seen.add(slug)
            deduped.append(c)

        limit = int(self.config.get("result_limit", 20))
        final = deduped[:limit]

        retrieval_time_ms = int((time.time() - start) * 1000)

        scores = [c.relevance_score for c in final]
        statistics = {
            "average_score": sum(scores) / len(scores) if scores else 0.0,
            "highest_score": max(scores) if scores else 0.0,
            "lowest_score": min(scores) if scores else 0.0,
            "repository_size": total_examined,
            "candidate_count": len(final),
            "filtered_count": total_examined - len(final),
        }

        return CandidateCollection(
            total_examined=total_examined,
            total_candidates=len(final),
            retrieval_time_ms=retrieval_time_ms,
            candidate_schemes=final,
            statistics=statistics,
        )
