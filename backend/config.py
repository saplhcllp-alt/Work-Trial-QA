import os


class Config:
    # NOTE (evaluator): secrets are intentionally weak / hardcoded for the trial.
    MONGO_URI = os.environ.get(
        "MONGO_URI", "mongodb://brd_app:brd_app_pass@db:27017/harshwal_brd?authSource=admin"
    )
    MONGO_DB = os.environ.get("MONGO_DB", "harshwal_brd")

    # Weak, hardcoded signing secret (planted).
    JWT_SECRET = os.environ.get("JWT_SECRET", "secret")
    JWT_ALGO = "HS256"

    # Debug on in a "production-ish" container (planted).
    DEBUG = os.environ.get("FLASK_DEBUG", "1") == "1"

    # Allowed origin for the SPA.
    FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")
