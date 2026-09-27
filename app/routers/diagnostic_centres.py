from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.diagnostic_centre import DiagnosticCentre
from app.models.user import User
from app.schemas.diagnostic_centre import (
    DiagnosticCentreCreate,
    DiagnosticCentreResponse,
)


router = APIRouter(
    prefix="/centres",
    tags=["Diagnostic Centres"],
)


@router.post(
    "/",
    response_model=DiagnosticCentreResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_centre(
    request: DiagnosticCentreCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    centre = DiagnosticCentre(
        name=request.name,
        location=request.location,
    )

    db.add(centre)
    db.commit()
    db.refresh(centre)

    return centre


@router.get(
    "/",
    response_model=list[DiagnosticCentreResponse],
)
def list_centres(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    centres = db.scalars(
        select(DiagnosticCentre).order_by(DiagnosticCentre.id)
    ).all()

    return centres
