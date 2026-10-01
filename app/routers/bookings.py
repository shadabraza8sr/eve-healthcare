from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.booking import Booking, BookingStatus
from app.models.centre_test import CentreTest
from app.models.diagnostic_centre import DiagnosticCentre
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingResponse


router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"],
)


@router.post(
    "/",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_booking(
    request: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    centre = db.scalar(
        select(DiagnosticCentre).where(
            DiagnosticCentre.id == request.centre_id
        )
    )

    if centre is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diagnostic centre not found",
        )

    centre_test = db.scalar(
        select(CentreTest).where(
            CentreTest.centre_id == request.centre_id,
            CentreTest.test_id == request.test_id,
        )
    )

    if centre_test is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test is not available at this centre",
        )

    appointment_at = request.appointment_at

    if appointment_at <= datetime.now():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Appointment must be in the future",
        )

    appointment_time = appointment_at.time()

    if (
        appointment_time < centre.opening_time
        or appointment_time >= centre.closing_time
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Appointment must be between "
                f"{centre.opening_time.strftime('%H:%M')} and "
                f"{centre.closing_time.strftime('%H:%M')}"
            ),
        )

    if (
        appointment_time.minute not in (0, 30)
        or appointment_time.second != 0
        or appointment_time.microsecond != 0
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Appointment must be on a 30-minute slot",
        )

    existing_booking = db.scalar(
        select(Booking).where(
            Booking.centre_id == request.centre_id,
            Booking.appointment_at == appointment_at,
            Booking.status.in_(
                [
                    BookingStatus.PENDING,
                    BookingStatus.CONFIRMED,
                ]
            ),
        )
    )

    if existing_booking is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This appointment slot is already booked",
        )

    booking = Booking(
        user_id=current_user.id,
        centre_id=request.centre_id,
        test_id=request.test_id,
        appointment_at=appointment_at,
        amount=centre_test.price,
        status=BookingStatus.PENDING,
    )

    db.add(booking)
    db.commit()
    db.refresh(booking)

    return booking


@router.get(
    "/",
    response_model=list[BookingResponse],
)
def list_my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bookings = db.scalars(
        select(Booking)
        .where(Booking.user_id == current_user.id)
        .order_by(Booking.id.desc())
    ).all()

    return bookings


@router.get(
    "/{booking_id}",
    response_model=BookingResponse,
)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = db.scalar(
        select(Booking).where(
            Booking.id == booking_id,
            Booking.user_id == current_user.id,
        )
    )

    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    return booking


@router.patch(
    "/{booking_id}/cancel",
    response_model=BookingResponse,
)
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = db.scalar(
        select(Booking).where(
            Booking.id == booking_id,
            Booking.user_id == current_user.id,
        )
    )

    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    if booking.status != BookingStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only pending bookings can be cancelled",
        )

    booking.status = BookingStatus.CANCELLED

    db.commit()
    db.refresh(booking)

    return booking