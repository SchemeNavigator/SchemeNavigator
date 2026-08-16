from ..graph.state import WorkflowState, WorkflowStatus, Intent
from ..models.survey import SurveyRequest


def test_workflow_state_defaults():
    state = WorkflowState()
    assert state.workflow_status == WorkflowStatus.IDLE
    assert isinstance(state.intent, Intent)


def test_assign_survey():
    s = SurveyRequest(age=30, gender="M", state="Karnataka", category="A", minority=False, disability=False, employment_status="employed", occupation="dev", bpl=False, annual_income=1000.0)
    state = WorkflowState(survey=s)
    assert state.survey.age == 30
