"""
CSVDataSource — reads government scheme data from a CSV file.

Expected CSV columns (see backend/docs/csv_schema.md for full reference):

  Flat columns (required):
    slug, name, tagline, category, level, short_description, detailed_description

  Flat columns (optional):
    short_name, popular_score, tags (pipe-separated), covered_states (pipe-separated)

  Eligibility flat columns (all optional):
    elig_min_age, elig_max_age, elig_genders, elig_categories, elig_occupations,
    elig_max_income, elig_requires_disability, elig_requires_bpl, elig_area_types,
    elig_income_ranges, elig_custom_conditions

  JSON-string columns (optional, override flat eligibility if present):
    eligibility_json, benefits_json, documents_json, application_steps_json,
    verification_json
"""
from pathlib import Path

import pandas as pd

from .base import DataSource


def _parse_pipe(value) -> list[str]:
    """Split a pipe-separated string; return [] for NaN / blank."""
    if pd.isna(value) or str(value).strip() == "":
        return []
    return [v.strip() for v in str(value).split("|") if v.strip()]


def _parse_bool(value) -> bool:
    if pd.isna(value):
        return False
    return str(value).strip().lower() in ("true", "1", "yes")


def _parse_int(value, default=None):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _parse_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _parse_json_col(row, col_name: str, default):
    """Parse a JSON-string column; fall back to default on missing/invalid."""
    import json

    val = row.get(col_name)
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return default
    if isinstance(val, (dict, list)):
        return val
    try:
        return json.loads(str(val))
    except (json.JSONDecodeError, TypeError):
        return default


CATEGORY_MAP = {
    "agriculture": "Agriculture",
    "farmer": "Agriculture",
    "social": "Social Security",
    "empowerment": "Social Security",
    "education": "Education",
    "learning": "Education",
    "business": "Business",
    "entrepreneur": "Business",
    "health": "Healthcare",
    "wellness": "Healthcare",
    "financial": "Financial Assistance",
    "banking": "Financial Assistance",
    "insurance": "Financial Assistance",
    "skill": "Skill Development",
    "employment": "Skill Development",
    "housing": "Housing",
    "shelter": "Housing",
    "women": "Women & Child",
    "child": "Women & Child",
}


def _normalize_category(cat: str | None) -> str:
    if not cat:
        return "Social Security"
    s = str(cat).lower()
    for k, v in CATEGORY_MAP.items():
        if k in s:
            return v
    return str(cat).strip()[:50] or "Social Security"


def _normalize_level(lvl: str | None) -> str:
    s = str(lvl or "").lower()
    if "state" in s or "ut" in s:
        return "State"
    return "Central"


def _parse_bullet_list(text: str | None) -> list[str]:
    if not text:
        return []
    lines = [
        line.strip().lstrip("-*• ")
        for line in str(text).split("\n")
        if line.strip().lstrip("-*• ")
    ]
    return lines


class CSVDataSource(DataSource):
    def __init__(self, file_path: str):
        p = Path(file_path)
        if not p.exists():
            # Try looking in parent, or backend/
            candidates = [
                Path.cwd() / file_path,
                Path.cwd().parent / file_path,
                Path(__file__).resolve().parent.parent.parent / file_path,
                Path(__file__).resolve().parent.parent.parent.parent / file_path,
            ]
            for c in candidates:
                if c.exists():
                    p = c
                    break
        if not p.exists():
            raise FileNotFoundError(f"CSV file not found: {file_path}")
        self.file_path = p

    def fetch_schemes(self) -> list[dict]:
        df = pd.read_csv(self.file_path, dtype=str, keep_default_na=True)
        # Normalise column names: strip whitespace, lowercase
        df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

        schemes = []
        for _, row in df.iterrows():
            row = row.where(pd.notna(row), None)  # replace NaN with None

            slug = str(row.get("slug", "")).strip()
            if not slug:
                continue  # skip rows without a slug

            # ── Name & Category with aliases ────────────────────────────────
            name = str(row.get("name") or row.get("scheme_name") or "").strip()
            short_name = str(row.get("short_name") or row.get("short_title") or "").strip()
            raw_cat = row.get("category") or row.get("categories")
            category = _normalize_category(raw_cat)
            level = _normalize_level(row.get("level"))

            tagline = str(
                row.get("tagline")
                or row.get("brief_description")
                or (row.get("description") or "")[:120]
            ).strip()

            short_desc = str(
                row.get("short_description")
                or row.get("brief_description")
                or (row.get("description") or "")[:300]
            ).strip()

            detailed_desc = str(
                row.get("detailed_description")
                or row.get("description")
                or short_desc
            ).strip()

            # ── Covered States ──────────────────────────────────────────────
            covered_states = _parse_pipe(row.get("covered_states"))
            if not covered_states:
                state_val = str(row.get("state") or "").strip()
                if state_val and state_val.lower() not in ("all india", "central", "pan india", "nan", ""):
                    covered_states = [state_val]
                else:
                    covered_states = ["All India"]

            # ── Tags ────────────────────────────────────────────────────────
            tags = _parse_pipe(row.get("tags"))
            if not tags and row.get("tags"):
                tags = [t.strip() for t in str(row.get("tags")).split(",") if t.strip()]

            # ── Eligibility ─────────────────────────────────────────────────
            eligibility = _parse_json_col(row, "eligibility_json", None)
            if eligibility is None:
                eligibility = {}
                min_age = _parse_int(row.get("elig_min_age"))
                max_age = _parse_int(row.get("elig_max_age"))
                if min_age is not None:
                    eligibility["minAge"] = min_age
                if max_age is not None:
                    eligibility["maxAge"] = max_age

                genders = _parse_pipe(row.get("elig_genders"))
                if genders:
                    eligibility["allowedGenders"] = genders

                categories = _parse_pipe(row.get("elig_categories"))
                if categories:
                    eligibility["allowedCategories"] = categories

                occupations = _parse_pipe(row.get("elig_occupations"))
                if occupations:
                    eligibility["allowedOccupations"] = occupations

                max_income = _parse_int(row.get("elig_max_income"))
                if max_income is not None:
                    eligibility["maxAnnualIncome"] = max_income

                income_ranges = _parse_pipe(row.get("elig_income_ranges"))
                if income_ranges:
                    eligibility["incomeRangesAllowed"] = income_ranges

                area_types = _parse_pipe(row.get("elig_area_types"))
                if area_types:
                    eligibility["areaEligibility"] = area_types

                custom_conditions = _parse_pipe(row.get("elig_custom_conditions"))
                # Fallback to plain text eligibility field
                if not custom_conditions and row.get("eligibility"):
                    custom_conditions = _parse_bullet_list(row.get("eligibility"))

                if custom_conditions:
                    eligibility["customConditions"] = custom_conditions

                if _parse_bool(row.get("elig_requires_disability")):
                    eligibility["requiresDisability"] = True
                if _parse_bool(row.get("elig_requires_bpl")):
                    eligibility["requiresBPL"] = True
                if _parse_bool(row.get("elig_requires_minority")):
                    eligibility["requiresMinority"] = True

            # ── Other JSON fields ────────────────────────────────────────────
            benefits = _parse_json_col(row, "benefits_json", None)
            if benefits is None and row.get("benefits"):
                b_lines = _parse_bullet_list(row.get("benefits"))
                benefits = [
                    {"title": line[:60], "description": line, "type": "Financial Assistance"}
                    for line in b_lines
                ]
            if benefits is None:
                benefits = []

            documents = _parse_json_col(row, "documents_json", None)
            if documents is None and row.get("documents"):
                d_lines = _parse_bullet_list(row.get("documents"))
                documents = [
                    {
                        "id": f"doc-{i+1}",
                        "name": line[:80],
                        "description": line,
                        "isMandatory": True,
                        "documentType": "identity",
                    }
                    for i, line in enumerate(d_lines)
                ]
            if documents is None:
                documents = []

            application_steps = _parse_json_col(row, "application_steps_json", None)
            if application_steps is None and row.get("application_process"):
                s_lines = [s.strip() for s in str(row.get("application_process")).split("\n") if s.strip()]
                application_steps = []
                for i, line in enumerate(s_lines):
                    title = f"Step {i+1}"
                    desc = line
                    if ":" in line and line.lower().startswith("step"):
                        parts = line.split(":", 1)
                        title = parts[0].strip()
                        desc = parts[1].strip()
                    application_steps.append({
                        "stepNumber": i + 1,
                        "title": title,
                        "description": desc,
                    })
            if application_steps is None:
                application_steps = []

            verification = _parse_json_col(row, "verification_json", None)
            if verification is None:
                verification = {
                    "sourceDepartment": str(row.get("department") or ""),
                    "ministryOrAuthority": str(row.get("department") or ""),
                    "officialPortalUrl": str(row.get("references") or ""),
                    "isOfficialVerified": True,
                }

            schemes.append(
                {
                    "slug": slug,
                    "name": name,
                    "short_name": short_name,
                    "tagline": tagline,
                    "category": category,
                    "level": level,
                    "covered_states": covered_states,
                    "short_description": short_desc,
                    "detailed_description": detailed_desc,
                    "eligibility": eligibility,
                    "benefits": benefits,
                    "documents": documents,
                    "application_steps": application_steps,
                    "verification": verification,
                    "popular_score": _parse_float(row.get("popular_score"), 0.0),
                    "tags": tags,
                }
            )

        return schemes
