from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.availability import AvailabilityResponse
from app.services.availability import get_available_slots


router = APIRouter(
    prefix="/availability",
    tags=["Appointment Availability"],
)


@router.get(
    "/{centre_id}",
    response_model=AvailabilityResponse,
)
def get_availability(
    centre_id: int,
    appointment_date: date = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = get_available_slots(
        db=db,
        centre_id=centre_id,
        appointment_date=appointment_date,
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Diagnostic centre not found",
        )

    return result