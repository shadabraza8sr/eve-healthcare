from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def get_auth_token():
    email = "pagination_test@example.com"
    password = "Password123!"

    # Try login first in case the test user already exists.
    response = client.post(
        "/auth/login",
        data={
            "username": email,
            "password": password,
        },
    )

    if response.status_code == 200:
        return response.json()["access_token"]

    # Create the user if it does not exist.
    response = client.post(
        "/auth/signup",
        json={
            "email": email,
            "password": password,
        },
    )

    assert response.status_code == 201, response.text

    # Login after signup.
    response = client.post(
        "/auth/login",
        data={
            "username": email,
            "password": password,
        },
    )

    assert response.status_code == 200, response.text

    return response.json()["access_token"]


def test_centre_search_and_pagination():
    token = get_auth_token()

    headers = {
        "Authorization": f"Bearer {token}",
    }

    response = client.get(
        "/centres/",
        params={
            "page": 1,
            "limit": 2,
        },
        headers=headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert "items" in data
    assert "page" in data
    assert "limit" in data
    assert "total" in data
    assert "pages" in data

    assert data["page"] == 1
    assert data["limit"] == 2
    assert len(data["items"]) <= 2


def test_test_search_and_pagination():
    token = get_auth_token()

    headers = {
        "Authorization": f"Bearer {token}",
    }

    response = client.get(
        "/tests/",
        params={
            "page": 1,
            "limit": 2,
        },
        headers=headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert "items" in data
    assert "page" in data
    assert "limit" in data
    assert "total" in data
    assert "pages" in data

    assert data["page"] == 1
    assert data["limit"] == 2
    assert len(data["items"]) <= 2