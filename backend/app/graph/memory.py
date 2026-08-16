"""Simple in-memory conversation memory manager."""
from __future__ import annotations

from typing import List

from .state import ConversationMemory, Message


class MemoryManager:
    """Append and retrieve conversation history for a workflow.

    This is an in-memory manager; future implementations may persist to DB.
    """

    def __init__(self, memory: ConversationMemory | None = None, limit: int = 1000) -> None:
        self.memory = memory or ConversationMemory()
        self.limit = limit

    def append_message(self, role: str, content: str, timestamp: str | None = None, metadata: dict | None = None) -> None:
        msg = Message(role=role, content=content, timestamp=timestamp, metadata=metadata or {})
        self.memory.messages.append(msg)
        # enforce length
        if len(self.memory.messages) > self.limit:
            self.memory.messages = self.memory.messages[-self.limit :]

    def get_messages(self) -> List[Message]:
        return list(self.memory.messages)

    def summarize(self) -> str:
        # placeholder summarization; real summarizer to be implemented later
        return " | ".join([m.content for m in self.memory.messages[-10:]])
