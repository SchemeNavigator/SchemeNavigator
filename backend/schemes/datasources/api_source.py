"""
ExternalAPIDataSource — stub for future live government scheme API integration.

To implement, subclass this or override fetch_schemes():
  1. Set api_url and api_key via constructor or settings
  2. Implement the HTTP fetch and map the response to Scheme dicts
  3. Register the source in the factory in __init__.py
"""
from .base import DataSource


class ExternalAPIDataSource(DataSource):
    """
    Stub data source for a future external API.

    Usage example (future):
        source = ExternalAPIDataSource(
            url="https://api.india.gov.in/schemes",
            api_key="<key>",
            headers={"Accept": "application/json"},
        )
        schemes = source.fetch_schemes()
    """

    def __init__(self, url: str = "", api_key: str = "", headers: dict | None = None):
        self.url = url
        self.api_key = api_key
        self.headers = headers or {}

    def fetch_schemes(self) -> list[dict]:
        raise NotImplementedError(
            "ExternalAPIDataSource.fetch_schemes() is not yet implemented. "
            "To add a live API, subclass ExternalAPIDataSource and override this method. "
            "See backend/docs/csv_schema.md for the required output dict structure."
        )
