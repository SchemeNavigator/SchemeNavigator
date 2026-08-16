"""OutputParser: parse model outputs into Pydantic models with retry."""
from __future__ import annotations

import json
from typing import Type, Any

from pydantic import BaseModel, ValidationError

from .exceptions import JSONParsingError


class OutputParser:
    """Convert raw LLM responses (strings or dicts) into Pydantic models.

    If parsing fails, the parser will attempt one retry before raising a
    `JSONParsingError` with details.
    """

    @staticmethod
    def parse(raw: Any, model: Type[BaseModel]) -> BaseModel:
        def to_text(value: Any) -> str:
            if isinstance(value, str):
                return value
            try:
                return json.dumps(value)
            except Exception:
                return str(value)

        text = to_text(raw)

        last_exc: Exception | None = None
        for attempt in range(2):
            try:
                # attempt to load JSON then parse via pydantic
                data = json.loads(text)
                return model.model_validate(data)
            except (json.JSONDecodeError, ValidationError) as exc:
                last_exc = exc
                # on first attempt, try to extract a JSON substring
                if attempt == 0:
                    # naive extraction: find first '{' and last '}'
                    s = text.find("{")
                    e = text.rfind("}")
                    if s != -1 and e != -1 and e > s:
                        text = text[s : e + 1]
                        continue
                break

        raise JSONParsingError("Failed to parse model output") from last_exc
