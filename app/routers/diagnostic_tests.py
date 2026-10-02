from fastapi import APIRouter, Depends, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.diagnostic_test import DiagnosticTest
from app.models.user import User
from app.schemas.diagnostic_test import (
    DiagnosticTestCreate,
    DiagnosticTestListResponse,
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
    response_model=DiagnosticTestListResponse,
)
def list_tests(
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

    query = select(DiagnosticTest)

    if search:
        search_pattern = f"%{search.strip()}%"

        query = query.where(
            DiagnosticTest.name.ilike(search_pattern)
            | DiagnosticTest.description.ilike(search_pattern)
        )

    total = db.scalar(
        select(func.count()).select_from(query.subquery())
    )

    query = (
        query
        .order_by(DiagnosticTest.id)
        .offset((page - 1) * limit)
        .limit(limit)
    )

    tests = db.scalars(query).all()

    pages = (total + limit - 1) // limit

    return {
        "items": tests,
        "page": page,
        "limit": limit,
        "total": total,
        "pages": pages,
    }