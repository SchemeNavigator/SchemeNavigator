"""
Thin LiteLLM wrapper.

All three agents call this module. The model, API key, temperature, and
max_tokens are read from Django settings so they can be swapped via
environment variables without code changes.

To switch providers set LITELLM_MODEL in .env:
  gpt-4o-mini                        → OpenAI
  gemini/gemini-1.5-flash            → Google
  anthropic/claude-3-haiku           → Anthropic
  ollama/llama3                      → Local Ollama
  azure/<deployment-name>            → Azure OpenAI
  openrouter/z-ai/glm-5.2:free       → OpenRouter (GLM 5.2 free)

For OpenRouter also set:
  LITELLM_API_BASE=https://openrouter.ai/api/v1
  LITELLM_API_KEY=sk-or-v1-...
"""
import logging
from typing import Any

import litellm
from django.conf import settings

logger = logging.getLogger(__name__)

# Silence LiteLLM's verbose logging unless DEBUG
litellm.set_verbose = getattr(settings, "DEBUG", False)


def call_llm(
    messages: list[dict],
    *,
    model: str | None = None,
    temperature: float | None = None,
    max_tokens: int | None = None,
    response_format: dict | None = None,
) -> str:
    """
    Call the configured LLM via LiteLLM and return the assistant message text.

    Args:
        messages: OpenAI-style list of {"role": ..., "content": ...} dicts.
        model: Override the default model from settings.
        temperature: Override the default temperature from settings.
        max_tokens: Override the default max_tokens from settings.
        response_format: Optional response format dict (e.g. {"type": "json_object"}).

    Returns:
        The assistant's reply as a plain string.

    Raises:
        RuntimeError: If the LLM call fails after retries.
    """
    _model = model or getattr(settings, "LITELLM_MODEL", "gpt-4o-mini")
    _temp = temperature if temperature is not None else getattr(settings, "LITELLM_TEMPERATURE", 0.3)
    _max_tokens = max_tokens if max_tokens is not None else getattr(settings, "LITELLM_MAX_TOKENS", 1024)
    _api_key = getattr(settings, "LITELLM_API_KEY", "") or None
    _api_base = getattr(settings, "LITELLM_API_BASE", "") or None

    kwargs: dict[str, Any] = {
        "model": _model,
        "messages": messages,
        "temperature": _temp,
        "max_tokens": _max_tokens,
        "num_retries": 2,
    }
    if _api_key:
        kwargs["api_key"] = _api_key
    if _api_base:
        kwargs["api_base"] = _api_base
    if response_format:
        kwargs["response_format"] = response_format

    try:
        response = litellm.completion(**kwargs)
        return response.choices[0].message.content or ""
    except Exception as exc:
        logger.error("LiteLLM call failed: %s", exc, exc_info=True)
        raise RuntimeError(f"LLM call failed: {exc}") from exc
