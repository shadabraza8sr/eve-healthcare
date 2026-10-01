from datetime import datetime, timedelta

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def get_auth_headers():
    email = "pytest_availability@example.com"
    password = "Test@123456"

    signup = client.post(
        "/auth/signup",
        json={
            "email": email,
            "password": password,
        },
    )

    assert signup.status_code in (201, 409)

    login = client.post(
        "/auth/login",
        data={
            "username": email,
            "password": password,
        },
    )

    assert login.status_code == 200

    token = login.json()["access_token"]

    return {
        "Authorization": f"Bearer {token}"
    }


def test_availability_returns_30_minute_slots():
    headers = get_auth_headers()

    centre = client.post(
        "/centres/",
        headers=headers,
        json={
            "name": "Availability Diagnostics",
            "location": "Delhi",
            "opening_time": "09:00:00",
            "closing_time": "18:00:00",
        },
    )

    assert centre.status_code == 201

    centre_id = centre.json()["id"]

    appointment_date = (
        datetime.now() + timedelta(days=2)
    ).date().isoformat()

    response = client.get(
        f"/availability/{centre_id}",
        headers=headers,
        params={
            "appointment_date": appointment_date,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["centre_id"] == centre_id
    assert data["opening_time"] == "09:00:00"
    assert data["closing_time"] == "18:00:00"

    slots = data["slots"]

    assert len(slots) == 18

    assert slots[0]["appointment_at"].endswith("09:00:00")
    assert slots[-1]["appointment_at"].endswith("17:30:00")

    for slot in slots:
        appointment_time = datetime.fromisoformat(
            slot["appointment_at"]
        )

        assert appointment_time.minute in (0, 30)
        assert appointment_time.second == 0


def test_booked_slot_becomes_unavailable():
    headers = get_auth_headers()

    centre = client.post(
        "/centres/",
        headers=headers,
        json={
            "name": "Booked Slot Diagnostics",
            "location": "Delhi",
            "opening_time": "09:00:00",
            "closing_time": "18:00:00",
        },
    )

    assert centre.status_code == 201
    centre_id = centre.json()["id"]

    diagnostic_test = client.post(
        "/tests/",
        headers=headers,
        json={
            "name": "Availability Blood Test",
            "description": "Availability test",
        },
    )

    assert diagnostic_test.status_code == 201
    test_id = diagnostic_test.json()["id"]

    mapping = client.post(
        "/centre-tests/",
        headers=headers,
        json={
            "centre_id": centre_id,
            "test_id": test_id,
            "price": 500,
        },
    )

    assert mapping.status_code == 201

    appointment_date = (
        datetime.now() + timedelta(days=2)
    ).date()

    appointment_at = datetime.combine(
        appointment_date,
        datetime.min.time().replace(hour=11),
    )

    booking = client.post(
        "/bookings/",
        headers=headers,
        json={
            "centre_id": centre_id,
            "test_id": test_id,
            "appointment_at": appointment_at.isoformat(),
        },
    )

    assert booking.status_code == 201

    availability = client.get(
        f"/availability/{centre_id}",
        headers=headers,
        params={
            "appointment_date": appointment_date.isoformat(),
        },
    )

    assert availability.status_code == 200

    slots = availability.json()["slots"]

    booked_slot = next(
        slot
        for slot in slots
        if slot["appointment_at"].endswith("11:00:00")
    )

    assert booked_slot["available"] is False
