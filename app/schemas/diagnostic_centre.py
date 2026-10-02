from datetime import datetime, time

from pydantic import BaseModel, Field


class DiagnosticCentreCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    location: str = Field(min_length=1, max_length=500)
    opening_time: time = time(9, 0)
    closing_time: time = time(18, 0)


class DiagnosticCentreResponse(BaseModel):
    id: int
    name: str
    location: str
    opening_time: time
    closing_time: time
    created_at: datetime

    model_config = {
        "from_attributes": True,
    }


class DiagnosticCentreListResponse(BaseModel):
    items: list[DiagnosticCentreResponse]
    page: int
    limit: int
    total: int
    pages: int