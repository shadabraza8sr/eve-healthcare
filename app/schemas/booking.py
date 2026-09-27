from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.booking import BookingStatus


class BookingCreate(BaseModel):
    centre_id: int = Field(gt=0)
    test_id: int = Field(gt=0)
    appointment_at: datetime


class BookingResponse(BaseModel):
    id: int
    user_id: int
    centre_id: int
    test_id: int
    appointment_at: datetime
    amount: Decimal
    status: BookingStatus

    model_config = {
        "from_attributes": True,
    }
