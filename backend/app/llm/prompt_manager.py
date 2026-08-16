"""PromptManager: load, render and validate prompts from app/prompts."""
from __future__ import annotations

import os
import logging
from pathlib import Path
from typing import Dict, Any

from pydantic import BaseModel

from .exceptions import PromptValidationError


logger = logging.getLogger(__name__)


class Prompt(BaseModel):
    name: str
    content: str


class PromptManager:
    """Load prompts from `app/prompts/` and render them with variables.

    Prompts are simple text files. The prompt name is the filename without
    extension. Rendering uses Python format-style replacement on `{{var}}`.
    Jinja2 is optional in the future.
    """

    def __init__(self, prompts_dir: str | None = None) -> None:
        base = prompts_dir or os.path.join(os.path.dirname(__file__), "..", "prompts")
        self.prompts_dir = os.path.abspath(base)
        self._prompts: Dict[str, Prompt] = {}
        self.load()

    @staticmethod
    def _default_prompts() -> Dict[str, str]:
        return {
            "intent": (
                "You are an intent extraction assistant for a public-benefits scheme recommendation workflow.\n"
                "\n"
                "Task:\n"
                "- Read the user survey and conversation history.\n"
                "- Produce a compact profile and retrieval query for scheme search.\n"
                "- Return valid JSON only. Do not return markdown.\n"
            ),
            "recommendation": (
                "You are a recommendation ranking assistant for government/public schemes.\n"
                "\n"
                "Task:\n"
                "- Evaluate candidate schemes against the user profile.\n"
                "- Rank candidates and explain trade-offs.\n"
                "- Return valid JSON only. Do not return markdown.\n"
            ),
            "planner": (
                "You are an application planning assistant for scheme enrollment.\n"
                "\n"
                "Task:\n"
                "- Create a practical application roadmap for the selected scheme.\n"
                "- Use timeline context and conversation details.\n"
                "- Return valid JSON only. Do not return markdown.\n"
            ),
            "verification": (
                "You are a verification and audit assistant for workflow quality checks.\n"
                "\n"
                "Task:\n"
                "- Review deterministic validator outputs and workflow artifacts.\n"
                "- Produce a final verification assessment.\n"
                "- Return valid JSON only. Do not return markdown.\n"
            ),
        }

    def load(self, clear_cache: bool = True) -> None:
        """Load all prompt files from the prompts directory."""
        if clear_cache:
            self._prompts.clear()

        discovered: Dict[str, Prompt] = {}
        if not os.path.isdir(self.prompts_dir):
            self._prompts.update({name: Prompt(name=name, content=content) for name, content in self._default_prompts().items()})
            logger.info("Discovered prompts: %s", ", ".join(sorted(self._prompts)))
            return

        prompt_root = Path(self.prompts_dir)
        for path in sorted(prompt_root.iterdir()):
            if not path.is_file():
                continue
            if path.suffix.lower() not in {".md", ".txt", ".prompt"}:
                continue
            if path.stem.lower() == "readme":
                continue
            with open(path, "r", encoding="utf-8") as fh:
                content = fh.read()
            discovered[path.stem] = Prompt(name=path.stem, content=content)

        self._prompts.update(discovered)
        for name, content in self._default_prompts().items():
            self._prompts.setdefault(name, Prompt(name=name, content=content))

        logger.info("Discovered prompts: %s", ", ".join(sorted(self._prompts)))

    def _reload_once(self) -> None:
        self.load(clear_cache=True)

    def list_prompts(self) -> list[str]:
        return list(self._prompts.keys())

    def get(self, name: str) -> Prompt:
        prompt = self._prompts.get(name)
        if prompt is not None:
            return prompt

        self._reload_once()
        prompt = self._prompts.get(name)
        if prompt is not None:
            return prompt

        logger.error("Prompt retrieval failed for '%s'; available prompts: %s", name, ", ".join(sorted(self._prompts)))
        raise PromptValidationError(f"Prompt '{name}' not found")

    def render(self, name: str, variables: Dict[str, Any]) -> str:
        prompt = self.get(name)
        rendered = prompt.content
        for key, value in variables.items():
            rendered = rendered.replace(f"{{{{{key}}}}}", str(value))
        if "{{" in rendered and "}}" in rendered:
            start = rendered.find("{{")
            end = rendered.find("}}", start)
            if start != -1 and end != -1:
                missing = rendered[start + 2:end].strip()
                logger.error("Prompt rendering failed for '%s'; missing variable '%s'", name, missing)
                raise PromptValidationError(f"Missing variables for prompt {name}: [{missing}]")
        return rendered

    def validate(self, name: str, variables: Dict[str, Any]) -> None:
        _ = self.render(name, variables)
