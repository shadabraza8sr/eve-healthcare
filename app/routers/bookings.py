from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.booking import Booking, BookingStatus
from app.models.centre_test import CentreTest
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

    booking = Booking(
        user_id=current_user.id,
        centre_id=request.centre_id,
        test_id=request.test_id,
        appointment_at=request.appointment_at,
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