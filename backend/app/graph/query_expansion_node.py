"""Deterministic Query Expansion Node.

This node expands and normalizes keywords, categories and tags using
deterministic configuration files. It does not call any LLM or external
service and executes in milliseconds.
"""
from __future__ import annotations

import json
import logging
import os
import re
import string
from typing import List, Dict, Set

from .expanded_query import ExpandedRepositoryQuery, WeightedKeyword
from .nodes import WorkflowNode
from .context import ExecutionContext
from .state import WorkflowState, Message


CONFIG_DIR = os.path.join(os.path.dirname(__file__), "config")


def _load_json(name: str):
    path = os.path.join(CONFIG_DIR, name)
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


SYNONYMS = _load_json("synonyms.json") or {}
STOPWORDS = set((_load_json("stopwords.json") or []))
CATEGORY_MAP = _load_json("category_map.json") or {}
TAG_MAP = _load_json("tag_map.json") or {}


def normalize_keyword(k: str) -> str:
    if not k:
        return ""
    # lowercase, trim, remove punctuation
    s = k.lower().strip()
    s = s.translate(str.maketrans("", "", string.punctuation))
    s = re.sub(r"\s+", " ", s)
    return s


def remove_stopwords(keywords: List[str], stopwords: Set[str]) -> (List[str], List[str]):
    cleaned = []
    removed = []
    for k in keywords:
        if k in stopwords:
            removed.append(k)
        else:
            cleaned.append(k)
    return cleaned, removed


def expand_synonyms(keywords: List[str], synonyms: Dict[str, List[str]]) -> List[str]:
    expanded = []
    for k in keywords:
        expanded.append(k)
        if k in synonyms:
            for s in synonyms[k]:
                expanded.append(normalize_keyword(s))
    return expanded


def dedupe_preserve_order(items: List[str]) -> List[str]:
    seen = set()
    out = []
    for it in items:
        if it not in seen and it != "":
            seen.add(it)
            out.append(it)
    return out


class QueryExpansionNode(WorkflowNode):
    name = "query_expansion"

    def __init__(self, context: ExecutionContext, stopwords: Set[str] | None = None, synonyms: Dict | None = None, category_map: Dict | None = None, tag_map: Dict | None = None) -> None:
        super().__init__(context)
        self.logger = context.logger or logging.getLogger(__name__)
        self.stopwords = stopwords or STOPWORDS
        self.synonyms = synonyms or SYNONYMS
        self.category_map = category_map or CATEGORY_MAP
        self.tag_map = tag_map or TAG_MAP

    def execute(self, state: WorkflowState) -> WorkflowState:
        self.logger.info("Query Expansion Started")

        intent = state.intent

        # collect base keywords from intent.keywords and user_profile_summary
        base_keywords = list(intent.keywords or [])
        if getattr(intent, "user_profile_summary", None):
            # also include nouns from profile summary as additional keywords (deterministic: split words)
            words = [w for w in re.split(r"\W+", intent.user_profile_summary) if w]
            base_keywords.extend(words)

        # Normalize
        normalized = [normalize_keyword(k) for k in base_keywords if k]
        self.logger.info("Keywords Loaded: %s", normalized)

        # Remove stopwords
        cleaned, removed = remove_stopwords(normalized, self.stopwords)
        self.logger.info("Stopwords Removed: %s", removed)

        # Synonym expansion
        expanded = expand_synonyms(cleaned, self.synonyms)
        # ensure normalized for expanded terms
        expanded = [normalize_keyword(k) for k in expanded]
        self.logger.info("Synonyms Applied")

        # Dedupe preserving order
        deduped = dedupe_preserve_order(expanded)

        # Category expansion
        categories = [normalize_keyword(c) for c in (intent.categories or [])]
        expanded_categories = []
        for c in categories:
            if c in self.category_map:
                expanded_categories.extend([normalize_keyword(x) for x in self.category_map[c]])
        expanded_categories = dedupe_preserve_order(expanded_categories)
        self.logger.info("Categories Expanded: %s", expanded_categories)

        # Tag expansion
        tags = [normalize_keyword(t) for t in (intent.tags or [])]
        expanded_tags = []
        for t in tags:
            if t in self.tag_map:
                expanded_tags.extend([normalize_keyword(x) for x in self.tag_map[t]])
        expanded_tags = dedupe_preserve_order(expanded_tags)
        self.logger.info("Tags Expanded: %s", expanded_tags)

        # Levels copy
        levels = [normalize_keyword(l) for l in (intent.levels or [])]

        # Weighting: original cleaned keywords weight=1.0, synonyms weight=0.8, profile-derived words weight=0.6
        weighted = []
        original_set = set([normalize_keyword(k) for k in (intent.keywords or [])])
        for kw in deduped:
            if kw in original_set:
                w = 1.0
            elif kw in cleaned:
                # likely original but lowercased
                w = 0.9
            else:
                w = 0.8
            weighted.append(WeightedKeyword(keyword=kw, weight=w))

        # priority keywords: weight >= 0.9
        priority = [wk.keyword for wk in weighted if wk.weight >= 0.9]

        # search string
        search_string = " ".join([wk.keyword for wk in weighted])

        # filters: preserve high-confidence filters from state.repository_query.filters
        filters = state.repository_query.filters or {}

        # stats
        keyword_count = len(deduped)
        removed_stopwords = len(removed)
        expanded_keywords_count = max(0, len(deduped) - len(cleaned))
        duplicate_count = len(expanded) - len(deduped)
        avg_weight = sum(w.weight for w in weighted) / len(weighted) if weighted else 0.0

        expanded_query = ExpandedRepositoryQuery(
            keywords=deduped,
            weighted_keywords=weighted,
            categories=[c for c in categories],
            expanded_categories=expanded_categories,
            tags=[t for t in tags],
            expanded_tags=expanded_tags,
            levels=levels,
            filters=filters,
            search_string=search_string,
            priority_keywords=priority,
            removed_keywords=removed,
            query_statistics={
                "keyword_count": keyword_count,
                "removed_stopwords": removed_stopwords,
                "expanded_keywords": expanded_keywords_count,
                "duplicate_count": duplicate_count,
                "average_weight": avg_weight,
            },
        )

        # Write results back into WorkflowState.repository_query in deterministic fields
        state.repository_query.expanded_keywords = expanded_query.keywords
        state.repository_query.search_parameters = {
            "categories": expanded_query.expanded_categories or expanded_query.categories,
            "tags": expanded_query.expanded_tags or expanded_query.tags,
            "levels": expanded_query.levels,
        }
        state.repository_query.filters = expanded_query.filters
        # store the full expanded query in retrieval_metadata for traceability
        state.repository_query.retrieval_metadata = expanded_query.model_dump() if hasattr(expanded_query, "model_dump") else expanded_query.dict()

        # append message and metadata
        now = datetime_iso = __import__("datetime").datetime.utcnow().isoformat()
        msg = Message(role="system", content=f"Query expanded: {search_string}", timestamp=now, metadata={"node": self.name})
        state.messages.append(msg)
        state.metadata.model_used = state.metadata.model_used or "deterministic-query-expander"
        state.metadata.finished_at = now

        self.logger.info("Repository Query Generated")

        return state
