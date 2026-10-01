from datetime import date, datetime

from pydantic import BaseModel


class AvailabilitySlot(BaseModel):
    appointment_at: datetime
    available: bool


class AvailabilityResponse(BaseModel):
    centre_id: int
    date: date
    opening_time: str
    closing_time: str
    slots: list[AvailabilitySlot]