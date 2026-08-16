"""Registry for workflow nodes."""
from __future__ import annotations

from typing import Dict, Type

from .nodes import WorkflowNode


class NodeRegistry:
    """Register and lookup workflow nodes by name.

    Prevents duplicate names and supports dynamic registration.
    """

    def __init__(self) -> None:
        self._nodes: Dict[str, Type[WorkflowNode]] = {}

    def register(self, node_cls: Type[WorkflowNode]) -> None:
        name = node_cls.name
        if name in self._nodes:
            raise ValueError(f"Node with name '{name}' already registered")
        self._nodes[name] = node_cls

    def get(self, name: str) -> Type[WorkflowNode]:
        return self._nodes[name]

    def list(self) -> list[str]:
        return list(self._nodes.keys())

