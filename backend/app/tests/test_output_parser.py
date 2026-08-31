import json

from pydantic import BaseModel

from ..llm.output_parser import OutputParser
from ..llm.exceptions import JSONParsingError


class SimpleModel(BaseModel):
    name: str
    age: int


def test_parse_valid_json():
    raw = json.dumps({"name": "Bob", "age": 30})
    parsed = OutputParser.parse(raw, SimpleModel)
    assert parsed.name == "Bob"


def test_parse_with_extra_text_and_retry():
    raw = "Some commentary before: \n{" + '"name": "Eve", "age": 25}'
    parsed = OutputParser.parse(raw, SimpleModel)
    assert parsed.age == 25


def test_parse_failure_raises():
    bad = "no json here"
    try:
        OutputParser.parse(bad, SimpleModel)
        raise AssertionError("Expected JSONParsingError")
    except JSONParsingError:
        pass
