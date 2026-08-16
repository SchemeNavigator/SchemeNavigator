"""Token accounting models."""
from __future__ import annotations

from pydantic import BaseModel
from typing import Optional


class TokenUsage(BaseModel):
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    total_tokens: Optional[int] = None
    latency_ms: Optional[int] = None
    model_name: Optional[str] = None
