from pydantic import BaseModel, ConfigDict, field_validator


class SchemeSearchQuery(BaseModel):
    keyword: str | None = None
    level: str | None = None
    scheme_category: str | None = None
    tag: str | None = None

    model_config = ConfigDict(extra="forbid")

    @field_validator("keyword", "level", "scheme_category", "tag", mode="before")
    @classmethod
    def normalize_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed or None