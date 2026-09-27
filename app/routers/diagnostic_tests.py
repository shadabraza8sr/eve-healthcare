from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.diagnostic_test import DiagnosticTest
from app.models.user import User
from app.schemas.diagnostic_test import (
    DiagnosticTestCreate,
    DiagnosticTestResponse,
)


router = APIRouter(
    prefix="/tests",
    tags=["Diagnostic Tests"],
)


@router.post(
    "/",
    response_model=DiagnosticTestResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_test(
    request: DiagnosticTestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    diagnostic_test = DiagnosticTest(
        name=request.name,
        description=request.description,
    )

    db.add(diagnostic_test)
    db.commit()
    db.refresh(diagnostic_test)

    return diagnostic_test


@router.get(
    "/",
    response_model=list[DiagnosticTestResponse],
)
def list_tests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tests = db.scalars(
        select(DiagnosticTest).order_by(DiagnosticTest.id)
    ).all()

    return tests
