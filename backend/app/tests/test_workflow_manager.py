from ..graph.workflow import WorkflowManager


def test_workflow_manager_runs_linear_flow():
    manager = WorkflowManager()
    state = manager.execute()
    assert state.workflow_status.name.lower() == "completed"
    # verify execution history contains multiple steps
    assert len(state.execution_history) >= 1
