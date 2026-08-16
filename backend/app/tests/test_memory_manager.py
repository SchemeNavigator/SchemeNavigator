from ..graph.memory import MemoryManager


def test_memory_append_and_retrieve():
    mm = MemoryManager()
    mm.append_message("user", "hello")
    mm.append_message("agent", "hi")
    msgs = mm.get_messages()
    assert len(msgs) == 2
    assert msgs[0].role == "user"


def test_memory_summarize():
    mm = MemoryManager()
    mm.append_message("user", "one")
    mm.append_message("user", "two")
    s = mm.summarize()
    assert "one" in s and "two" in s
