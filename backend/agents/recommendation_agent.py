"""
RecommendationAgent — scores and ranks schemes for a user profile.

The deterministic scoring (weights, criteria) mirrors matchingEngine.ts exactly.
The LLM is used ONLY for generating human-readable explanation strings for the
top matches; scoring itself is rule-based and reproducible.
"""
import hashlib
import json
import logging
from typing import Any

from django.core.cache import cache

from .litellm_client import call_llm

logger = logging.getLogger(__name__)

SCHEME_CACHE_TTL = 60 * 5        # 5 minutes for full scheme list
RECO_CACHE_TTL = 60 * 30         # 30 minutes for recommendation results

# ---------------------------------------------------------------------------
# Deterministic matching (ported 1-to-1 from matchingEngine.ts)
# ---------------------------------------------------------------------------

INCOME_RANGE_ORDER = [
    "Below ₹1 lakh",
    "₹1–2.5 lakh",
    "₹2.5–5 lakh",
    "₹5–10 lakh",
    "₹10 lakh+",
]


def _income_rank(range_str: str) -> int:
    try:
        return INCOME_RANGE_ORDER.index(range_str)
    except ValueError:
        return -1


def _calculate_match(scheme: dict, profile: dict) -> dict:
    """
    Pure Python port of calculateSchemeMatch() from matchingEngine.ts.
    Returns a SchemeMatchResult-shaped dict.
    """
    factors = []
    matched_reasons = []
    unmatched_warnings = []
    total_score = 0

    elig = scheme.get("eligibility") or {}
    user_age = profile.get("age")
    if isinstance(user_age, str) and user_age.strip() == "":
        user_age = None
    if user_age is not None:
        try:
            user_age = int(user_age)
        except (TypeError, ValueError):
            user_age = None

    # ── 1. Age (weight 20) ───────────────────────────────────────────────────
    min_age = elig.get("minAge", 0) or 0
    max_age = elig.get("maxAge", 100) or 100

    if user_age is not None:
        if min_age <= user_age <= max_age:
            total_score += 20
            matched_reasons.append(f"Age requirement compatible ({min_age}–{max_age} years)")
            factors.append({
                "criterion": "Age Criteria",
                "status": "matched",
                "explanation": f"Your age ({user_age} yrs) satisfies the required age bracket ({min_age}–{max_age} yrs).",
                "weight": 20, "score": 20,
            })
        else:
            unmatched_warnings.append(f"Age eligibility typically requires between {min_age} and {max_age} years.")
            factors.append({
                "criterion": "Age Criteria",
                "status": "mismatch",
                "explanation": f"Scheme generally targets {min_age}–{max_age} yrs (provided age: {user_age} yrs).",
                "weight": 20, "score": 0,
            })
    else:
        total_score += 12
        factors.append({
            "criterion": "Age Criteria",
            "status": "neutral",
            "explanation": f"Scheme targets ages {min_age}–{max_age} yrs (provide age in profile for precise match).",
            "weight": 20, "score": 12,
        })

    # ── 2. State / Location (weight 20) ─────────────────────────────────────
    covered_states = scheme.get("coveredStates") or scheme.get("covered_states") or []
    is_all_india = "All India" in covered_states
    user_state = profile.get("state") or ""

    if is_all_india:
        total_score += 20
        matched_reasons.append(f"Applicable across All India including {user_state or 'your state'}")
        factors.append({
            "criterion": "State / Location",
            "status": "matched",
            "explanation": "This is a Central / Nationwide scheme valid across all Indian states and UTs.",
            "weight": 20, "score": 20,
        })
    elif user_state and user_state in covered_states:
        total_score += 20
        matched_reasons.append(f"State-specific scheme actively active in {user_state}")
        factors.append({
            "criterion": "State / Location",
            "status": "matched",
            "explanation": f"Scheme is specially implemented by the State Government of {user_state}.",
            "weight": 20, "score": 20,
        })
    elif user_state:
        unmatched_warnings.append(
            f"This scheme is specific to {', '.join(covered_states)} (your state is {user_state})."
        )
        factors.append({
            "criterion": "State / Location",
            "status": "mismatch",
            "explanation": f"Restricted to residents of {', '.join(covered_states)}.",
            "weight": 20, "score": 0,
        })
    else:
        total_score += 10
        factors.append({
            "criterion": "State / Location",
            "status": "neutral",
            "explanation": f"Valid in {', '.join(covered_states)}.",
            "weight": 20, "score": 10,
        })

    # ── 3. Occupation (weight 15) ────────────────────────────────────────────
    allowed_occ = elig.get("allowedOccupations") or []
    user_occ = profile.get("employmentType") or ""

    if not allowed_occ:
        total_score += 15
        matched_reasons.append("Open to all employment and occupation backgrounds")
        factors.append({
            "criterion": "Occupation",
            "status": "matched",
            "explanation": "Open to all occupation types.",
            "weight": 15, "score": 15,
        })
    elif user_occ and user_occ in allowed_occ:
        total_score += 15
        matched_reasons.append(f"Specifically tailored for {user_occ}s")
        factors.append({
            "criterion": "Occupation",
            "status": "matched",
            "explanation": f"Your occupation profile ({user_occ}) directly aligns with the target beneficiaries.",
            "weight": 15, "score": 15,
        })
    elif user_occ:
        unmatched_warnings.append(f"Targeted primarily at: {', '.join(allowed_occ)} (your profile: {user_occ})")
        factors.append({
            "criterion": "Occupation",
            "status": "mismatch",
            "explanation": f"Focuses on {', '.join(allowed_occ)}.",
            "weight": 15, "score": 3,
        })
    else:
        total_score += 8
        factors.append({
            "criterion": "Occupation",
            "status": "neutral",
            "explanation": f"Beneficiaries: {', '.join(allowed_occ)}.",
            "weight": 15, "score": 8,
        })

    # ── 4. Income (weight 20) ────────────────────────────────────────────────
    user_income = profile.get("incomeRange") or ""
    max_income = elig.get("maxAnnualIncome") or 0
    allowed_ranges = elig.get("incomeRangesAllowed") or []

    if not max_income and not allowed_ranges:
        total_score += 20
        matched_reasons.append("No restrictive annual income ceiling applied")
        factors.append({
            "criterion": "Income Ceiling",
            "status": "matched",
            "explanation": "No maximum income threshold restriction.",
            "weight": 20, "score": 20,
        })
    elif user_income:
        if allowed_ranges:
            if user_income in allowed_ranges:
                total_score += 20
                matched_reasons.append(f"Income range ({user_income}) satisfies financial eligibility criteria")
                factors.append({
                    "criterion": "Income Ceiling",
                    "status": "matched",
                    "explanation": f"Your income bracket ({user_income}) is within the eligible range.",
                    "weight": 20, "score": 20,
                })
            else:
                unmatched_warnings.append(
                    f"Requires income within {' or '.join(allowed_ranges)} (your income: {user_income})"
                )
                factors.append({
                    "criterion": "Income Ceiling",
                    "status": "mismatch",
                    "explanation": f"Scheme specifies income within {', '.join(allowed_ranges)}.",
                    "weight": 20, "score": 4,
                })
        else:
            total_score += 18
            matched_reasons.append("Household income appears within acceptable limits")
            factors.append({
                "criterion": "Income Ceiling",
                "status": "matched",
                "explanation": "Income appears compatible.",
                "weight": 20, "score": 18,
            })
    else:
        total_score += 12
        factors.append({
            "criterion": "Income Ceiling",
            "status": "neutral",
            "explanation": "Income details not provided.",
            "weight": 20, "score": 12,
        })

    # ── 5. Gender (weight 10) ────────────────────────────────────────────────
    allowed_genders = elig.get("allowedGenders") or ["all"]
    user_gender = (profile.get("gender") or "").lower()

    if "all" in [g.lower() for g in allowed_genders] or not allowed_genders:
        total_score += 10
        factors.append({
            "criterion": "Gender Eligibility",
            "status": "matched",
            "explanation": "Open to all genders.",
            "weight": 10, "score": 10,
        })
    elif user_gender and user_gender in [g.lower() for g in allowed_genders]:
        total_score += 10
        matched_reasons.append(f"Gender-specific initiative matching your profile ({user_gender})")
        factors.append({
            "criterion": "Gender Eligibility",
            "status": "matched",
            "explanation": f"Directly targeted for {user_gender} applicants.",
            "weight": 10, "score": 10,
        })
    elif user_gender:
        unmatched_warnings.append(f"Eligible for {', '.join(allowed_genders)} applicants only.")
        factors.append({
            "criterion": "Gender Eligibility",
            "status": "mismatch",
            "explanation": f"Restricted to {', '.join(allowed_genders)}.",
            "weight": 10, "score": 0,
        })
    else:
        total_score += 6
        factors.append({
            "criterion": "Gender Eligibility",
            "status": "neutral",
            "explanation": f"Applicable for {', '.join(allowed_genders)}.",
            "weight": 10, "score": 6,
        })

    # ── 6. Category & Special Signals (weight 15) ───────────────────────────
    allowed_categories = elig.get("allowedCategories") or ["All"]
    user_cat = profile.get("category") or ""
    category_score = 0
    special_matched = True

    if "All" in allowed_categories or not allowed_categories:
        category_score += 8
    elif user_cat and (
        user_cat in allowed_categories
        or (user_cat == "Minority" and elig.get("requiresMinority"))
    ):
        category_score += 8
        matched_reasons.append(f"Social category requirement met ({user_cat})")
    elif user_cat:
        unmatched_warnings.append(f"Reserved for {', '.join(allowed_categories)} categories.")

    if elig.get("requiresDisability"):
        if profile.get("isDisability") or profile.get("hasDisability"):
            category_score += 7
            matched_reasons.append("Benchmark disability criteria satisfied")
        else:
            special_matched = False
            unmatched_warnings.append("Requires certificate of benchmark disability (40%+).")
    elif elig.get("requiresBPL"):
        if profile.get("hasBPLCard") or profile.get("isBPL") or user_income == "Below ₹1 lakh":
            category_score += 7
            matched_reasons.append("BPL / low economic bracket matched")
        else:
            special_matched = False
            unmatched_warnings.append("Priority given to BPL / Antyodaya ration card holders.")
    else:
        category_score += 7

    total_score += min(15, category_score)
    factors.append({
        "criterion": "Category & Special Signals",
        "status": "matched" if special_matched else "mismatch",
        "explanation": (
            "Social category and economic status align with scheme guidelines."
            if special_matched
            else "Special qualification or reservation criteria applies."
        ),
        "weight": 15, "score": category_score,
    })

    # ── Final score ──────────────────────────────────────────────────────────
    score = max(10, min(99, round(total_score)))

    if score >= 85:
        grade = "High Potential"
    elif score >= 70:
        grade = "Good Match"
    elif score >= 50:
        grade = "Moderate Match"
    else:
        grade = "General Match"

    return {
        "scheme": scheme,
        "matchScore": score,
        "matchGrade": grade,
        "matchedReasons": matched_reasons[:4],
        "unmatchedWarnings": unmatched_warnings[:3],
        "factors": factors,
    }


# ---------------------------------------------------------------------------
# LLM explanation generation (batch, called once for top N results)
# ---------------------------------------------------------------------------

EXPLAIN_SYSTEM_PROMPT = """You are a helpful assistant that explains government scheme eligibility in simple, friendly language for Indian citizens.

You will receive a JSON array of {name, matchScore, matchedReasons, unmatchedWarnings} for the top scheme matches.

For each scheme, generate:
1. A 1-sentence "whyGood" explanation of why this scheme suits the user (based on matchedReasons).
2. A 1-sentence "toNote" caveat or next step (based on unmatchedWarnings, or "Looks good — check official portal for latest updates." if no warnings).

Return ONLY a valid JSON array in this exact shape:
[{"slug": "...", "whyGood": "...", "toNote": "..."}, ...]

Keep language simple, friendly, and in the context of Indian government schemes.
Do NOT include any markdown fences or extra text.
"""


def _generate_explanations(top_results: list[dict]) -> dict[str, dict]:
    """
    Call the LLM once with all top results to generate human-readable explanations.
    Returns a dict keyed by scheme slug.
    Falls back gracefully to empty strings if LLM call fails.
    """
    if not top_results:
        return {}

    payload = [
        {
            "slug": r["scheme"].get("slug", ""),
            "name": r["scheme"].get("name", ""),
            "matchScore": r["matchScore"],
            "matchedReasons": r["matchedReasons"],
            "unmatchedWarnings": r["unmatchedWarnings"],
        }
        for r in top_results
    ]

    messages = [
        {"role": "system", "content": EXPLAIN_SYSTEM_PROMPT},
        {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
    ]

    try:
        raw = call_llm(
            messages,
            temperature=0.4,
            max_tokens=1500,
            response_format={"type": "json_object"},
        )
        # LLM may return {"results": [...]} or directly [...]
        parsed = json.loads(raw)
        if isinstance(parsed, dict):
            # unwrap common envelopes
            for key in ("results", "schemes", "data", "explanations"):
                if key in parsed and isinstance(parsed[key], list):
                    parsed = parsed[key]
                    break
        if not isinstance(parsed, list):
            return {}
        return {item["slug"]: item for item in parsed if "slug" in item}
    except Exception as exc:
        logger.warning("RecommendationAgent explanation generation failed: %s", exc)
        return {}


# ---------------------------------------------------------------------------
# Public agent class
# ---------------------------------------------------------------------------

class RecommendationAgent:
    """
    Scores all schemes against a UserProfile and returns ranked SchemeMatchResult list.
    """

    def recommend(self, profile: dict, top_n: int = 50) -> list[dict]:
        """
        Args:
            profile: UserProfile dict (camelCase keys).
            top_n:   Number of top results to enrich with LLM explanations.

        Returns:
            List of SchemeMatchResult dicts, sorted by matchScore descending.
        """
        # ── Build cache key ─────────────────────────────────────────────────
        profile_hash = hashlib.md5(
            json.dumps(profile, sort_keys=True, ensure_ascii=False).encode()
        ).hexdigest()
        cache_key = f"recommendations:{profile_hash}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        # ── Fetch schemes from DB (cached) ───────────────────────────────────
        schemes = self._get_all_schemes()
        if not schemes:
            return []

        # ── Deterministic scoring ────────────────────────────────────────────
        results = [_calculate_match(s, profile) for s in schemes]
        results.sort(
            key=lambda r: (r["matchScore"], r["scheme"].get("popularScore", 0)),
            reverse=True,
        )

        # ── LLM explanations for top N ───────────────────────────────────────
        top = results[:top_n]
        explanations = _generate_explanations(top[:20])  # only enrich top 20 with LLM

        for result in top:
            slug = result["scheme"].get("slug", "")
            if slug in explanations:
                exp = explanations[slug]
                result["whyGood"] = exp.get("whyGood", "")
                result["toNote"] = exp.get("toNote", "")

        cache.set(cache_key, top, RECO_CACHE_TTL)
        return top

    @staticmethod
    def _get_all_schemes() -> list[dict]:
        """
        Fetch all schemes from the database, cached for 5 minutes.
        Returns a list of dicts (not model instances) for serialisation safety.
        """
        cache_key = "recommendations:all_schemes"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        from schemes.models import Scheme
        from schemes.serializers import SchemeSerializer

        qs = Scheme.objects.all()
        data = SchemeSerializer(qs, many=True).data
        # Convert OrderedDict/ReturnList to plain list of dicts
        schemes = [dict(s) for s in data]
        cache.set(cache_key, schemes, SCHEME_CACHE_TTL)
        return schemes
