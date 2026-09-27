from fastapi import FastAPI

app = FastAPI(
    title="EVE Healthcare API",
    description="Diagnostic test booking and simulated payment service",
    version="1.0.0",
)


@app.get("/")
def root():
    return {
        "message": "EVE Healthcare API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }