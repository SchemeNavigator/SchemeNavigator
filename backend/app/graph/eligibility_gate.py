"""Deterministic eligibility classification for retrieved schemes."""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class EligibilityDecision:
    status: str
    reasons: tuple[str, ...] = ()


def classify_scheme(scheme: Any, survey: Any) -> EligibilityDecision:
    """Classify only facts that can be proved from the survey and scheme text."""
    if scheme is None or survey is None:
        return EligibilityDecision("unknown", ("Scheme or survey data is missing",))

    text = " ".join(
        str(getattr(scheme, field, "") or "")
        for field in ("scheme_name", "details", "eligibility", "tags")
    ).casefold()
    reasons: list[str] = []

    survey_category = str(getattr(survey, "category", "") or "").casefold()
    category_requirement = _detect_category_requirement(text)
    if category_requirement:
        if not survey_category:
            return EligibilityDecision("unknown", ("The scheme requires a category that is not present in the survey",))
        if survey_category not in category_requirement:
            return EligibilityDecision("ineligible", (f"Scheme requires category {sorted(category_requirement)[0]} but survey category is {getattr(survey, 'category')}",))
        reasons.append(f"Scheme text mentions survey category {survey_category}")

    state = str(getattr(survey, "state", "") or "").casefold()
    if state and _mentions_other_state(text, state):
        return EligibilityDecision("ineligible", (f"Scheme is limited to a different state than {getattr(survey, 'state')}",))

    age = getattr(survey, "age", None)
    age_minimums = [value for value in (_parse_numeric(value) for value in _requirements(text, r"(?:minimum age|age of|aged?)\D{0,20}(\d{1,3})")) if value is not None]
    age_maximums = [value for value in (_parse_numeric(value) for value in _requirements(text, r"(?:maximum age|age limit|aged?)\D{0,20}(\d{1,3})")) if value is not None]
    if _mentions_age_requirement(text) and not age_minimums and not age_maximums:
        return EligibilityDecision("unknown", ("The scheme specifies an age requirement but no usable numeric value is available",))
    for minimum in age_minimums:
        if age is not None and age < minimum:
            return EligibilityDecision("ineligible", (f"Survey age {age} is below the stated minimum age {minimum}",))
    for maximum in age_maximums:
        if age is not None and age > maximum:
            return EligibilityDecision("ineligible", (f"Survey age {age} is above the stated maximum age {maximum}",))

    income = getattr(survey, "annual_income", None)
    income_limit_values = [value for value in (_parse_numeric(value) for value in _requirements(text, r"(?:income|annual family income)[^\d₹]{0,30}(?:rs\.?|inr|₹)?\s*([\d,]+)")) if value is not None]
    income_requirement_present = bool(re.search(r"(?:income|annual family income)", text, flags=re.IGNORECASE))
    if income_requirement_present and not income_limit_values:
        return EligibilityDecision("unknown", ("The scheme specifies an income requirement but no usable numeric limit is available",))
    if income is not None and income_limit_values and float(income) > max(income_limit_values):
        return EligibilityDecision("ineligible", ("Survey income exceeds the stated scheme income limit",))

    if _requires_true(text, ("person with disability", "persons with disabilities", "disability certificate")) and not getattr(survey, "disability", False):
        return EligibilityDecision("unknown", ("The scheme requires disability-related status not established by the survey",))
    if _requires_true(text, ("minority community", "minority communities")) and not getattr(survey, "minority", False):
        return EligibilityDecision("unknown", ("The scheme requires community information not established by the survey",))
    if _requires_true(text, ("below poverty line", "bpl household", "bpl family")) and not getattr(survey, "bpl", False):
        return EligibilityDecision("unknown", ("The scheme requires BPL status not established by the survey",))

    if state and state in text:
        reasons.append(f"Scheme text mentions survey state {getattr(survey, 'state')}")
    if getattr(survey, "category", None) and str(survey.category).casefold() in text:
        reasons.append(f"Scheme text mentions survey category {survey.category}")
    if reasons:
        return EligibilityDecision("eligible", tuple(reasons))
    return EligibilityDecision("unknown", ("The supplied scheme text does not establish eligibility from survey fields",))


def _requirements(text: str, pattern: str) -> list[str]:
    return re.findall(pattern, text, flags=re.IGNORECASE)


def _parse_numeric(value: Any) -> float | None:
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)

    text = str(value).strip()
    if not text:
        return None

    cleaned = text.replace("₹", "").replace("Rs", "").replace("INR", "").replace("inr", "")
    cleaned = cleaned.replace("%", "").replace("/", "").replace("-", "")
    cleaned = cleaned.replace(",", "").replace(" ", "")
    cleaned = cleaned.strip()
    if not cleaned:
        return None

    matches = re.findall(r"[-+]?\d*\.?\d+", cleaned)
    if not matches:
        return None

    try:
        return float(matches[0])
    except ValueError:
        return None


def _mentions_age_requirement(text: str) -> bool:
    return bool(re.search(r"(?:minimum age|maximum age|age limit|age of|aged?)", text, flags=re.IGNORECASE))


def _requires_true(text: str, phrases: tuple[str, ...]) -> bool:
    return any(phrase in text for phrase in phrases)


def _detect_category_requirement(text: str) -> set[str]:
    """Return normalized category codes mentioned as a requirement in scheme text."""
    aliases = {
        "sc": (r"\bsc\b", r"\bscheduled caste\b", r"\bscheduled castes\b", r"\bcaste sc\b"),
        "st": (r"\bst\b", r"\bscheduled tribe\b", r"\bscheduled tribes\b"),
        "obc": (r"\bobc\b", r"\bother backward class\b", r"\bother backward classes\b", r"\bbackward class\b"),
        "ews": (r"\bews\b", r"\beconomically weaker section\b", r"\beconomically weaker sections\b"),
        "general": (r"\bgeneral\b", r"\bgeneral category\b"),
    }
    matches: set[str] = set()
    for normalized, patterns in aliases.items():
        if any(re.search(pattern, text, flags=re.IGNORECASE) for pattern in patterns):
            matches.add(normalized)
    return matches


def _mentions_other_state(text: str, survey_state: str) -> bool:
    states = (
        "andhra pradesh", "assam", "bihar", "delhi", "goa", "gujarat", "haryana",
        "himachal pradesh", "jharkhand", "karnataka", "kerala", "madhya pradesh",
        "maharashtra", "odisha", "punjab", "rajasthan", "tamil nadu", "telangana",
        "uttar pradesh", "uttarakhand", "west bengal", "puducherry",
    )
    mentioned = {state for state in states if state in text}
    return bool(mentioned and survey_state not in mentioned)