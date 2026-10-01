from datetime import date, datetime, time, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.booking import Booking, BookingStatus
from app.models.diagnostic_centre import DiagnosticCentre


SLOT_DURATION_MINUTES = 30


def get_available_slots(
    db: Session,
    centre_id: int,
    appointment_date: date,
):
    centre = db.scalar(
        select(DiagnosticCentre).where(
            DiagnosticCentre.id == centre_id
        )
    )

    if centre is None:
        return None

    start = datetime.combine(
        appointment_date,
        centre.opening_time,
    )

    end = datetime.combine(
        appointment_date,
        centre.closing_time,
    )

    bookings = db.scalars(
        select(Booking).where(
            Booking.centre_id == centre_id,
            Booking.appointment_at >= start,
            Booking.appointment_at < end,
            Booking.status.in_(
                [
                    BookingStatus.PENDING,
                    BookingStatus.CONFIRMED,
                ]
            ),
        )
    ).all()

    booked_times = {
        booking.appointment_at
        for booking in bookings
    }

    slots = []

    current = start

    while current < end:
        slots.append(
            {
                "appointment_at": current,
                "available": current not in booked_times,
            }
        )

        current += timedelta(minutes=SLOT_DURATION_MINUTES)

    return {
        "centre_id": centre.id,
        "date": appointment_date,
        "opening_time": centre.opening_time.strftime("%H:%M:%S"),
        "closing_time": centre.closing_time.strftime("%H:%M:%S"),
        "slots": slots,
    }