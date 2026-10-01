from datetime import datetime, time

from sqlalchemy import DateTime, String, Time
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class DiagnosticCentre(Base):
    __tablename__ = "diagnostic_centres"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )

    location: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    opening_time: Mapped[time] = mapped_column(
        Time,
        nullable=False,
        default=time(9, 0),
    )

    closing_time: Mapped[time] = mapped_column(
        Time,
        nullable=False,
        default=time(18, 0),
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )