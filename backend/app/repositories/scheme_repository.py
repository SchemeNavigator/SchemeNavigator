from pathlib import Path
from typing import Any

import pandas as pd

from app.core.exceptions import BadRequestError, NotFoundError
from app.core.logging import get_logger
from app.models.scheme import Scheme
from app.repositories.csv_loader import CSVLoader
from app.utils.parsers import parse_multi_value_field


logger = get_logger(__name__)


class SchemeRepository:
    def __init__(self, csv_path: Path) -> None:
        self._csv_path = Path(csv_path)
        self._loader = CSVLoader()
        self._schemes_cache: list[Scheme] | None = None

    def _load_dataframe(self) -> pd.DataFrame:
        dataframe = self._loader.load(self._csv_path)
        return self._normalize_dataframe(dataframe)

    def _to_scheme(self, row: pd.Series) -> Scheme:
        scheme_category = str(row.get("schemeCategory", row.get("scheme_category", ""))).strip()
        return Scheme(
            scheme_name=str(row["scheme_name"]),
            slug=str(row["slug"]),
            details=str(row["details"]),
            benefits=str(row["benefits"]),
            eligibility=str(row["eligibility"]),
            application=str(row["application"]),
            documents=str(row["documents"]),
            level=str(row["level"]),
            scheme_category=scheme_category,
            tags=parse_multi_value_field(str(row.get("tags", ""))),
        )

    def load_all(self) -> list[Scheme]:
        logger.info("Repository call: load_all")
        if self._schemes_cache is not None:
            return list(self._schemes_cache)

        dataframe = self._load_dataframe()
        schemes = [self._to_scheme(row) for _, row in dataframe.iterrows()]
        self._schemes_cache = schemes
        return list(schemes)

    def find_by_id(self, scheme_id: str) -> Scheme:
        logger.info("Repository call: find_by_id(%s)", scheme_id)
        for scheme in self.load_all():
            if scheme.slug == str(scheme_id):
                return scheme
        raise NotFoundError(f"Scheme with id {scheme_id} not found")

    def find_by_scheme_name(self, scheme_name: str) -> Scheme:
        logger.info("Repository call: find_by_scheme_name(%s)", scheme_name)
        target = scheme_name.strip().casefold()
        for scheme in self.load_all():
            if scheme.scheme_name.casefold() == target:
                return scheme
        raise NotFoundError(f"Scheme named {scheme_name} not found")

    def filter(self, **criteria: Any) -> list[Scheme]:
        logger.info("Repository call: filter(%s)", criteria)
        if not criteria:
            return self.load_all()

        results = self.load_all()
        for field_name, expected_value in criteria.items():
            if expected_value in (None, ""):
                continue
            results = [
                scheme
                for scheme in results
                if self._matches_exact(getattr(scheme, field_name, None), expected_value)
            ]
        return results

    def search(
        self,
        keyword: str | None = None,
        level: str | None = None,
        scheme_category: str | None = None,
        tag: str | None = None,
    ) -> list[Scheme]:
        logger.info(
            "Repository call: search(keyword=%s, level=%s, scheme_category=%s, tag=%s)",
            keyword,
            level,
            scheme_category,
            tag,
        )
        if not any([keyword, level, scheme_category, tag]):
            raise BadRequestError("At least one search parameter is required")

        results = self.load_all()
        if keyword:
            normalized_keyword = self._normalize_text(keyword)
            results = [scheme for scheme in results if self._matches_keyword(scheme, normalized_keyword)]
        if level:
            normalized_level = self._normalize_text(level)
            results = [scheme for scheme in results if self._contains_text(scheme.level, normalized_level)]
        if scheme_category:
            normalized_category = self._normalize_text(scheme_category)
            results = [scheme for scheme in results if self._contains_text(scheme.scheme_category, normalized_category)]
        if tag:
            normalized_tag = self._normalize_text(tag)
            results = [scheme for scheme in results if self._matches_tag(scheme.tags, normalized_tag)]
        return results

    def is_loaded(self) -> bool:
        return self._loader.is_loaded(self._csv_path)

    @staticmethod
    def _normalize_dataframe(dataframe: pd.DataFrame) -> pd.DataFrame:
        cleaned = dataframe.copy()
        cleaned.columns = [str(column).strip() for column in cleaned.columns]
        cleaned = cleaned.loc[:, ~cleaned.columns.str.match(r"^Unnamed")]
        return cleaned.fillna("")

    @staticmethod
    def _matches_exact(value: Any, expected_value: Any) -> bool:
        if value is None:
            return False
        if isinstance(value, str) and isinstance(expected_value, str):
            return value.casefold() == expected_value.casefold()
        return value == expected_value

    @staticmethod
    def _normalize_text(value: Any) -> str:
        if value is None:
            return ""
        text = str(value).strip()
        return text.casefold()

    def _matches_keyword(self, scheme: Scheme, keyword: str) -> bool:
        searchable_fields = [
            scheme.scheme_name,
            scheme.details,
            scheme.benefits,
            scheme.eligibility,
            scheme.application,
            scheme.documents,
            scheme.scheme_category,
        ]

        for field_value in searchable_fields:
            if self._contains_text(field_value, keyword):
                return True

        return self._matches_tag(scheme.tags, keyword)

    @staticmethod
    def _contains_text(value: Any, needle: str | None) -> bool:
        if not needle:
            return False
        haystack = SchemeRepository._normalize_text(value)
        if not haystack:
            return False
        return needle in haystack

    @staticmethod
    def _matches_tag(tags: list[str], tag: str | None) -> bool:
        if not tag:
            return False
        for item in tags:
            if tag in SchemeRepository._normalize_text(item):
                return True
        return False
