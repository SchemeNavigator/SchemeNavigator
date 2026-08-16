from pydantic import BaseModel, Field, field_validator


class SurveyRequest(BaseModel):
    citizen_id: str | None = None
    age: int = Field(..., ge=0)
    gender: str = "unspecified"
    state: str
    district: str | None = None
    area: str | None = None
    category: str
    minority: bool = False
    disability: bool = False
    disability_percentage: float = Field(default=0, ge=0, le=100)
    employment_status: str = "unspecified"
    occupation: str = "unspecified"
    bpl: bool = False
    annual_income: float = Field(default=0, ge=0)

    @field_validator("gender", "state", "category", "employment_status", "occupation")
    @classmethod
    def strip_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Value cannot be empty")
        return cleaned
