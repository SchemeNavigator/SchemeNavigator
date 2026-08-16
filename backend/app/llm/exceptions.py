"""Custom exceptions for LLM infrastructure."""
from __future__ import annotations

class LLMError(Exception):
    """Base class for LLM-related errors."""


class LLMTimeoutError(LLMError):
    pass


class RateLimitError(LLMError):
    pass


class ModelUnavailableError(LLMError):
    pass


class JSONParsingError(LLMError):
    pass


class PromptValidationError(LLMError):
    pass


class ConfigurationError(LLMError):
    pass
