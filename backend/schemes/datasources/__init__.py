"""
DataSource factory — returns the right DataSource instance based on source type.

To register a new source:
  1. Create a new class in its own file (e.g. api_source_v2.py)
  2. Add an entry to the _REGISTRY dict below
"""
from .base import DataSource
from .csv_source import CSVDataSource
from .api_source import ExternalAPIDataSource

_REGISTRY: dict[str, type[DataSource]] = {
    "csv": CSVDataSource,
    "api": ExternalAPIDataSource,
}


def get_datasource(source_type: str, **kwargs) -> DataSource:
    """
    Factory function.

    Args:
        source_type: One of the registered source type strings (e.g. "csv", "api").
        **kwargs: Constructor arguments forwarded to the chosen DataSource class.

    Returns:
        An initialised DataSource instance.

    Raises:
        ValueError: If source_type is not registered.
    """
    cls = _REGISTRY.get(source_type.lower())
    if cls is None:
        available = ", ".join(_REGISTRY.keys())
        raise ValueError(
            f"Unknown source type '{source_type}'. Available: {available}"
        )
    return cls(**kwargs)


__all__ = ["DataSource", "CSVDataSource", "ExternalAPIDataSource", "get_datasource"]
