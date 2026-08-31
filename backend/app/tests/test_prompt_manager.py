import os
from tempfile import TemporaryDirectory

from ..llm.prompt_manager import PromptManager
from ..llm.exceptions import PromptValidationError


def test_load_and_render_prompt():
    with TemporaryDirectory() as td:
        path = os.path.join(td, "greet.txt")
        with open(path, "w", encoding="utf-8") as fh:
            fh.write("Hello {{name}}\nYour id is {{id}}")

        pm = PromptManager(prompts_dir=td)
        assert "greet" in pm.list_prompts()
        rendered = pm.render("greet", {"name": "Alice", "id": 42})
        assert "Alice" in rendered


def test_missing_variable_raises():
    with TemporaryDirectory() as td:
        path = os.path.join(td, "simple.txt")
        with open(path, "w", encoding="utf-8") as fh:
            fh.write("Value: {{value}} and {{missing}}")

        pm = PromptManager(prompts_dir=td)
        try:
            pm.render("simple", {"value": 1})
            raise AssertionError("Expected PromptValidationError")
        except PromptValidationError:
            pass
