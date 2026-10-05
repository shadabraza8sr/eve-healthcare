import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.database import Base, get_db
from app.main import app

# Use the dedicated PostgreSQL test database.
TEST_DATABASE_URL = settings.database_url.rsplit("/", 1)[0] + "/eve_healthcare_test"

test_engine = create_engine(
    TEST_DATABASE_URL,
    pool_pre_ping=True,
)

TestSessionLocal = sessionmaker(
    bind=test_engine,
    autoflush=False,
    autocommit=False,
)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    # Import all models so they are registered with Base.metadata.
    import app.models  # noqa: F401

    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)

    yield

    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(autouse=True)
def override_database():
    def get_test_db():
        db = TestSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = get_test_db

    yield

    app.dependency_overrides.clear()


@pytest.fixture
def client():
    return TestClient(app)
