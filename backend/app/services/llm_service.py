"""Concrete LLM service used by Scheme Navigator.

This module provides a single `LLMService` implementation that centralizes
model configuration, prompting, parsing and error handling. Agents should
depend on this class and must not instantiate LangChain or call OpenRouter
directly.
"""

from __future__ import annotations

import logging
import os
import time
from typing import Any, Iterator, Optional, Type

from pydantic import BaseModel

from ..llm.model_factory import ModelFactory
from ..llm.prompt_manager import PromptManager
from ..llm.output_parser import OutputParser
from ..llm.token_usage import TokenUsage
from ..llm.exceptions import (
    ConfigurationError,
    JSONParsingError,
    LLMTimeoutError,
    ModelUnavailableError,
    RateLimitError as LLMRateLimitError,
)
from app.core.exceptions import RateLimitError as AppRateLimitError
logger = logging.getLogger(__name__)


class LLMService:
    """Centralized LLM access for the application.

    Responsibilities
    - load configuration from environment
    - instantiate provider model via `ModelFactory`
    - expose `generate`, `generate_json`, `stream`, and `health_check`

    Usage:
        svc = LLMService()
        text = svc.generate("hello")
        obj = svc.generate_json("survey_prompt", {"survey": data}, MyModel)
    """

    def __init__(self, model_name: Optional[str] = None, timeout: Optional[int] = None) -> None:
        self.prompt_manager = PromptManager()
        self.output_parser = OutputParser()
        try:
            self.model = ModelFactory.create(model_name=model_name, timeout=timeout)
        except Exception as exc:
            raise ConfigurationError("Failed to create model") from exc

    def generate(self, prompt: str, max_tokens: Optional[int] = None, temperature: Optional[float] = None) -> str:
        """Generate free-form text from a prompt.

        Returns the text content. Raises ModelUnavailableError on provider errors.
        """
        logger.info("LLM Request Started")
        start = time.time()
        try:
            res = self.model.generate(prompt, max_tokens=max_tokens, temperature=temperature)
        except LLMRateLimitError as exc:
            # Translate LLM-level rate limit into application-level RateLimitError
            logger.warning("LLM rate limit encountered")
            raise AppRateLimitError() from exc
        except Exception as exc:
            logger.exception("Model generation failed")
            raise ModelUnavailableError("Model generation failed") from exc
        latency_ms = int((time.time() - start) * 1000)
        logger.info("Response Received; latency_ms=%d", latency_ms)

        # Try to extract text in common shapes
        text = ""
        raw = res.get("raw") if isinstance(res, dict) else res
        try:
            # OpenRouter/OpenAI-like shape
            choices = raw.get("choices", [])
            if choices:
                text = choices[0].get("message", {}).get("content", "")
        except Exception:
            text = str(raw)

        # token accounting if available
        try:
            usage = raw.get("usage", {}) if isinstance(raw, dict) else {}
            token_usage = TokenUsage(
                prompt_tokens=usage.get("prompt_tokens"),
                completion_tokens=usage.get("completion_tokens"),
                total_tokens=usage.get("total_tokens"),
                latency_ms=latency_ms,
                model_name=getattr(self.model, "model_name", None),
            )
            logger.info("Token Usage: %s", token_usage.json())
        except Exception:
            logger.debug("Token usage not available")

        return text

    def generate_json(self, prompt_name: str, variables: dict[str, Any], model: Type[BaseModel]) -> BaseModel:
        """Render a named prompt, call the model, and parse JSON into a Pydantic model.

        This method validates the prompt and variables, sends the rendered prompt
        to the model, and returns a typed Pydantic model instance.
        """
        rendered = self.prompt_manager.render(prompt_name, variables)
        logger.info("Prompt Loaded: %s", prompt_name)
        logger.info("Prompt Rendered: %s", prompt_name)

        raw_text = self.generate(rendered)

        # parsing with retry logic lives in OutputParser
        try:
            parsed = self.output_parser.parse(raw_text, model)
            logger.info("Parsing Success: %s", model.__name__)
            return parsed
        except JSONParsingError as exc:
            logger.warning("Parsing failed first time; retrying once")
            # one retry: re-call model with same prompt
            raw_text = self.generate(rendered)
            parsed = self.output_parser.parse(raw_text, model)
            logger.info("Parsing Success after retry: %s", model.__name__)
            return parsed

    def stream(self, prompt: str, **kwargs: Any) -> Iterator[str]:
        """Return an iterator yielding streamed chunks from the model."""
        logger.info("LLM Stream Started")
        try:
            for chunk in self.model.stream(prompt, **kwargs):
                yield chunk
        except LLMRateLimitError as exc:
            logger.warning("LLM rate limit encountered during streaming")
            raise AppRateLimitError() from exc
        except Exception as exc:
            logger.exception("Streaming failed")
            raise ModelUnavailableError("Streaming failed") from exc

    def health_check(self) -> dict[str, Any]:
        """Configuration-focused health check used by AI health endpoint."""
        required = ("OPENROUTER_MODEL", "OPENROUTER_BASE_URL", "OPENROUTER_API_KEY", "LLM_TIMEOUT")
        missing = [key for key in required if not os.getenv(key)]
        if missing:
            return {"healthy": False, "reason": f"Missing env vars: {', '.join(missing)}"}
        return {"healthy": True, "detail": "LLM configuration loaded"}

    # backward-compatible alias
    def health(self) -> bool:
        return bool(self.health_check().get("healthy"))


