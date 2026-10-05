from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import engine
from app.routers.auth import router as auth_router
from app.routers.bookings import router as bookings_router
from app.routers.centre_tests import router as centre_tests_router
from app.routers.diagnostic_centres import router as diagnostic_centres_router
from app.routers.diagnostic_tests import router as diagnostic_tests_router
from app.routers.payments import router as payments_router
from app.routers.availability import router as availability_router


app = FastAPI(
    title="EVE Healthcare API",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "https://eve-healthcare-frontend.onrender.com",
    "https://eve-healthcare-frontend-new.onrender.com",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(diagnostic_centres_router)
app.include_router(diagnostic_tests_router)
app.include_router(centre_tests_router)
app.include_router(bookings_router)
app.include_router(payments_router)
app.include_router(availability_router)


@app.get("/")
def root():
    return {"message": "EVE Healthcare API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/health/db")
def database_health_check():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {"status": "ok", "database": "connected"}