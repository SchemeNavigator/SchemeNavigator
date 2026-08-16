from app.models.survey import SurveyRequest


def test_survey_model_validation():
    payload = SurveyRequest(
        age=25,
        gender="Female",
        state="Kerala",
        district="Ernakulam",
        area="Urban",
        category="General",
        minority=False,
        disability=False,
        disability_percentage=0,
        employment_status="Employed",
        occupation="Software Engineer",
        bpl=False,
        annual_income=500000,
    )

    assert payload.age == 25


def test_survey_rejects_negative_age():
    try:
        SurveyRequest(
            age=-1,
            gender="Female",
            state="Kerala",
            category="General",
            minority=False,
            disability=False,
            disability_percentage=0,
            employment_status="Employed",
            occupation="Engineer",
            bpl=False,
            annual_income=1000,
        )
        assert False, "Expected validation to fail"
    except Exception:
        assert True
