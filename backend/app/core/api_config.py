"""API configuration loader.

The API layer reads versioning and timeout behavior from a JSON file so the
request surface can evolve without touching route code.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parents[2]
API_CONFIG_PATH = BASE_DIR / "config" / "api_config.json"


@dataclass(frozen=True)
class ApiConfig:
	version: str = "v1"
	timeout_seconds: float = 15.0
	debug: bool = False
	maximum_execution_time_seconds: float = 30.0
	llm_max_tokens: dict[str, int] | None = None
	require_verification: bool = False
	max_payload_bytes: int = 1_048_576
	supported_versions: tuple[str, ...] = ("v1", "v2")

	@property
	def api_prefix(self) -> str:
		return f"/api/{self.version}"


def _coerce_config(raw: dict[str, Any]) -> ApiConfig:
	supported_versions = raw.get("supported_versions", ("v1", "v2"))
	if isinstance(supported_versions, list):
		supported_versions = tuple(str(version) for version in supported_versions)
	elif isinstance(supported_versions, str):
		supported_versions = (supported_versions,)

	return ApiConfig(
		version=str(raw.get("version", "v1")),
		timeout_seconds=float(raw.get("timeout_seconds", raw.get("timeout", 15.0))),
		debug=bool(raw.get("debug", False)),
		maximum_execution_time_seconds=float(raw.get("maximum_execution_time_seconds", 30.0)),
		llm_max_tokens={str(key): int(value) for key, value in raw.get("llm_max_tokens", {}).items()},
		require_verification=bool(raw.get("require_verification", False)),
		max_payload_bytes=int(raw.get("max_payload_bytes", 1_048_576)),
		supported_versions=supported_versions,
	)


@lru_cache(maxsize=1)
def get_api_config() -> ApiConfig:
	if not API_CONFIG_PATH.exists():
		return ApiConfig()

	with API_CONFIG_PATH.open("r", encoding="utf-8") as config_file:
		raw_config = json.load(config_file)

	if not isinstance(raw_config, dict):
		return ApiConfig()

	return _coerce_config(raw_config)
