import pytest

from types import SimpleNamespace
from pydantic import BaseModel

from app.llm.model_factory import OpenRouterHTTPWrapper
from app.llm.exceptions import JSONParsingError, RateLimitError as LLMRateLimitError, ModelUnavailableError


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


def test_llmservice_translates_llm_rate_limit_to_app_rate_limit():
    # Fake model that raises LLM-level RateLimitError
    from app.services.llm_service import LLMService
    from app.core.exceptions import RateLimitError as AppRateLimitError

    class RateLimitedModel:
        def generate(self, prompt, **kwargs):
            raise LLMRateLimitError("rate limited")

    svc = LLMService.__new__(LLMService)
    svc.model = RateLimitedModel()
    with pytest.raises(AppRateLimitError):
        svc.generate("x")


def test_llmservice_generic_error_remains_model_unavailable():
    # Fake model that raises a generic Exception
    from app.services.llm_service import LLMService
    from app.llm.exceptions import ModelUnavailableError as LLMModelUnavailable

    class FailingModel:
        def generate(self, prompt, **kwargs):
            raise Exception("boom")

    svc = LLMService.__new__(LLMService)
    svc.model = FailingModel()
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


def test_generate_json_limits_provider_attempts_to_two():
    from app.llm.output_parser import OutputParser
    from app.services.llm_service import LLMService

    class AlwaysInvalidModel:
        def __init__(self):
            self.calls = 0

        def generate(self, prompt, **kwargs):
            self.calls += 1
            return {"raw": {"choices": [{"message": {"content": "not json"}}]}}

    class EmptyModel(BaseModel):
        pass

    service = LLMService.__new__(LLMService)
    service.prompt_manager = SimpleNamespace(render=lambda prompt_name, variables: "prompt")
    service.output_parser = OutputParser()
    service.model = AlwaysInvalidModel()

    with pytest.raises(JSONParsingError):
        service.generate_json("intent", {}, EmptyModel)

    assert service.model.calls == 2


def test_structured_agents_use_bounded_per_agent_token_limits(monkeypatch):
    from app.llm.output_parser import OutputParser
    from app.services.llm_service import LLMService

    class EmptyModel(BaseModel):
        pass

    class RecordingModel:
        def __init__(self):
            self.requests = []

        def generate(self, prompt, **kwargs):
            self.requests.append(kwargs)
            return {"raw": {"choices": [{"message": {"content": "{}"}}]}}

    model = RecordingModel()
    service = LLMService.__new__(LLMService)
    service.prompt_manager = SimpleNamespace(render=lambda prompt_name, variables: "prompt")
    service.output_parser = OutputParser()
    service.model = model

    for prompt_name in ("intent", "recommendation", "planner", "verification"):
        service.generate_json(prompt_name, {}, EmptyModel)

    assert [request["max_tokens"] for request in model.requests] == [2048, 4096, 4096, 4096]


def test_structured_agent_retry_reuses_same_token_limit():
    from app.llm.exceptions import JSONParsingError
    from app.llm.output_parser import OutputParser
    from app.services.llm_service import LLMService

    class EmptyModel(BaseModel):
        pass

    class RecordingModel:
        def __init__(self):
            self.requests = []

        def generate(self, prompt, **kwargs):
            self.requests.append(kwargs)
            return {"raw": {"choices": [{"message": {"content": "{}"}}]}}

    class ParseOnce:
        def __init__(self):
            self.calls = 0

        def parse(self, raw, model):
            self.calls += 1
            if self.calls == 1:
                raise JSONParsingError("invalid JSON")
            return model()

    model = RecordingModel()
    service = LLMService.__new__(LLMService)
    service.prompt_manager = SimpleNamespace(render=lambda prompt_name, variables: "prompt")
    service.output_parser = ParseOnce()
    service.model = model

    service.generate_json("verification", {}, EmptyModel)

    assert [request["max_tokens"] for request in model.requests] == [4096, 4096]


def test_json_token_limit_can_be_configured_and_reaches_http_payload(monkeypatch):
    from app.llm.model_factory import OpenRouterHTTPWrapper
    from app.services.llm_service import LLMService

    monkeypatch.setenv("LLM_MAX_TOKENS_INTENT", "1500")
    assert LLMService._json_max_tokens("intent") == 1500

    captured = {}

    class Response:
        status_code = 200
        text = ""
        headers = {}

        def json(self):
            return {"choices": [{"message": {"content": "{}"}}]}

    class HTTP:
        def post(self, url, **kwargs):
            captured.update(kwargs)
            return Response()

    wrapper = OpenRouterHTTPWrapper(model_name="m", base_url="http://x", api_key="k")
    wrapper._httpx = HTTP()
    wrapper.generate("prompt", max_tokens=1500)

    assert captured["json"]["max_tokens"] == 1500
