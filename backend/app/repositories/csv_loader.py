from pathlib import Path

import pandas as pd

from app.core.exceptions import CSVLoadError
from app.core.logging import get_logger


logger = get_logger(__name__)


class CSVLoader:
    _instance: "CSVLoader | None" = None

    def __new__(cls) -> "CSVLoader":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._dataframe = None
            cls._instance._csv_path = None
        return cls._instance

    def load(self, csv_path: Path) -> pd.DataFrame:
        resolved_path = Path(csv_path).resolve()
        if self._dataframe is not None and self._csv_path == resolved_path:
            return self._dataframe

        if not resolved_path.exists():
            raise CSVLoadError(f"CSV file not found at {resolved_path}")

        logger.info("Loading CSV from %s", resolved_path)
        try:
            dataframe = pd.read_csv(resolved_path).fillna("")
        except Exception as exc:  # pragma: no cover - defensive safety net
            raise CSVLoadError(f"Failed to load CSV: {exc}") from exc

        self._dataframe = dataframe
        self._csv_path = resolved_path
        return dataframe

    def is_loaded(self, csv_path: Path | None = None) -> bool:
        if self._dataframe is None:
            return False
        if csv_path is None:
            return True
        return self._csv_path == Path(csv_path).resolve()
