import pytest

from types import SimpleNamespace

from app.llm.model_factory import OpenRouterHTTPWrapper, ModelFactory
from app.llm.exceptions import RateLimitError as LLMRateLimitError, ModelUnavailableError


def make_fake_response(code=429, text='{}', headers=None, json_obj=None):
    class FakeResponse:
        def __init__(self):
            self.status_code = code
            self.text = text
            self.headers = headers or {}

        def json(self):
            return json_obj or {}

    return FakeResponse()


def test_openrouter_429_raises_llm_rate_limit():
    wrapper = OpenRouterHTTPWrapper(model_name="m", base_url="http://x", api_key="k")
    fake = SimpleNamespace(post=lambda *a, **k: make_fake_response(code=429, text='{"error":"free-models-per-day"}', headers={"X-RateLimit-Remaining": "0"}, json_obj={"error": "free-models-per-day"}))
    wrapper._httpx = fake
    with pytest.raises(LLMRateLimitError):
        wrapper.generate("hello")


def test_openrouter_500_raises_model_unavailable():
    wrapper = OpenRouterHTTPWrapper(model_name="m", base_url="http://x", api_key="k")
    fake = SimpleNamespace(post=lambda *a, **k: make_fake_response(code=500, text='{"error":"server"}', headers={}, json_obj={"error": "server"}))
    wrapper._httpx = fake
    with pytest.raises(ModelUnavailableError):
        wrapper.generate("hello")


def test_llmservice_translates_llm_rate_limit_to_app_rate_limit(monkeypatch):
    # Fake model that raises LLM-level RateLimitError
    def fake_create(*args, **kwargs):
        class M:
            def generate(self, prompt, **kw):
                raise LLMRateLimitError("rate limited")

            def stream(self, prompt, **kw):
                raise LLMRateLimitError("rate limited")

        return M()

    monkeypatch.setattr("app.llm.model_factory.ModelFactory.create", fake_create)
    from app.services.llm_service import LLMService
    from app.core.exceptions import RateLimitError as AppRateLimitError

    svc = LLMService()
    with pytest.raises(AppRateLimitError):
        svc.generate("x")


def test_llmservice_generic_error_remains_model_unavailable(monkeypatch):
    # Fake model that raises a generic Exception
    def fake_create2(*args, **kwargs):
        class M2:
            def generate(self, prompt, **kw):
                raise Exception("boom")

            def stream(self, prompt, **kw):
                raise Exception("boom")

        return M2()

    monkeypatch.setattr("app.llm.model_factory.ModelFactory.create", fake_create2)
    from app.services.llm_service import LLMService
    from app.llm.exceptions import ModelUnavailableError as LLMModelUnavailable

    svc = LLMService()
    with pytest.raises(LLMModelUnavailable):
        svc.generate("x")


def test_app_rate_limit_handler_maps_to_429():
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from app.core.exceptions import register_exception_handlers, RateLimitError

    app = FastAPI()
    register_exception_handlers(app)

    @app.get("/raise")
    def raise_rl():
        raise RateLimitError()

    client = TestClient(app)
    resp = client.get("/raise")
    assert resp.status_code == 429
