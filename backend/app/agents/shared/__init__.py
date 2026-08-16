"""Shared agent abstractions for Scheme Navigator.

Purpose:
    Provide reusable abstract contracts for future agents, prompts, results,
    and workflow nodes.
Responsibilities:
    Define interfaces only; no reasoning, no external calls, and no data access.
Future implementation notes:
    Concrete implementations should live in later phases and depend on these
    abstractions instead of duplicating behavior.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Generic, TypeVar


TInput = TypeVar("TInput")
TOutput = TypeVar("TOutput")
TState = TypeVar("TState")


class BaseAgent(ABC, Generic[TInput, TOutput]):
    """Abstract base class for all future agents.

    Purpose:
        Standardize the public agent contract.
    Responsibilities:
        Define the interface that future agents must implement.
    Future implementation notes:
        Concrete agents should only communicate through structured workflow
        state and typed results.
    """

    @abstractmethod
    def run(self, payload: TInput) -> TOutput:
        """Execute the agent contract for the provided payload."""


class BaseResult(ABC):
    """Abstract base class for structured agent outputs.

    Purpose:
        Establish a common result contract for agent outputs.
    Responsibilities:
        Define serialization-friendly output behavior.
    Future implementation notes:
        Later phases should extend this class with typed Pydantic models or
        adapters that remain easy to serialize and test.
    """

    @abstractmethod
    def to_payload(self) -> Any:
        """Return a serializable representation of the result."""


class BasePrompt(ABC):
    """Abstract base class for prompt definitions.

    Purpose:
        Centralize the prompt contract so prompt text lives outside business code.
    Responsibilities:
        Define how future prompt objects expose their rendered text.
    Future implementation notes:
        Concrete prompts should live under app/prompts in later phases and be
        loaded through explicit prompt providers.
    """

    @abstractmethod
    def render(self) -> str:
        """Render the prompt content as text."""


class BaseWorkflowNode(ABC, Generic[TState]):
    """Abstract base class for future workflow nodes.

    Purpose:
        Provide a thin interface for LangGraph-compatible nodes.
    Responsibilities:
        Define the node contract while keeping orchestration details out of the
        current phase.
    Future implementation notes:
        Real nodes should read and return typed state objects only.
    """

    @abstractmethod
    def execute(self, state: TState) -> TState:
        """Execute a node step against the provided workflow state."""

