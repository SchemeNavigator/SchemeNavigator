import os

from ...llm.model_factory import ModelFactory
from ...llm.exceptions import ConfigurationError


def test_missing_env_raises(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    monkeypatch.delenv("OPENROUTER_MODEL", raising=False)
    monkeypatch.delenv("OPENROUTER_BASE_URL", raising=False)
    try:
        ModelFactory.create()
        raise AssertionError("Expected ConfigurationError")
    except ConfigurationError:
        pass
