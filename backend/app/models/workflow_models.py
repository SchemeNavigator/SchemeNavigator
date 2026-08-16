"""Workflow state models for future LangGraph integration.

Purpose:
    Define typed containers for workflow metadata and conversational context.
Responsibilities:
    Keep workflow data structured and separate from agent logic.
Future implementation notes:
    Expand these models when graph execution and conversation persistence are
    introduced in later phases.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.graph.state import WorkflowMetadata
from app.models.agent_models import WorkflowResult


class Message(BaseModel):
    """Placeholder message model for workflow conversations.

    Purpose:
        Represent a single conversation message.
    Responsibilities:
        Store role, content, and timestamps in a typed structure.
    Future implementation notes:
        Extend with message provenance or attachment metadata later.
    """

    role: str | None = None
    content: str | None = None
    created_at: datetime | None = None


class ConversationMemory(BaseModel):
    """Placeholder conversation memory model.

    Purpose:
        Group messages for a single conversation session.
    Responsibilities:
        Store the message history in a typed container.
    Future implementation notes:
        Real persistence and retrieval logic belong in later phases.
    """

    conversation_id: str | None = None
    messages: list[Message] = Field(default_factory=list)


class WorkflowState(BaseModel):
    """Placeholder top-level workflow state model.

    Purpose:
        Provide the shared state object future nodes will pass around.
    Responsibilities:
        Keep workflow inputs, memory, metadata, and results in a typed model.
    Future implementation notes:
        This object should remain the only data contract passed between nodes.
    """

    metadata: WorkflowMetadata = Field(default_factory=WorkflowMetadata)
    conversation_memory: ConversationMemory = Field(default_factory=ConversationMemory)
    latest_message: Message | None = None
    workflow_result: WorkflowResult | None = None

