from pydantic import BaseModel, Field


class DiagnosticTestCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=255,
    )
    description: str | None = Field(
        default=None,
        max_length=2000,
    )


class DiagnosticTestResponse(BaseModel):
    id: int
    name: str
    description: str | None

    model_config = {
        "from_attributes": True,
    }


class DiagnosticTestListResponse(BaseModel):
    items: list[DiagnosticTestResponse]
    page: int
    limit: int
    total: int
    pages: int