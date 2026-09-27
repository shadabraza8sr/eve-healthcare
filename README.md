# EVE Healthcare API

A backend API for diagnostic centre discovery, diagnostic test bookings, and simulated payments.

Built with **FastAPI, PostgreSQL, SQLAlchemy, Alembic, JWT authentication, and pytest**.

## Features

* User signup and login
* JWT-based authentication
* Password hashing with Argon2
* Diagnostic centre management
* Diagnostic test management
* Centre-test mapping with test prices
* Centre-test listing and filtering
* Diagnostic test booking
* Booking ownership protection
* Booking cancellation
* Simulated payment processing
* Payment success and failure handling
* Payment webhook handling
* Idempotent payment webhooks
* PostgreSQL database
* Alembic database migrations
* Automated API tests
* Swagger/OpenAPI documentation
* Docker Compose PostgreSQL setup

## Tech Stack

* Python 3.11
* FastAPI
* PostgreSQL 16
* SQLAlchemy 2
* Alembic
* Pydantic v2
* JWT
* Argon2
* pytest
* Docker Compose

## Project Structure

```text
eve-healthcare/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── dependencies.py
│   ├── security.py
│   ├── models/
│   ├── schemas/
│   ├── routers/
│   └── services/
├── tests/
├── alembic/
├── .env
├── .gitignore
├── alembic.ini
├── docker-compose.yml
├── pytest.ini
├── requirements.txt
└── README.md
```

## Setup

### 1. Clone the repository

```bash
git clone <your-github-repository-url>
cd eve-healthcare
```

### 2. Create a virtual environment

```bash
python -m venv venv
```

Activate it on Windows:

```powershell
.\venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Start PostgreSQL

Docker Compose is used for the PostgreSQL database.

```bash
docker compose up -d
```

Check that the database is running:

```bash
docker ps
```

### 5. Configure environment variables

Create a `.env` file:

```env
DATABASE_URL=postgresql+psycopg://eve_user:eve_password@localhost:5432/eve_healthcare
JWT_SECRET_KEY=change-this-secret-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

Do not commit production secrets to Git.

### 6. Run database migrations

```bash
alembic upgrade head
```

### 7. Start the API

```bash
uvicorn app.main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

ReDoc:

```text
http://127.0.0.1:8000/redoc
```

## Authentication

### Signup

```http
POST /auth/signup
```

Example:

```json
{
  "email": "user@example.com",
  "password": "Test@123456"
}
```

### Login

```http
POST /auth/login
```

The login endpoint uses OAuth2 form data:

```text
username=user@example.com
password=Test@123456
```

The response contains a JWT access token.

Use the token for protected endpoints:

```text
Authorization: Bearer <access_token>
```

## Diagnostic Centres

Create a centre:

```http
POST /centres/
```

```json
{
  "name": "EVE Diagnostics",
  "location": "Delhi"
}
```

List centres:

```http
GET /centres/
```

## Diagnostic Tests

Create a test:

```http
POST /tests/
```

```json
{
  "name": "Complete Blood Count",
  "description": "CBC blood test"
}
```

List tests:

```http
GET /tests/
```

## Centre-Test Mapping

Associate a diagnostic test with a centre and price:

```http
POST /centre-tests/
```

```json
{
  "centre_id": 1,
  "test_id": 1,
  "price": 500
}
```

List available tests and prices:

```http
GET /centre-tests/
```

Filter by centre:

```http
GET /centre-tests/?centre_id=1
```

## Bookings

Create a booking:

```http
POST /bookings/
```

```json
{
  "centre_id": 1,
  "test_id": 1,
  "appointment_at": "2026-10-01T10:00:00"
}
```

The booking amount is taken from the centre-test mapping rather than trusting a client-supplied amount.

List the authenticated user's bookings:

```http
GET /bookings/
```

Get a specific booking:

```http
GET /bookings/{booking_id}
```

Cancel a pending booking:

```http
PATCH /bookings/{booking_id}/cancel
```

Only the booking owner can access or cancel their booking.

A booking can be cancelled only while its status is `PENDING`.

## Booking Statuses

```text
PENDING
CONFIRMED
FAILED
CANCELLED
```

Typical transitions:

```text
PENDING → CONFIRMED
PENDING → FAILED
PENDING → CANCELLED
```

## Payments

### Simulated Payment

```http
POST /payments/
```

Example:

```json
{
  "booking_id": 1,
  "result": "SUCCESS"
}
```

Possible results:

```text
SUCCESS
FAILED
```

A successful payment changes the booking status to `CONFIRMED`.

A failed payment changes the booking status to `FAILED`.

### Payment Webhook

```http
POST /payments/webhook/
```

Example:

```json
{
  "provider_event_id": "evt_12345",
  "booking_id": 1,
  "amount": 500,
  "status": "SUCCESS"
}
```

The webhook validates that the payment amount matches the booking amount.

Webhook events are idempotent using the unique `provider_event_id`.

If the same provider event is received more than once, the existing payment record is returned instead of creating another payment.

## Database

PostgreSQL is used as the primary database.

Main tables:

```text
users
diagnostic_centres
diagnostic_tests
centre_tests
bookings
payments
```

Alembic manages schema migrations.

Check the current migration:

```bash
alembic current
```

Apply migrations:

```bash
alembic upgrade head
```

## Testing

Run the complete test suite:

```bash
pytest -v
```

Current automated coverage includes:

* Signup and login
* Duplicate signup
* Invalid login
* Booking creation
* Successful payment
* Booking cancellation
* Health endpoint
* Payment webhook idempotency

## Health Checks

API health:

```http
GET /health
```

Database health:

```http
GET /health/db
```

Example:

```json
{
  "status": "ok",
  "database": "connected"
}
```

## Design Decisions

### Server-side booking amount

The booking amount is determined from the centre-test mapping. The client cannot choose an arbitrary booking price.

### Ownership checks

Booking queries include the authenticated user's ID. This prevents one user from accessing another user's booking.

### Payment validation

Webhook payments are checked against the booking amount before being processed.

### Idempotent webhooks

`provider_event_id` is unique in the database. This prevents duplicate payment records when the same webhook is delivered multiple times.

### Transaction safety

Database commits are used only after required validations succeed. Integrity errors are rolled back before returning an API error.

## Future Improvements

Possible production enhancements include:

* Redis caching
* Celery background jobs
* Rate limiting
* Structured logging
* Pagination
* Payment retry handling
* Dockerized API service
* More extensive integration tests
* Production payment-provider signature verification

## License

This project was created as part of the EVE Healthcare SDE Intern Backend Engineering Assignment.
