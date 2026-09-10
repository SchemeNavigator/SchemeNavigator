"""
AssistantAgent — powers the natural-language chat interface.

Responsibilities:
1. Detect if the user is describing themselves → call ProfileAgent to update profile.
2. Retrieve top relevant schemes via keyword search.
3. Build conversation context window (last 10 messages).
4. Call LLM with grounded scheme context.
5. Return answer + list of referenced scheme IDs.
"""
import json
import logging
import re

from .litellm_client import call_llm
from .profile_agent import ProfileAgent

logger = logging.getLogger(__name__)

SYSTEM_PROMPT_TEMPLATE = """You are SchemeNavigator Assistant, an expert on Indian government welfare schemes.

Your role is to help Indian citizens find government schemes they are eligible for, explain eligibility criteria,
guide them through the application process, and answer questions about specific schemes.

Guidelines:
- Be friendly, clear, and use simple language.
- Always ground your answers in the scheme data provided below.
- If you reference a scheme, include its slug in a special tag at the end: <schemes>slug1,slug2</schemes>
- If the user describes their personal situation, acknowledge what you understood about their profile.
- If a question is unrelated to government schemes, politely redirect.
- Responses should be concise (2–4 paragraphs max).

AVAILABLE SCHEME CONTEXT (top matches for this session):
{scheme_context}
"""

PROFILE_DETECTION_KEYWORDS = [
    "i am", "i'm", "i have", "my income", "my age", "i live",
    "my family", "i work", "i farm", "i study", "i'm a", "i am a",
    "year old", "years old", "from ", "belong to", "my state",
]


def _might_contain_profile(text: str) -> bool:
    """Heuristic: does this message contain self-description?"""
    lower = text.lower()
    return any(kw in lower for kw in PROFILE_DETECTION_KEYWORDS)


def _search_schemes(query: str, limit: int = 5) -> list[dict]:
    """
    Simple keyword search across schemes in the database.
    Returns list of Scheme serializer dicts.
    """
    from django.db.models import Q
    from schemes.models import Scheme
    from schemes.serializers import SchemeSerializer

    qs = Scheme.objects.filter(
        Q(name__icontains=query)
        | Q(tags__icontains=query)
        | Q(short_description__icontains=query)
        | Q(category__icontains=query)
    ).order_by("-popular_score")[:limit]

    if not qs.exists():
        # Fallback: return popular schemes
        qs = Scheme.objects.order_by("-popular_score")[:limit]

    return [dict(s) for s in SchemeSerializer(qs, many=True).data]


def _build_scheme_context(schemes: list[dict]) -> str:
    """Format scheme summaries for injection into the system prompt."""
    if not schemes:
        return "No specific schemes loaded for this query."
    lines = []
    for s in schemes:
        lines.append(
            f"- [{s.get('slug','')}] {s.get('name','')} ({s.get('category','')}): "
            f"{s.get('shortDescription', s.get('short_description', ''))}"
        )
    return "\n".join(lines)


def _extract_scheme_slugs(text: str) -> list[str]:
    """
    Parse <schemes>slug1,slug2</schemes> tags from the LLM response.
    Returns a list of slug strings.
    """
    match = re.search(r"<schemes>(.*?)</schemes>", text, re.IGNORECASE | re.DOTALL)
    if not match:
        return []
    raw = match.group(1)
    return [s.strip() for s in raw.split(",") if s.strip()]


def _clean_response(text: str) -> str:
    """Remove the <schemes>...</schemes> tag from the user-facing text."""
    return re.sub(r"<schemes>.*?</schemes>", "", text, flags=re.IGNORECASE | re.DOTALL).strip()


class AssistantAgent:
    """
    Handles a single chat turn for the scheme assistant.
    """

    def __init__(self):
        self._profile_agent = ProfileAgent()

    def chat(
        self,
        history: list[dict],
        message: str,
        current_profile: dict | None = None,
    ) -> dict:
        """
        Process one chat message and return the assistant's response.

        Args:
            history: List of {"role": "user"|"assistant", "content": str} dicts.
                     Pass the last N messages (agent uses last 10).
            message: The new user message.
            current_profile: The session's current UserProfile dict (may be None).

        Returns:
            {
                "answer": str,                 — cleaned assistant reply
                "referenced_scheme_ids": list[str],  — scheme slugs mentioned
                "updated_profile": dict | None, — non-None if profile was updated
            }
        """
        updated_profile = None

        # ── Step 1: Profile extraction (if user describes themselves) ─────────
        if _might_contain_profile(message):
            extracted = self._profile_agent.extract(message)
            if extracted:
                # Merge into existing profile
                merged = dict(current_profile or {})
                merged.update(extracted)
                updated_profile = merged

        # ── Step 2: Retrieve relevant schemes ────────────────────────────────
        relevant_schemes = _search_schemes(message, limit=6)

        # Also include top recommendations if we have a profile
        effective_profile = updated_profile or current_profile
        if effective_profile:
            try:
                from agents.recommendation_agent import RecommendationAgent
                reco_agent = RecommendationAgent()
                top_recos = reco_agent.recommend(effective_profile, top_n=5)
                reco_schemes = [r["scheme"] for r in top_recos[:3]]
                # Deduplicate by slug
                seen_slugs = {s.get("slug") for s in relevant_schemes}
                for s in reco_schemes:
                    if s.get("slug") not in seen_slugs:
                        relevant_schemes.append(s)
                        seen_slugs.add(s.get("slug"))
            except Exception as exc:
                logger.warning("Assistant: could not load recommendations: %s", exc)

        scheme_context = _build_scheme_context(relevant_schemes[:8])

        # ── Step 3: Build messages for LLM ────────────────────────────────────
        system_content = SYSTEM_PROMPT_TEMPLATE.format(scheme_context=scheme_context)
        llm_messages = [{"role": "system", "content": system_content}]

        # Include last 10 conversation turns
        for turn in history[-10:]:
            if turn.get("role") in ("user", "assistant") and turn.get("content"):
                llm_messages.append({"role": turn["role"], "content": turn["content"]})

        llm_messages.append({"role": "user", "content": message})

        # ── Step 4: Call LLM ──────────────────────────────────────────────────
        try:
            raw_response = call_llm(llm_messages, temperature=0.5, max_tokens=700)
        except RuntimeError as exc:
            logger.error("AssistantAgent LLM call failed: %s", exc)
            raw_response = (
                "I'm sorry, I'm having trouble connecting to the AI service right now. "
                "Please try again in a moment. In the meantime, you can browse schemes using the Explore page."
            )

        # ── Step 5: Extract referenced schemes and clean response ─────────────
        referenced_slugs = _extract_scheme_slugs(raw_response)
        answer = _clean_response(raw_response)

        # Resolve slugs to scheme IDs (slugs = IDs in our system)
        return {
            "answer": answer,
            "referenced_scheme_ids": referenced_slugs,
            "updated_profile": updated_profile,
        }
