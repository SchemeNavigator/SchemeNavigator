from pydantic import BaseModel, Field


class Scheme(BaseModel):
    scheme_name: str
    slug: str
    details: str
    benefits: str
    eligibility: str
    application: str
    documents: str
    level: str
    scheme_category: str
    tags: list[str] = Field(default_factory=list)
