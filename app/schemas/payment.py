from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, Field

from app.models.payment import PaymentStatus


class PaymentResult(str, Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class PaymentCreate(BaseModel):
    booking_id: int = Field(gt=0)
    result: PaymentResult


class PaymentResponse(BaseModel):
    id: int
    booking_id: int
    provider_event_id: str
    amount: Decimal
    status: PaymentStatus

    model_config = {
        "from_attributes": True,
    }


class PaymentWebhookRequest(BaseModel):
    provider_event_id: str = Field(
        min_length=1,
        max_length=255,
    )
    booking_id: int = Field(gt=0)
    amount: Decimal = Field(
        gt=0,
        decimal_places=2,
    )
    status: PaymentStatus