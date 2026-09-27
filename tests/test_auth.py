import uuid

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_signup_and_login():
    email = f"pytest_user_{uuid.uuid4().hex[:8]}@example.com"
    password = "Test@123456"

    signup_response = client.post(
        "/auth/signup",
        json={
            "email": email,
            "password": password,
        },
    )

    assert signup_response.status_code == 201

    login_response = client.post(
        "/auth/login",
        data={
            "username": email,
            "password": password,
        },
    )

    assert login_response.status_code == 200
    data = login_response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_duplicate_signup():
    email = f"pytest_duplicate_{uuid.uuid4().hex[:8]}@example.com"
    password = "Test@123456"

    first_response = client.post(
        "/auth/signup",
        json={
            "email": email,
            "password": password,
        },
    )

    assert first_response.status_code == 201

    second_response = client.post(
        "/auth/signup",
        json={
            "email": email,
            "password": password,
        },
    )

    assert second_response.status_code == 409


def test_invalid_login():
    response = client.post(
        "/auth/login",
        data={
            "username": "does_not_exist@example.com",
            "password": "Wrong@123456",
        },
    )

    assert response.status_code == 401
