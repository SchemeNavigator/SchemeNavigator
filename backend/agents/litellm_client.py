"""
LiteLLM Gateway — optimized for 100% Free AI Model APIs.

Supported Free Providers & Models:
1. Google Gemini (Free Tier - 15 RPM / 1M TPM):
   - Model: gemini/gemini-1.5-flash or gemini/gemini-2.0-flash
   - Key: GEMINI_API_KEY or LITELLM_API_KEY (from https://aistudio.google.com/)

2. Groq (Free Tier - ultra-fast inference):
   - Model: groq/llama-3.3-70b-versatile or groq/llama-3.1-8b-instant
   - Key: GROQ_API_KEY or LITELLM_API_KEY (from https://console.groq.com/)

3. OpenRouter (Free community models):
   - Model: openrouter/meta-llama/llama-3.3-70b-instruct:free or openrouter/google/gemini-2.0-flash-exp:free
   - Key: OPENROUTER_API_KEY or LITELLM_API_KEY (from https://openrouter.ai/keys)

4. Local Ollama (100% offline & free, no key needed):
   - Model: ollama/llama3 or ollama/mistral
   - Base: http://localhost:11434
"""
import os
import logging
from typing import Any, Optional

import litellm
from django.conf import settings

logger = logging.getLogger(__name__)

# Silence LiteLLM's verbose logging unless DEBUG
litellm.set_verbose = getattr(settings, "DEBUG", False)


def _resolve_api_credentials(model_name: str) -> tuple[Optional[str], Optional[str]]:
    """
    Intelligently resolves API Key and API Base from environment / settings
    for the specific model provider.
    """
    api_key = (
        getattr(settings, "LITELLM_API_KEY", "")
        or os.environ.get("LITELLM_API_KEY", "")
    )
    api_base = (
        getattr(settings, "LITELLM_API_BASE", "")
        or os.environ.get("LITELLM_API_BASE", "")
    )

    model_lower = model_name.lower()

    # 1. Google Gemini
    if "gemini" in model_lower:
        gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if gemini_key:
            api_key = gemini_key

    # 2. Groq
    elif "groq" in model_lower:
        groq_key = os.environ.get("GROQ_API_KEY")
        if groq_key:
            api_key = groq_key

    # 3. OpenRouter Free Models
    elif "openrouter" in model_lower:
        openrouter_key = os.environ.get("OPENROUTER_API_KEY")
        if openrouter_key:
            api_key = openrouter_key
        if not api_base:
            api_base = "https://openrouter.ai/api/v1"

    # 4. Local Ollama
    elif "ollama" in model_lower:
        if not api_base:
            api_base = os.environ.get("OLLAMA_API_BASE", "http://localhost:11434")

    return (api_key.strip() if api_key else None), (api_base.strip() if api_base else None)


def _call_gemini_direct(messages: list[dict], api_key: str, model_name: str, temperature: float, max_tokens: int) -> str:
    """Fast, direct HTTP request to Google Gemini API bypassing library wrappers."""
    import httpx
    
    clean_model = model_name.replace("gemini/", "").replace("models/", "").strip()
    if clean_model in ("gemini-flash-latest", "gemini-flash", "flash"):
        clean_model = "gemini-1.5-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{clean_model}:generateContent?key={api_key}"
    
    # Format messages for Gemini API
    contents = []
    system_instruction = None
    for m in messages:
        role = m.get("role")
        content = m.get("content", "")
        if role == "system":
            system_instruction = {"parts": [{"text": content}]}
        elif role == "assistant":
            contents.append({"role": "model", "parts": [{"text": content}]})
        else:
            contents.append({"role": "user", "parts": [{"text": content}]})
            
    payload: dict[str, Any] = {
        "contents": contents,
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
        }
    }
    if system_instruction:
        payload["systemInstruction"] = system_instruction
        
    with httpx.Client(timeout=4.0) as client:
        resp = client.post(url, json=payload)
        if resp.status_code == 200:
            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "")
        raise RuntimeError(f"Gemini direct call failed with status {resp.status_code}: {resp.text[:200]}")


def call_llm(
    messages: list[dict],
    *,
    model: str | None = None,
    temperature: float | None = None,
    max_tokens: int | None = None,
    response_format: dict | None = None,
) -> str:
    """
    Call the configured LLM via LiteLLM or direct Google Gemini API.
    Handles free-tier model routing and graceful retries.
    """
    _model = model or getattr(settings, "LITELLM_MODEL", "gemini/gemini-flash-latest")
    _temp = temperature if temperature is not None else getattr(settings, "LITELLM_TEMPERATURE", 0.4)
    _max_tokens = max_tokens if max_tokens is not None else getattr(settings, "LITELLM_MAX_TOKENS", 1024)

    _api_key, _api_base = _resolve_api_credentials(_model)

    # If it's a Gemini model with an API key, try direct fast caller first
    if "gemini" in _model.lower() and _api_key:
        try:
            return _call_gemini_direct(messages, _api_key, _model, _temp, _max_tokens)
        except Exception as exc:
            logger.warning("Direct Gemini call failed (%s), trying LiteLLM gateway: %s", _model, exc)

    kwargs: dict[str, Any] = {
        "model": _model,
        "messages": messages,
        "temperature": _temp,
        "max_tokens": _max_tokens,
        "timeout": 6,
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
        logger.error("LiteLLM call failed with model %s: %s", _model, exc)
        raise RuntimeError(f"LLM call failed: {exc}") from exc

