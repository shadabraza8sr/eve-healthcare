import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.booking import Booking, BookingStatus
from app.models.payment import Payment, PaymentStatus
from app.models.user import User
from app.schemas.payment import (
    PaymentCreate,
    PaymentResponse,
    PaymentResult,
    PaymentWebhookRequest,
)


router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
)


@router.post(
    "/",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_payment(
    request: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = db.scalar(
        select(Booking).where(
            Booking.id == request.booking_id,
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
            detail="Booking is not pending payment",
        )

    payment_status = (
        PaymentStatus.SUCCESS
        if request.result == PaymentResult.SUCCESS
        else PaymentStatus.FAILED
    )

    payment = Payment(
        booking_id=booking.id,
        provider_event_id=f"sim_{uuid.uuid4().hex}",
        amount=booking.amount,
        status=payment_status,
    )

    booking.status = (
        BookingStatus.CONFIRMED
        if payment_status == PaymentStatus.SUCCESS
        else BookingStatus.FAILED
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    return payment


@router.post(
    "/webhook/",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
)
def payment_webhook(
    request: PaymentWebhookRequest,
    db: Session = Depends(get_db),
):
    # 1. Idempotency:
    # If this provider event was already processed,
    # return the existing payment instead of creating another one.
    existing_payment = db.scalar(
        select(Payment).where(
            Payment.provider_event_id == request.provider_event_id
        )
    )

    if existing_payment is not None:
        return existing_payment

    # 2. Lock the booking while processing the webhook.
    booking = db.scalar(
        select(Booking)
        .where(Booking.id == request.booking_id)
        .with_for_update()
    )

    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    # 3. Verify that the payment amount matches the booking.
    if request.amount != booking.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment amount does not match booking amount",
        )

    # 4. Do not process another payment for a completed booking.
    if booking.status != BookingStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Booking is no longer pending payment",
        )

    # 5. Create payment record.
    payment = Payment(
        booking_id=booking.id,
        provider_event_id=request.provider_event_id,
        amount=request.amount,
        status=request.status,
    )

    # 6. Update booking according to payment result.
    if request.status == PaymentStatus.SUCCESS:
        booking.status = BookingStatus.CONFIRMED
    else:
        booking.status = BookingStatus.FAILED

    db.add(payment)

    try:
        db.commit()
        db.refresh(payment)

    except IntegrityError:
        db.rollback()

        # Handles a duplicate event arriving concurrently.
        existing_payment = db.scalar(
            select(Payment).where(
                Payment.provider_event_id == request.provider_event_id
            )
        )

        if existing_payment is not None:
            return existing_payment

        raise

    return payment