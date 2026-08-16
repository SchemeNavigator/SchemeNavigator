from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
import os
from typing import Any

from dotenv import load_dotenv


REPO_ROOT = Path(__file__).resolve().parents[3]
BASE_DIR = Path(__file__).resolve().parents[2]

_loaded_env_path: Path | None = None
_env_file_found: bool = False


def _env_candidates() -> list[Path]:
    # Prefer backend/.env (project runtime root), then repo-level .env fallback.
    return [
        (BASE_DIR / ".env").resolve(),
        (REPO_ROOT / ".env").resolve(),
    ]


def load_environment() -> dict[str, Any]:
    """Load .env from deterministic absolute path(s), independent of CWD."""
    global _loaded_env_path, _env_file_found

    if _loaded_env_path is not None:
        return environment_diagnostics()

    for candidate in _env_candidates():
        if candidate.exists():
            load_dotenv(dotenv_path=candidate, override=False)
            _loaded_env_path = candidate
            _env_file_found = True
            return environment_diagnostics()

    _loaded_env_path = _env_candidates()[0]
    _env_file_found = False
    return environment_diagnostics()


def environment_diagnostics() -> dict[str, Any]:
    """Safe configuration diagnostics (never includes secret values)."""
    return {
        "env_found": _env_file_found,
        "env_path": str(_loaded_env_path) if _loaded_env_path else None,
        "openrouter_model_exists": bool(os.getenv("OPENROUTER_MODEL")),
        "openrouter_api_key_exists": bool(os.getenv("OPENROUTER_API_KEY")),
        "openrouter_base_url_exists": bool(os.getenv("OPENROUTER_BASE_URL")),
        "llm_timeout_exists": bool(os.getenv("LLM_TIMEOUT")),
        "log_level_exists": bool(os.getenv("LOG_LEVEL")),
        "csv_path_exists": bool(os.getenv("CSV_PATH")),
    }


# Load once at import time to initialize process environment early.
load_environment()


def _resolve_csv_path(raw_value: str | None) -> Path:
    default_path = BASE_DIR / "data" / "schemes.csv"
    if not raw_value:
        return default_path

    candidate_path = Path(raw_value).expanduser()
    if candidate_path.is_absolute():
        return candidate_path

    return (BASE_DIR / candidate_path).resolve()


@dataclass(frozen=True)
class Settings:
    openrouter_api_key: str = ""
    openrouter_model: str = ""
    openrouter_base_url: str = ""
    llm_timeout: int = 30
    log_level: str = "INFO"
    csv_path: Path = _resolve_csv_path(None)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    # Ensure environment is loaded before reading settings values.
    load_environment()

    timeout_raw = os.getenv("LLM_TIMEOUT", "30")
    try:
        llm_timeout = int(timeout_raw)
    except ValueError:
        llm_timeout = 30

    return Settings(
        openrouter_api_key=os.getenv("OPENROUTER_API_KEY", ""),
        openrouter_model=os.getenv("OPENROUTER_MODEL", ""),
        openrouter_base_url=os.getenv("OPENROUTER_BASE_URL", ""),
        llm_timeout=llm_timeout,
        log_level=os.getenv("LOG_LEVEL", "INFO"),
        csv_path=_resolve_csv_path(os.getenv("CSV_PATH")),
    )
