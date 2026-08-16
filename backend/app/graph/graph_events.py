"""Event system for workflow orchestration."""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List


@dataclass
class WorkflowEvent:
    name: str
    node: str | None = None
    timestamp: str | None = None
    duration: float | None = None
    status: str | None = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class EventBus:
    def __init__(self) -> None:
        self._subs: Dict[str, List[Callable[[WorkflowEvent], None]]] = {}

    def subscribe(self, event_name: str, handler: Callable[[WorkflowEvent], None]) -> None:
        self._subs.setdefault(event_name, []).append(handler)

    def emit(self, event: WorkflowEvent) -> None:
        for handler in self._subs.get(event.name, []):
            try:
                handler(event)
            except Exception:
                # handlers must not break orchestration
                pass

    # convenience creators
    def created(self, name: str, node: str | None = None, metadata: Dict[str, Any] | None = None) -> WorkflowEvent:
        return WorkflowEvent(name=name, node=node, timestamp=time.strftime("%Y-%m-%dT%H:%M:%S"), metadata=metadata or {})
