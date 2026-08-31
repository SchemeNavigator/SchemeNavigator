import json
import time

import pytest
from pydantic import BaseModel

from app.graph.recommendation_models import RecommendationResult
from app.llm.exceptions import JSONParsingError, JSONSchemaValidationError
from app.llm.output_parser import OutputParser
from app.services.llm_service import LLMService


class RecordingProvider:
    def __init__(self, responses, timeout=30):
        self.responses = iter(responses)
        self.requests = []
        self.timeout = timeout

    def generate(self, prompt, max_tokens=None, temperature=None):
        self.requests.append({"prompt": prompt, "max_tokens": max_tokens})
        return {"raw": {"choices": [{"message": {"content": next(self.responses)}}]}}


def make_service(responses, timeout=30):
    service = LLMService.__new__(LLMService)
    service.prompt_manager = type("PromptStub", (), {"render": lambda self, name, variables: "recommendation prompt"})()
    service.output_parser = OutputParser()
    service.model = RecordingProvider(responses, timeout=timeout)
    return service


def valid_recommendation_json():
    return json.dumps(
        {
            "recommendations": [
                {
                    "scheme_id": "scheme-1",
                    "scheme_name": "Scheme One",
                    "overall_score": 82,
                    "confidence": 0.8,
                    "reason": "Evidence matches the profile.",
                    "pros": ["Relevant support"],
                    "cons": [],
                    "eligibility_analysis": None,
                    "benefit_analysis": None,
                    "risk_analysis": None,
                    "required_documents_summary": None,
                    "recommended_priority": "high",
                }
            ],
            "summary": "Scheme One is the strongest supplied match.",
            "overall_confidence": 0.8,
            "limitations": [],
            "missing_information": [],
        }
    )


def test_valid_recommendation_result_parses():
    service = make_service([valid_recommendation_json()])

    result = service.generate_json("recommendation", {}, RecommendationResult)

    assert result.recommendations[0].scheme_id == "scheme-1"
    assert len(service.model.requests) == 1
    assert service.model.requests[0]["max_tokens"] == 4096


def test_malformed_json_retries_once_with_same_token_limit():
    service = make_service(["not json", valid_recommendation_json()])

    result = service.generate_json("recommendation", {}, RecommendationResult)

    assert result.recommendations[0].scheme_id == "scheme-1"
    assert len(service.model.requests) == 2
    assert [request["max_tokens"] for request in service.model.requests] == [4096, 4096]
    assert "valid JSON" in service.model.requests[1]["prompt"]


def test_valid_json_schema_failure_does_not_retry():
    service = make_service([json.dumps({"recommendations": [{"overall_score": "not a number"}]})])

    with pytest.raises(JSONSchemaValidationError):
        service.generate_json("recommendation", {}, RecommendationResult)

    assert len(service.model.requests) == 1


def test_malformed_json_does_not_retry_when_budget_is_insufficient():
    service = make_service(["not json"], timeout=30)

    with pytest.raises(JSONParsingError):
        service.generate_json(
            "recommendation",
            {},
            RecommendationResult,
            retry_deadline=time.monotonic() + 1,
        )

    assert len(service.model.requests) == 1


def test_parser_accepts_nullable_fields_when_omitted():
    class SmallModel(BaseModel):
        value: str | None = None

    parsed = OutputParser.parse("{}", SmallModel)

    assert parsed.value is None
