from pydantic import BaseModel, Field


class DiagnosticCentreCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    location: str = Field(min_length=2, max_length=500)


class DiagnosticCentreResponse(BaseModel):
    id: int
    name: str
    location: str

    model_config = {
        "from_attributes": True,
    }
