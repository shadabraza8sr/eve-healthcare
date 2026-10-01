from datetime import datetime, timedelta

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def get_auth_headers():
    email = "pytest_booking@example.com"
    password = "Test@123456"

    signup = client.post(
        "/auth/signup",
        json={
            "email": email,
            "password": password,
        },
    )

    if signup.status_code not in (201, 409):
        raise AssertionError(signup.text)

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


def test_booking_and_successful_payment():
    headers = get_auth_headers()

    centre = client.post(
        "/centres/",
        headers=headers,
        json={
            "name": "Pytest Diagnostics",
            "location": "Delhi",
        },
    )

    assert centre.status_code == 201
    centre_id = centre.json()["id"]

    diagnostic_test = client.post(
        "/tests/",
        headers=headers,
        json={
            "name": "Pytest Blood Test",
            "description": "Test diagnostic",
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
            "price": 750,
        },
    )

    assert mapping.status_code == 201

    appointment = (
        datetime.now() + timedelta(days=1)
    ).replace(
        hour=11,
        minute=0,
        second=0,
        microsecond=0,
    ).isoformat()

    booking = client.post(
        "/bookings/",
        headers=headers,
        json={
            "centre_id": centre_id,
            "test_id": test_id,
            "appointment_at": appointment,
        },
    )

    assert booking.status_code == 201
    booking_data = booking.json()

    assert booking_data["status"] == "PENDING"
    assert booking_data["amount"] == "750.00"

    payment = client.post(
        "/payments/",
        headers=headers,
        json={
            "booking_id": booking_data["id"],
            "result": "SUCCESS",
        },
    )

    assert payment.status_code == 201
    assert payment.json()["status"] == "SUCCESS"

    updated_booking = client.get(
        f"/bookings/{booking_data['id']}",
        headers=headers,
    )

    assert updated_booking.status_code == 200
    assert updated_booking.json()["status"] == "CONFIRMED"


def test_cancel_pending_booking():
    headers = get_auth_headers()

    centre = client.post(
        "/centres/",
        headers=headers,
        json={
            "name": "Cancellation Diagnostics",
            "location": "Delhi",
        },
    )
    assert centre.status_code == 201

    diagnostic_test = client.post(
        "/tests/",
        headers=headers,
        json={
            "name": "Cancellation Blood Test",
            "description": "Cancellation test",
        },
    )
    assert diagnostic_test.status_code == 201

    mapping = client.post(
        "/centre-tests/",
        headers=headers,
        json={
            "centre_id": centre.json()["id"],
            "test_id": diagnostic_test.json()["id"],
            "price": 600,
        },
    )
    assert mapping.status_code == 201

    appointment = (
        datetime.now() + timedelta(days=3)
    ).replace(
        hour=11,
        minute=30,
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
    booking_id = booking.json()["id"]
    assert booking.json()["status"] == "PENDING"

    cancellation = client.patch(
        f"/bookings/{booking_id}/cancel",
        headers=headers,
    )

    assert cancellation.status_code == 200
    assert cancellation.json()["status"] == "CANCELLED"

    second_cancellation = client.patch(
        f"/bookings/{booking_id}/cancel",
        headers=headers,
    )

    assert second_cancellation.status_code == 409
