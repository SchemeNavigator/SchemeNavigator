from ..graph.events import WorkflowStarted, NodeStarted


def test_event_construction():
    e = WorkflowStarted(name="started", workflow_id="w1", payload={})
    assert e.name == "started"
    n = NodeStarted(name="node", workflow_id="w1", payload={}, node_name="start")
    assert n.node_name == "start"
