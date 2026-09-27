from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.centre_test import CentreTest
from app.models.diagnostic_centre import DiagnosticCentre
from app.models.diagnostic_test import DiagnosticTest
from app.models.user import User
from app.schemas.centre_test import (
    CentreTestCreate,
    CentreTestResponse,
)


router = APIRouter(
    prefix="/centre-tests",
    tags=["Centre Tests"],
)


@router.post(
    "/",
    response_model=CentreTestResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_centre_test(
    request: CentreTestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    centre = db.get(DiagnosticCentre, request.centre_id)

    if centre is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diagnostic centre not found",
        )

    diagnostic_test = db.get(DiagnosticTest, request.test_id)

    if diagnostic_test is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diagnostic test not found",
        )

    existing_mapping = db.scalar(
        select(CentreTest).where(
            CentreTest.centre_id == request.centre_id,
            CentreTest.test_id == request.test_id,
        )
    )

    if existing_mapping:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Test is already available at this centre",
        )

    centre_test = CentreTest(
        centre_id=request.centre_id,
        test_id=request.test_id,
        price=request.price,
    )

    db.add(centre_test)

    try:
        db.commit()
        db.refresh(centre_test)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Test is already available at this centre",
        )

    return centre_test


@router.get(
    "/",
    response_model=list[CentreTestResponse],
)
def list_centre_tests(
    centre_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(CentreTest).order_by(CentreTest.id)

    if centre_id is not None:
        query = query.where(CentreTest.centre_id == centre_id)

    centre_tests = db.scalars(query).all()

    return centre_tests