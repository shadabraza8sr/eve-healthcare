import uuid
from datetime import datetime, timedelta

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def setup_booking():
    email = "pytest_webhook@example.com"
    password = "Test@123456"

    signup = client.post(
        "/auth/signup",
        json={"email": email, "password": password},
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

    headers = {
        "Authorization": f"Bearer {login.json()['access_token']}"
    }

    centre = client.post(
        "/centres/",
        headers=headers,
        json={
            "name": "Webhook Diagnostics",
            "location": "Delhi",
        },
    )

    assert centre.status_code == 201

    diagnostic_test = client.post(
        "/tests/",
        headers=headers,
        json={
            "name": "Webhook Blood Test",
            "description": "Webhook test",
        },
    )

    assert diagnostic_test.status_code == 201

    mapping = client.post(
        "/centre-tests/",
        headers=headers,
        json={
            "centre_id": centre.json()["id"],
            "test_id": diagnostic_test.json()["id"],
            "price": 500,
        },
    )

    assert mapping.status_code == 201

    appointment = (
        datetime.now() + timedelta(days=2)
    ).replace(
        hour=12,
        minute=0,
        second=0,
        microsecond=0,
    ).isoformat()

    booking = client.post(
        "/bookings/",
        headers=headers,
        json={
            "centre_id": centre.json()["id"],
            "test_id": diagnostic_test.json()["id"],
            "appointment_at": appointment,
        },
    )

    assert booking.status_code == 201

    return headers, booking.json()


def test_webhook_is_idempotent():
    headers, booking = setup_booking()

    webhook = {
        "provider_event_id": f"pytest_evt_{uuid.uuid4().hex}",
        "booking_id": booking["id"],
        "amount": 500,
        "status": "SUCCESS",
    }

    first = client.post(
        "/payments/webhook/",
        json=webhook,
    )

    assert first.status_code == 201

    second = client.post(
        "/payments/webhook/",
        json=webhook,
    )

    assert second.status_code == 201

    assert first.json()["id"] == second.json()["id"]

    updated_booking = client.get(
        f"/bookings/{booking['id']}",
        headers=headers,
    )

    assert updated_booking.status_code == 200
    assert updated_booking.json()["status"] == "CONFIRMED"
