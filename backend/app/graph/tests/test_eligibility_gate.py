from types import SimpleNamespace

from app.models.scheme import Scheme
from app.models.survey import SurveyRequest

from ..eligibility_gate import classify_scheme
from ..eligibility_node import EligibilityGateNode
from ..recommendation_models import RecommendationEntry, RecommendationResult
from ..recommendation_node import RecommendationNode
from ..context import ExecutionContext
from ..state import WorkflowState


def scheme(eligibility: str, **extra):
    return Scheme(
        scheme_name=extra.get("scheme_name", "Example Scheme"),
        slug=extra.get("slug", "example-scheme"),
        details="",
        benefits="",
        eligibility=eligibility,
        application="",
        documents="",
        level="State",
        scheme_category=extra.get("scheme_category", "Education"),
        tags=[],
    )


def survey(**extra):
    return SurveyRequest(
        age=extra.get("age", 20),
        gender=extra.get("gender", "unspecified"),
        state=extra.get("state", "Delhi"),
        category=extra.get("category", "general"),
        employment_status=extra.get("employment_status", "student"),
        occupation=extra.get("occupation", "student"),
        minority=extra.get("minority", False),
        disability=extra.get("disability", False),
        bpl=extra.get("bpl", False),
        annual_income=extra.get("annual_income", 0),
    )


class DummyLLM:
    def __init__(self, result):
        self._result = result

    def generate_json(self, prompt_name, variables, model, **kwargs):
        return self._result


def test_other_state_is_ineligible():
    decision = classify_scheme(scheme("Residents of Karnataka"), survey())
    assert decision.status == "ineligible"


def test_missing_community_fact_is_unknown_not_eligible():
    decision = classify_scheme(scheme("Applicants must belong to a minority community"), survey(minority=False))
    assert decision.status == "unknown"


def test_matching_state_is_eligible_when_no_unresolved_requirement():
    decision = classify_scheme(scheme("Students residing in Delhi"), survey(state="Delhi", category="general"))
    assert decision.status == "eligible"


def test_gate_only_keeps_confirmed_eligible_schemes():
    state = WorkflowState(
        survey=survey(state="Delhi", category="general"),
        candidate_schemes=[
            scheme("Only SC category applicants are eligible", scheme_name="SCHEME_A", slug="SCHEME_A"),
            scheme("Residents of Delhi are eligible", scheme_name="SCHEME_B", slug="SCHEME_B"),
            scheme("Applicants must belong to a minority community", scheme_name="SCHEME_C", slug="SCHEME_C"),
        ],
    )

    EligibilityGateNode(ExecutionContext(state=state, llm_service=None)).execute(state)

    assert state.eligibility_decisions["SCHEME_A"]["status"] == "ineligible"
    assert state.eligibility_decisions["SCHEME_C"]["status"] == "unknown"
    assert {s.slug for s in state.eligible_schemes} == {"SCHEME_B"}


def test_recommendation_node_discards_ineligible_scheme_from_llm_output():
    state = WorkflowState(
        survey=survey(state="Delhi", category="general"),
        candidate_schemes=[
            scheme("Only SC category applicants are eligible", scheme_name="SCHEME_A", slug="SCHEME_A"),
            scheme("Residents of Delhi are eligible", scheme_name="SCHEME_B", slug="SCHEME_B"),
        ],
        eligible_schemes=[
            scheme("Residents of Delhi are eligible", scheme_name="SCHEME_B", slug="SCHEME_B"),
        ],
        eligibility_decisions={
            "SCHEME_A": {"status": "ineligible", "reasons": ["category mismatch"]},
            "SCHEME_B": {"status": "eligible", "reasons": ["Delhi resident"]},
        },
    )

    llm_result = RecommendationResult(
        recommendations=[
            RecommendationEntry(scheme_id="SCHEME_A", scheme_name="SCHEME_A", overall_score=90.0, confidence=0.95, reason="Excellent scholarship for this student"),
            RecommendationEntry(scheme_id="SCHEME_B", scheme_name="SCHEME_B", overall_score=88.0, confidence=0.90, reason="Eligible"),
        ],
        summary="ok",
        overall_confidence=0.9,
        limitations=[],
        missing_information=[],
    )

    updated = RecommendationNode(ExecutionContext(state=state, llm_service=DummyLLM(llm_result))).execute(state)

    assert [r.scheme_id for r in updated.ranked_schemes] == ["SCHEME_B"]
    assert all(r.scheme_id != "SCHEME_A" for r in updated.ranked_schemes)
    assert updated.selected_scheme is not None
    assert updated.selected_scheme.scheme_id == "SCHEME_B"


def test_recommendation_node_uses_eligible_fallback_when_llm_returns_no_recommendations():
    state = WorkflowState(
        survey=survey(state="Delhi", category="general"),
        candidate_schemes=[
            scheme("Residents of Delhi are eligible", scheme_name="SCHEME_B", slug="SCHEME_B"),
        ],
        eligible_schemes=[
            scheme("Residents of Delhi are eligible", scheme_name="SCHEME_B", slug="SCHEME_B"),
        ],
        eligibility_decisions={
            "SCHEME_B": {"status": "eligible", "reasons": ["Delhi resident"]},
        },
    )
    llm_result = RecommendationResult(
        recommendations=[],
        summary="No ranking returned",
        overall_confidence=0.0,
        limitations=[],
        missing_information=[],
    )

    updated = RecommendationNode(ExecutionContext(state=state, llm_service=DummyLLM(llm_result))).execute(state)

    assert updated.selected_scheme is not None
    assert updated.selected_scheme.scheme_id == "SCHEME_B"
    assert [recommendation.scheme_id for recommendation in updated.ranked_schemes] == ["SCHEME_B"]
    assert updated.metadata.recommendation_result["fallback_used"] is True
    assert updated.next_node == "planner"


def test_recommendation_node_restores_id_from_matching_eligible_scheme_name():
    state = WorkflowState(
        survey=survey(state="Delhi", category="general"),
        candidate_schemes=[
            scheme("Residents of Delhi are eligible", scheme_name="SCHEME_B", slug="SCHEME_B"),
        ],
        eligible_schemes=[
            scheme("Residents of Delhi are eligible", scheme_name="SCHEME_B", slug="SCHEME_B"),
        ],
        eligibility_decisions={
            "SCHEME_B": {"status": "eligible", "reasons": ["Delhi resident"]},
        },
    )
    llm_result = RecommendationResult(
        recommendations=[
            RecommendationEntry(
                scheme_id=None,
                scheme_name="scheme_b",
                overall_score=90.0,
                confidence=0.9,
                reason="Strong match",
            )
        ],
        summary="One recommendation",
        overall_confidence=0.9,
        limitations=[],
        missing_information=[],
    )

    updated = RecommendationNode(ExecutionContext(state=state, llm_service=DummyLLM(llm_result))).execute(state)

    assert [recommendation.scheme_id for recommendation in updated.ranked_schemes] == ["SCHEME_B"]
    assert updated.selected_scheme.scheme_name == "SCHEME_B"
    assert updated.metadata.recommendation_result["fallback_used"] is False


def test_income_limit_empty_string_is_unknown_not_eligible():
    decision = classify_scheme(
        scheme("Residents of Delhi are eligible. Annual family income should not exceed "),
        survey(state="Delhi", category="general", annual_income=100000),
    )
    assert decision.status == "unknown"


def test_income_limit_whitespace_is_unknown_not_eligible():
    decision = classify_scheme(
        scheme("Residents of Delhi are eligible. Annual family income should not exceed   "),
        survey(state="Delhi", category="general", annual_income=100000),
    )
    assert decision.status == "unknown"


def test_income_limit_numeric_value_evalutes_normally():
    decision = classify_scheme(
        scheme("Residents of Delhi are eligible. Annual family income should not exceed ₹250000."),
        survey(state="Delhi", category="general", annual_income=100000),
    )
    assert decision.status == "eligible"


def test_income_limit_fails_when_survey_income_exceeds_threshold():
    decision = classify_scheme(
        scheme("Residents of Delhi are eligible. Annual family income should not exceed ₹250,000."),
        survey(state="Delhi", category="general", annual_income=300000),
    )
    assert decision.status == "ineligible"


def test_income_limit_not_specified_is_unknown():
    decision = classify_scheme(
        scheme("Residents of Delhi are eligible. Annual family income is not specified."),
        survey(state="Delhi", category="general", annual_income=100000),
    )
    assert decision.status == "unknown"


def test_unknown_income_does_not_override_definitive_failure():
    decision = classify_scheme(
        scheme("Residents of Delhi are eligible. Annual family income is not specified. Only SC category applicants are eligible."),
        survey(state="Delhi", category="general", annual_income=100000),
    )
    assert decision.status == "ineligible"


def test_all_valid_criteria_pass_make_scheme_eligible():
    decision = classify_scheme(
        scheme("Residents of Delhi are eligible. Applicants from the general category are eligible. Annual family income should not exceed ₹250000."),
        survey(state="Delhi", category="general", annual_income=100000),
    )
    assert decision.status == "eligible"


def test_problematic_scheme_from_csv_does_not_crash():
    import pandas as pd
    from pathlib import Path

    row = pd.read_csv(Path(__file__).resolve().parents[3] / "data" / "schemes.csv").iloc[4]
    target = Scheme(
        scheme_name=str(row.get("scheme_name", "")),
        slug=str(row.get("slug", "")),
        details=str(row.get("details", "")),
        benefits=str(row.get("benefits", "")),
        eligibility=str(row.get("eligibility", "")),
        application=str(row.get("application", "")),
        documents=str(row.get("documents", "")),
        level=str(row.get("level", "")),
        scheme_category=str(row.get("schemeCategory", row.get("scheme_category", ""))),
        tags=[],
    )
    decision = classify_scheme(target, survey(state="Delhi", category="general", annual_income=100000))
    assert decision.status in {"eligible", "ineligible", "unknown"}


def test_classify_scheme_handles_every_current_csv_scheme_without_raising():
    import pandas as pd
    from pathlib import Path

    dataframe = pd.read_csv(Path(__file__).resolve().parents[3] / "data" / "schemes.csv")
    survey_data = survey(state="Delhi", category="general", annual_income=100000)

    for _, row in dataframe.iterrows():
        scheme_obj = Scheme(
            scheme_name=str(row.get("scheme_name", "")),
            slug=str(row.get("slug", "")),
            details=str(row.get("details", "")),
            benefits=str(row.get("benefits", "")),
            eligibility=str(row.get("eligibility", "")),
            application=str(row.get("application", "")),
            documents=str(row.get("documents", "")),
            level=str(row.get("level", "")),
            scheme_category=str(row.get("schemeCategory", row.get("scheme_category", ""))),
            tags=[],
        )
        decision = classify_scheme(scheme_obj, survey_data)
        assert decision.status in {"eligible", "ineligible", "unknown"}
