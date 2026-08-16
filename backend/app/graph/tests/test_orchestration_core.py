from ..conditional_router import ConditionalRouter
from ..state_manager import StateManager
from ..checkpoint_manager import CheckpointManager
from ..workflow_engine import WorkflowEngine
from ..context import ExecutionContext
from ..state import WorkflowState


def test_conditional_router_low_confidence():
    router = ConditionalRouter({"research_confidence_threshold": 0.8, "on_low_confidence": "terminate"})
    state = WorkflowState()
    state.intent.confidence = 0.5
    next_node, trace = router.decide(state)
    assert next_node is None
    assert trace is not None


def test_state_manager_merge_and_version():
    sm = StateManager()
    s1 = WorkflowState()
    s1.workflow_status = None
    s1.execution_history = []
    ver = sm.record_version(s1)
    assert isinstance(ver, int)


def test_checkpoint_manager():
    cm = CheckpointManager()
    cp = cm.create_checkpoint("w1", "s1", "start", {"foo": "bar"}, [])
    assert cp.workflow_id == "w1"


def test_workflow_engine_smoke():
    # engine should initialize and return a WorkflowState even if nodes are no-ops
    engine = WorkflowEngine()
    state = engine.new_state()
    final = engine.run(state)
    assert isinstance(final, WorkflowState)
