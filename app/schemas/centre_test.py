from decimal import Decimal

from pydantic import BaseModel, Field


class CentreTestCreate(BaseModel):
    centre_id: int = Field(gt=0)
    test_id: int = Field(gt=0)
    price: Decimal = Field(gt=0, decimal_places=2)


class CentreTestResponse(BaseModel):
    id: int
    centre_id: int
    test_id: int
    price: Decimal

    model_config = {
        "from_attributes": True,
    }
