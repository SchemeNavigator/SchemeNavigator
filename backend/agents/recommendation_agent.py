"""
RecommendationAgent — AI-powered scheme matching & recommendation engine.

Analyzes the citizen's detailed demographic, occupational, and economic profile
using Google Gemini AI intelligence, grounded in the 3,866 verified schemes database.
Returns top 20 strictly relevant, high-impact schemes.
"""
import hashlib
import json
import logging
from typing import Any, Optional

from django.core.cache import cache

from .litellm_client import call_llm

logger = logging.getLogger(__name__)

SCHEME_CACHE_TTL = 60 * 10        # 10 minutes for full scheme list
RECO_CACHE_TTL = 60 * 30          # 30 minutes for recommendation results

FEMALE_ONLY_KEYWORDS = [
    "mahila", "kanya", "sukanya", "widow", "maternity", "pregnant",
    "girl child", "kishori", "ladli", "women ", "female only", "matru vandana",
    "laxmi", "bhagyashree", "prasooti"
]

OCC_POSITIVE_KEYWORDS = {
    "farmer": [
        "kisan", "fasal", "krishi", "crop", "farmer", "kusum", "dairy", "soil",
        "irrigation", "agriculture", "tractor", "seed", "horticulture",
        "animal husbandry", "fertilizer", "pashu", "farm"
    ],
    "student": [
        "student", "scholarship", "fellowship", "study", "school", "college",
        "tuition", "coaching", "education", "shiksha", "matric", "degree",
        "internship", "laptop", "merit", "aicte", "vidyarthi"
    ],
    "business owner": [
        "msme", "mudra", "startup", "business", "enterprise", "loan",
        "entrepreneur", "subsidy", "udyam", "standup", "credit", "venture",
        "industry", "export", "incubation"
    ],
    "self-employed": [
        "mudra", "svanidhi", "self employed", "business", "enterprise", "loan",
        "artisan", "craftsman", "vishwakarma", "pmegp", "credit", "vendor",
        "handloom", "weaver", "skill"
    ],
    "unemployed": [
        "mgnrega", "employment", "rozgar", "kaushal", "pmkvy", "skill",
        "training", "apprentice", "labour", "shramik", "unemployed", "job"
    ],
    "homemaker": [
        "women", "shg", "aajeevika", "livelihood", "mahila", "ujjwala",
        "ration", "self help group", "nutrition", "poshan", "maternity",
        "lakhpati didi"
    ],
    "retired": [
        "pension", "senior citizen", "old age", "retirement", "vridha",
        "elderly", "atal pension", "ignaps", "healthcare"
    ],
    "employed": [
        "housing", "awas", "insurance", "health", "pension", "social security",
        "pf", "esic", "tax benefit"
    ]
}

OCC_PRIMARY_CATEGORIES = {
    "farmer": ["Agriculture", "Financial Assistance"],
    "student": ["Education", "Skill Development"],
    "business owner": ["Business", "Financial Assistance", "Skill Development"],
    "self-employed": ["Business", "Financial Assistance", "Skill Development"],
    "unemployed": ["Employment", "Skill Development", "Financial Assistance"],
    "homemaker": ["Women & Child", "Social Security", "Healthcare"],
    "retired": ["Social Security", "Healthcare", "Financial Assistance"],
    "employed": ["Social Security", "Healthcare", "Housing", "Financial Assistance"],
    "other": ["Financial Assistance", "Social Security", "Healthcare"]
}


def _precision_score(scheme: dict, profile: dict) -> tuple[int, str, list[str], list[str], list[dict]]:
    """
    Evaluates a scheme against citizen profile with strict domain & eligibility filters.
    Returns (score, grade, matched_reasons, unmatched_warnings, factors).
    """
    matched_reasons = []
    unmatched_warnings = []
    factors = []
    score = 0.0

    user_state = (profile.get("state") or "").strip()
    user_gender = str(profile.get("gender") or "").strip().lower()
    user_occ = str(profile.get("employmentType") or profile.get("occupation") or "").strip().lower()
    user_income = profile.get("incomeRange") or ""
    user_cat = profile.get("category") or ""
    user_age = profile.get("age")
    try:
        user_age = int(user_age) if user_age is not None and str(user_age).strip() != "" else None
    except (ValueError, TypeError):
        user_age = None

    covered_states = scheme.get("covered_states") or scheme.get("coveredStates") or []
    name_lower = (scheme.get("name") or "").lower()
    tagline_lower = (scheme.get("tagline") or "").lower()
    desc_lower = (scheme.get("short_description") or scheme.get("shortDescription") or "").lower()
    cat = scheme.get("category") or ""
    elig = scheme.get("eligibility") or {}

    # 1. State Verification (Strict)
    is_all_india = "All India" in covered_states
    is_user_state = bool(user_state and (user_state in covered_states or any(user_state.lower() in s.lower() for s in covered_states)))

    if is_user_state:
        score += 25
        matched_reasons.append(f"State-specific scheme for residents of {user_state}")
        factors.append({"criterion": "State Location", "status": "matched", "explanation": f"Active in {user_state}.", "weight": 25, "score": 25})
    elif is_all_india:
        score += 20
        matched_reasons.append("Central / Nationwide scheme applicable across All India")
        factors.append({"criterion": "State Location", "status": "matched", "explanation": "Central scheme valid nationwide.", "weight": 25, "score": 20})
    elif user_state:
        # Belongs strictly to another state
        return 0, "Not Eligible", [], [f"Not applicable in {user_state} (State: {', '.join(covered_states)})"], []
    else:
        score += 15
        factors.append({"criterion": "State Location", "status": "neutral", "explanation": "Location open.", "weight": 25, "score": 15})

    # 2. Gender Verification (Strict)
    is_female_scheme = cat == "Women & Child" or any(kw in name_lower or kw in tagline_lower for kw in FEMALE_ONLY_KEYWORDS)
    if user_gender == "male" and is_female_scheme:
        return 0, "Not Eligible", [], ["Targeted specifically for female beneficiaries"], []

    if user_gender == "female" and is_female_scheme:
        score += 20
        matched_reasons.append("Specially targeted for women empowerment & welfare")
        factors.append({"criterion": "Gender Eligibility", "status": "matched", "explanation": "Targeted for women.", "weight": 20, "score": 20})
    elif not is_female_scheme:
        score += 10
        factors.append({"criterion": "Gender Eligibility", "status": "matched", "explanation": "Open to all genders.", "weight": 20, "score": 10})

    # 3. Age Verification
    min_age = elig.get("minAge", 0) or 0
    max_age = elig.get("maxAge", 100) or 100
    if user_age is not None:
        if min_age <= user_age <= max_age:
            score += 15
            matched_reasons.append(f"Age ({user_age} yrs) matches eligibility bracket ({min_age}–{max_age} yrs)")
            factors.append({"criterion": "Age Requirement", "status": "matched", "explanation": f"Within {min_age}–{max_age} yrs.", "weight": 15, "score": 15})
        elif user_age > max_age + 8 or user_age < min_age - 5:
            score -= 25
            unmatched_warnings.append(f"Target age group is {min_age}–{max_age} yrs")
            factors.append({"criterion": "Age Requirement", "status": "mismatch", "explanation": f"Target is {min_age}–{max_age} yrs.", "weight": 15, "score": 0})
        else:
            score += 5
            factors.append({"criterion": "Age Requirement", "status": "neutral", "explanation": "Age close to bracket.", "weight": 15, "score": 5})
    else:
        score += 10
        factors.append({"criterion": "Age Requirement", "status": "neutral", "explanation": "Age not specified.", "weight": 15, "score": 10})

    # 4. Occupation & Domain Relevance (Heavy Weight)
    occ_key = next((k for k in OCC_PRIMARY_CATEGORIES if k in user_occ), "other")
    primary_cats = OCC_PRIMARY_CATEGORIES.get(occ_key, [])
    occ_keywords = OCC_POSITIVE_KEYWORDS.get(occ_key, [])

    if cat in primary_cats:
        score += 25
        matched_reasons.append(f"Directly matches your occupation profile ({profile.get('employmentType') or 'Current role'})")
        factors.append({"criterion": "Occupation Alignment", "status": "matched", "explanation": f"Category aligns with {occ_key}.", "weight": 25, "score": 25})
    else:
        factors.append({"criterion": "Occupation Alignment", "status": "neutral", "explanation": "General welfare category.", "weight": 25, "score": 10})

    has_occ_kw = any(kw in name_lower or kw in tagline_lower or kw in desc_lower for kw in occ_keywords)
    if has_occ_kw:
        score += 20
        matched_reasons.append(f"High relevance to your day-to-day {profile.get('employmentType') or 'work'} activities")

    # Negative penalty for conflicting occupations
    if occ_key == "farmer":
        if cat in ["Education", "Skill Development"] and not any(kw in name_lower for kw in ["kisan", "farmer", "krishi", "rural"]):
            score -= 35
    elif occ_key == "student":
        if cat == "Agriculture" and not any(kw in name_lower for kw in ["student", "scholarship", "education"]):
            score -= 35

    # 5. Income & BPL Priority
    is_low_income = user_income in ["Below ₹1 lakh", "₹1–2.5 lakh"] or profile.get("hasBPLCard") or profile.get("isBPL")
    is_poverty_scheme = any(kw in name_lower or kw in tagline_lower or kw in desc_lower for kw in ["bpl", "garib", "ration", "awas", "ayushman", "pmjay", "subsidy", "free", "antyodaya", "poor", "poverty", "ujjwala"])

    if is_low_income and is_poverty_scheme:
        score += 15
        matched_reasons.append("Eligible for subsidized government assistance based on income bracket")
        factors.append({"criterion": "Income & Welfare", "status": "matched", "explanation": "Priority for low-income/BPL households.", "weight": 15, "score": 15})
    elif not is_low_income and "bpl" in name_lower:
        score -= 20
        unmatched_warnings.append("Requires BPL ration card or low income certificate")

    # 6. Caste / Reservation Bonus
    if user_cat in ["SC", "ST", "OBC", "Minority"]:
        if user_cat.lower() in name_lower or user_cat.lower() in tagline_lower:
            score += 15
            matched_reasons.append(f"Special reservation quota for {user_cat} category")

    # 7. National Popularity & Impact
    pop = float(scheme.get("popular_score") or scheme.get("popularScore") or 0.0)
    if pop > 0:
        score += min(10.0, pop * 1.5)

    # 8. Official Portal Quality & Authenticity Check
    ver = scheme.get("verification") or {}
    portal_url = str(ver.get("officialPortalUrl") or "").strip()
    if not portal_url or portal_url == "#" or portal_url.lower() in ["none", "null", ""]:
        # Heavily deprioritize schemes with missing/unverified official links
        score -= 40
        unmatched_warnings.append("Official portal link currently unverified")
    elif any(d in portal_url.lower() for d in [".gov.in", ".nic.in", ".org.in", ".ac.in", ".edu.in"]):
        score += 15
        factors.append({"criterion": "Official Portal", "status": "matched", "explanation": "Verified official government application portal active.", "weight": 15, "score": 15})
    elif portal_url.startswith("http://") or portal_url.startswith("https://"):
        score += 5
    else:
        score -= 25

    final_score = max(10, min(99, round(score)))

    if final_score >= 85:
        grade = "High Potential"
    elif final_score >= 70:
        grade = "Good Match"
    elif final_score >= 50:
        grade = "Moderate Match"
    else:
        grade = "General Match"

    return final_score, grade, matched_reasons, unmatched_warnings, factors


class RecommendationAgent:
    """
    Intelligent scheme recommendation engine powered by Google Gemini AI
    and precision eligibility filtering.
    """

    def recommend(self, profile: dict, top_n: Optional[int] = None) -> list[dict]:
        """
        Analyzes the citizen profile and returns all scored eligible schemes,
        with the Top 20 ranked by Gemini AI intelligence at the top.
        """
        profile_hash = hashlib.md5(
            json.dumps(profile, sort_keys=True, ensure_ascii=False).encode()
        ).hexdigest()
        cache_key = f"recommendations:v2:{profile_hash}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached if top_n is None else cached[:top_n]

        schemes = self._get_all_schemes()
        if not schemes:
            return []

        # Step 1: Precision Pre-Score all schemes
        scored_candidates = []
        for s in schemes:
            score, grade, reasons, warnings, factors = _precision_score(s, profile)
            if score >= 40:
                scored_candidates.append({
                    "scheme": s,
                    "matchScore": score,
                    "matchGrade": grade,
                    "matchedReasons": reasons[:4],
                    "unmatchedWarnings": warnings[:3],
                    "factors": factors,
                })

        # Sort candidate pool: highest match score first, official verified schemes on top
        scored_candidates.sort(
            key=lambda r: (r["matchScore"], float(r["scheme"].get("popularScore", 0) or 0)),
            reverse=True,
        )

        candidate_pool = scored_candidates[:30]
        if not candidate_pool:
            candidate_pool = scored_candidates[:20]

        # Step 2: Ask Gemini AI to analyze profile & select Top 20
        ai_results = self._gemini_analyze_and_rank(profile, candidate_pool, top_n=20)

        if ai_results and len(ai_results) >= 5:
            top_20 = ai_results[:20]
        else:
            # Step 3: High-precision fallback if AI call hits rate limit / quota
            top_20 = self._generate_smart_fallback(profile, candidate_pool, top_n=20)

        # Step 4: Merge Top 20 with all other scored eligible candidates
        used_slugs = {r["scheme"].get("slug") for r in top_20 if "scheme" in r}
        remaining_candidates = [
            c for c in scored_candidates
            if c["scheme"].get("slug") not in used_slugs
        ]
        
        # Add smart fallback insights to remaining candidates
        remaining_with_insights = self._generate_smart_fallback(profile, remaining_candidates, top_n=len(remaining_candidates))

        final_results = top_20 + remaining_with_insights
        cache.set(cache_key, final_results, RECO_CACHE_TTL)
        return final_results if top_n is None else final_results[:top_n]

    def _gemini_analyze_and_rank(self, profile: dict, candidate_pool: list[dict], top_n: int = 20) -> Optional[list[dict]]:
        """
        Invokes Gemini AI to perform deep reasoning on the citizen profile and select top 20.
        """
        if not candidate_pool:
            return None

        candidates_summary = [
            {
                "slug": r["scheme"].get("slug"),
                "name": r["scheme"].get("name"),
                "category": r["scheme"].get("category"),
                "level": r["scheme"].get("level"),
                "tagline": r["scheme"].get("tagline"),
                "short_description": (r["scheme"].get("short_description") or r["scheme"].get("shortDescription") or "")[:180],
            }
            for r in candidate_pool
        ]

        prompt = f"""You are the Scheme Navigator AI Advisor in India.
Citizen Profile:
- Name: {profile.get('name') or 'Citizen'}
- Age: {profile.get('age') or 'Not specified'}
- Gender: {profile.get('gender') or 'All'}
- State: {profile.get('state') or 'All India'}
- Occupation: {profile.get('employmentType') or profile.get('occupation') or 'General'}
- Annual Income: {profile.get('incomeRange') or 'Not specified'}
- Social Category: {profile.get('category') or 'General'}
- BPL / Low Income: {'Yes' if profile.get('hasBPLCard') or profile.get('isBPL') or profile.get('incomeRange') == 'Below ₹1 lakh' else 'No'}

Candidate Schemes:
{json.dumps(candidates_summary, ensure_ascii=False)}

TASK:
Analyze the citizen's profile thoroughly. Select the TOP {top_n} MOST RELEVANT, BENEFICIAL, AND ELIGIBLE SCHEMES specifically for this citizen.
Filter out any scheme that does not suit their occupation, gender, state, or age.

Return ONLY a valid JSON array of {top_n} objects with this exact structure:
[
  {{
    "slug": "scheme-slug",
    "matchScore": 96,
    "matchGrade": "High Potential",
    "whyGood": "1 personalized sentence explaining exact benefit for this citizen",
    "toNote": "1 personalized sentence on key document/action step",
    "matchedReasons": ["Reason 1", "Reason 2"]
  }}
]
"""

        messages = [
            {"role": "system", "content": "You are a government welfare intelligence advisor. Output ONLY a valid JSON array."},
            {"role": "user", "content": prompt},
        ]

        try:
            raw = call_llm(messages, temperature=0.3, max_tokens=2500)
            clean = raw.strip()
            if clean.startswith("```json"):
                clean = clean[7:]
            if clean.startswith("```"):
                clean = clean[3:]
            if clean.endswith("```"):
                clean = clean[:-3]
            clean = clean.strip()

            parsed = json.loads(clean)
            if isinstance(parsed, dict):
                for key in ["results", "schemes", "data", "recommendations"]:
                    if key in parsed and isinstance(parsed[key], list):
                        parsed = parsed[key]
                        break

            if not isinstance(parsed, list) or len(parsed) == 0:
                return None

            # Map back to full Scheme objects
            scheme_map = {r["scheme"]["slug"]: r for r in candidate_pool}
            enriched = []

            for item in parsed:
                slug = item.get("slug")
                if slug in scheme_map:
                    base = scheme_map[slug]
                    enriched.append({
                        "scheme": base["scheme"],
                        "matchScore": int(item.get("matchScore") or base["matchScore"]),
                        "matchGrade": item.get("matchGrade") or base["matchGrade"],
                        "whyGood": item.get("whyGood") or (base["matchedReasons"][0] if base["matchedReasons"] else "High alignment with your profile."),
                        "toNote": item.get("toNote") or "Verify details on official portal.",
                        "matchedReasons": item.get("matchedReasons") or base["matchedReasons"],
                        "unmatchedWarnings": base["unmatchedWarnings"],
                        "factors": base["factors"],
                    })

            if len(enriched) >= 5:
                return enriched

        except Exception as exc:
            logger.warning("Gemini recommendation analysis failed, using precision engine: %s", exc)

        return None

    def _generate_smart_fallback(self, profile: dict, candidate_pool: list[dict], top_n: int = 20) -> list[dict]:
        """
        Generates enriched top 20 recommendations using precision scoring and contextual reasons.
        """
        occ = profile.get("employmentType") or profile.get("occupation") or "your background"
        state = profile.get("state") or "India"

        top = candidate_pool[:top_n]
        for r in top:
            scheme = r["scheme"]
            name = scheme.get("name", "")
            cat = scheme.get("category", "")
            reasons = r.get("matchedReasons", [])
            warnings = r.get("unmatchedWarnings", [])

            if "whyGood" not in r or not r["whyGood"]:
                if "kisan" in name.lower() or cat == "Agriculture":
                    r["whyGood"] = f"Directly supports your farming activities in {state} with direct subsidies & financial assistance."
                elif "student" in name.lower() or cat == "Education":
                    r["whyGood"] = f"Provides financial aid and education support for students in {state}."
                elif "mudra" in name.lower() or cat == "Business":
                    r["whyGood"] = f"Offers collateral-free business loans & credit subsidies for self-employment & enterprises."
                elif reasons:
                    r["whyGood"] = reasons[0]
                else:
                    r["whyGood"] = f"Highly compatible with your {occ} profile in {state}."

            if "toNote" not in r or not r["toNote"]:
                if warnings:
                    r["toNote"] = warnings[0]
                else:
                    r["toNote"] = "Keep Aadhaar, Bank passbook, and residential proof ready for online application."

        return top

    @staticmethod
    def _get_all_schemes() -> list[dict]:
        """
        Fetch all schemes from the database, cached for 10 minutes.
        """
        cache_key = "recommendations:all_schemes_v2"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        from schemes.models import Scheme
        from schemes.serializers import SchemeSerializer

        qs = Scheme.objects.all()
        data = SchemeSerializer(qs, many=True).data
        schemes = [dict(s) for s in data]
        cache.set(cache_key, schemes, SCHEME_CACHE_TTL)
        return schemes
