"""OutputParser: parse model outputs into Pydantic models with retry."""
from __future__ import annotations

import json
from typing import Type, Any

from pydantic import BaseModel, ValidationError

from .exceptions import JSONParsingError, JSONSchemaValidationError


class OutputParser:
    """Convert raw LLM responses (strings or dicts) into Pydantic models.

    The parser may recover JSON surrounded by provider prose, but it never
    calls the provider and never retries schema validation failures.
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

        try:
            data = json.loads(text)
        except json.JSONDecodeError as exc:
            # Providers occasionally wrap an otherwise complete JSON object in
            # prose or code fences. Recover that without another HTTP request.
            start = text.find("{")
            end = text.rfind("}")
            if start == -1 or end <= start:
                raise JSONParsingError("Malformed JSON: no complete object found") from exc
            try:
                data = json.loads(text[start : end + 1])
            except json.JSONDecodeError as extracted_exc:
                raise JSONParsingError("Malformed JSON response") from extracted_exc

        try:
            return model.model_validate(data)
        except ValidationError as exc:
            raise JSONSchemaValidationError("JSON schema validation failed") from exc
