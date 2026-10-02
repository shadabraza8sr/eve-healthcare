from fastapi import APIRouter, Depends, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.diagnostic_centre import DiagnosticCentre
from app.models.user import User
from app.schemas.diagnostic_centre import (
    DiagnosticCentreCreate,
    DiagnosticCentreListResponse,
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
        opening_time=request.opening_time,
        closing_time=request.closing_time,
    )

    db.add(centre)
    db.commit()
    db.refresh(centre)

    return centre


@router.get(
    "/",
    response_model=DiagnosticCentreListResponse,
)
def list_centres(
    search: str | None = None,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if page < 1:
        page = 1

    if limit < 1:
        limit = 10

    if limit > 100:
        limit = 100

    query = select(DiagnosticCentre)

    if search:
        search_pattern = f"%{search.strip()}%"

        query = query.where(
            DiagnosticCentre.name.ilike(search_pattern)
            | DiagnosticCentre.location.ilike(search_pattern)
        )

    total = db.scalar(
        select(func.count()).select_from(query.subquery())
    )

    query = (
        query
        .order_by(DiagnosticCentre.id)
        .offset((page - 1) * limit)
        .limit(limit)
    )

    centres = db.scalars(query).all()

    pages = (total + limit - 1) // limit

    return {
        "items": centres,
        "page": page,
        "limit": limit,
        "total": total,
        "pages": pages,
    }