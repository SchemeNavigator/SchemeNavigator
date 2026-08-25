"""Model factory to instantiate provider-specific clients.

This factory prefers LangChain if available; otherwise falls back to a
lightweight HTTP-based OpenRouter client. The goal is to centralize
provider wiring behind a single entrypoint.
"""
from __future__ import annotations

import os
import time
from typing import Any, Dict, Optional

from .exceptions import ConfigurationError, ModelUnavailableError, RateLimitError


class BaseModelWrapper:
    """Abstract wrapper exposing a consistent interface for LLM calls."""

    def __init__(self, model_name: str, **kwargs: Any) -> None:
        self.model_name = model_name

    def generate(self, prompt: str, **kwargs: Any) -> Dict[str, Any]:
        raise NotImplementedError()

    def stream(self, prompt: str, **kwargs: Any):
        raise NotImplementedError()


class OpenRouterHTTPWrapper(BaseModelWrapper):
    """Minimal OpenRouter client using httpx.

    This exists as a fallback so the service can operate without LangChain
    installed in tests. It speaks a subset of the OpenAI-compatible API that
    OpenRouter offers.
    """

    def __init__(self, model_name: str, base_url: str, api_key: str, timeout: int = 30):
        super().__init__(model_name)
        try:
            import httpx
        except Exception as exc:  # pragma: no cover - defensive
            raise ConfigurationError("httpx must be installed for OpenRouter HTTP mode") from exc

        self._httpx = httpx
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout

    def _endpoint(self) -> str:
        return f"{self.base_url}/v1/chat/completions"

    def generate(self, prompt: str, **kwargs: Any) -> Dict[str, Any]:
        url = self._endpoint()
        headers = {"Authorization": f"Bearer {self.api_key}"}
        payload = {
            "model": self.model_name,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": kwargs.get("max_tokens") or 4096,
        }
        params = {}
        if "max_tokens" in kwargs:
            payload["max_tokens"] = kwargs["max_tokens"]
        start = time.time()
        r = self._httpx.post(url, json=payload, headers=headers, timeout=self.timeout)
        latency_ms = int((time.time() - start) * 1000)
        if r.status_code >= 400:
            # Preserve OpenRouter rate-limit as a distinct LLM-level error so
            # higher layers can translate it into an application-level 429.
            if r.status_code == 429:
                err = RateLimitError(f"OpenRouter returned 429: rate limited")
                # Attach minimal provider context for diagnostics (kept internal)
                try:
                    err.status_code = r.status_code
                    err.headers = dict(r.headers or {})
                except Exception:
                    pass
                raise err
            raise ModelUnavailableError(f"OpenRouter returned {r.status_code}: {r.text}")
        return {"raw": r.json(), "latency_ms": latency_ms}

    def stream(self, prompt: str, **kwargs: Any):
        # Basic streaming via server-sent events isn't implemented here; yield full
        # content once for compatibility.
        result = self.generate(prompt, **kwargs)
        content = ""
        try:
            # Navigate typical response shape
            choices = result["raw"].get("choices", [])
            if choices:
                content = choices[0].get("message", {}).get("content", "")
        except Exception:
            content = str(result.get("raw"))
        yield content


class ModelFactory:
    """Create provider model wrappers.

    Reads configuration from environment variables documented in the project
    README. Returns a wrapper exposing `generate` and `stream`.
    """

    @staticmethod
    def create(model_name: Optional[str] = None, timeout: Optional[int] = None) -> BaseModelWrapper:
        model = model_name or os.getenv("OPENROUTER_MODEL")
        base_url = os.getenv("OPENROUTER_BASE_URL")
        api_key = os.getenv("OPENROUTER_API_KEY")
        timeout_val = timeout or int(os.getenv("LLM_TIMEOUT", "30"))

        if not model or not base_url or not api_key:
            raise ConfigurationError("OPENROUTER_MODEL, OPENROUTER_BASE_URL and OPENROUTER_API_KEY must be set")

        # Prefer LangChain when available
        try:
            from langchain.chat_models import OpenAI  # type: ignore
            # LangChain may be configured to work with OpenRouter via base_url/headers
            # but that's environment-specific. Instantiate a simple OpenAI wrapper
            # if the import exists; the user can configure API keys externally.
            return LangChainWrapper(model_name=model, timeout=timeout_val)  # type: ignore
        except Exception:
            # Fallback to direct OpenRouter HTTP wrapper
            return OpenRouterHTTPWrapper(model_name=model, base_url=base_url, api_key=api_key, timeout=timeout_val)


class LangChainWrapper(BaseModelWrapper):
    """Wrap a LangChain chat model instance.

    This wrapper assumes users have configured their environment so that
    LangChain/OpenAI-compatible classes can reach OpenRouter (via env
    variables or other configuration).
    """

    def __init__(self, model_name: str, timeout: int = 30):
        super().__init__(model_name)
        try:
            from langchain.chat_models import ChatOpenAI  # type: ignore
            from langchain.schema import HumanMessage  # type: ignore
        except Exception as exc:  # pragma: no cover - defensive
            raise ConfigurationError("langchain is required for LangChainWrapper") from exc

        # ChatOpenAI accepts model name and temperature; map settings in LLMService
        self._ChatOpenAI = ChatOpenAI
        self._HumanMessage = HumanMessage
        self.timeout = timeout
        self._client = self._ChatOpenAI(model_name=self.model_name)

    def generate(self, prompt: str, **kwargs: Any) -> Dict[str, Any]:
        # Use sync call; LangChain returns an LLMResult
        start = time.time()
        message = self._HumanMessage(content=prompt)
        result = self._client.generate([[message]])
        latency_ms = int((time.time() - start) * 1000)
        return {"raw": result, "latency_ms": latency_ms}

    def stream(self, prompt: str, **kwargs: Any):
        # LangChain streaming would use callbacks; for now return full text wrapper
        res = self.generate(prompt, **kwargs)
        # extract text
        text = ""
        try:
            # LLMResult -> generations -> text
            gens = res["raw"].generations
            if gens and gens[0]:
                text = gens[0][0].text
        except Exception:
            text = str(res["raw"])  # fallback
        yield text
