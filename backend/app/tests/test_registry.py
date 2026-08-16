from ..graph.registry import NodeRegistry
from ..graph.nodes import StartNode


def test_registry_register_and_get():
    r = NodeRegistry()
    r.register(StartNode)
    assert "start" in r.list()


def test_registry_duplicate_raises():
    r = NodeRegistry()
    r.register(StartNode)
    try:
        r.register(StartNode)
        raise AssertionError("Expected ValueError on duplicate registration")
    except ValueError:
        pass
