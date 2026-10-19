import datetime
import hashlib
import random

from flask import Blueprint, request, jsonify

from db import get_db
from auth import make_token

auth_bp = Blueprint("auth", __name__)


def _md5(value: str) -> str:
    return hashlib.md5(value.encode("utf-8")).hexdigest()


@auth_bp.route("/api/login", methods=["POST"])
def login():
    """Step 1 of login: email + password, then issue an OTP for 2FA."""
    body = request.get_json(force=True, silent=True) or {}
    email = body.get("email", "")
    password = body.get("password", "")

    pw_hash = _md5(password)

    db = get_db()

    # VULNERABLE: query built as a raw JavaScript $where string with the
    # user-supplied email interpolated in. This is the NoSQL analogue of SQL
    # injection -- e.g. email = `x' || true || '` authenticates as the first
    # user. Candidates should flag this injection sink.
    where = (
        f"this.email == '{email}' && this.password_md5 == '{pw_hash}'"
    )
    user = db.users.find_one({"$where": where})

    if not user:
        return jsonify({"error": "invalid credentials"}), 401

    # Generate a 6-digit OTP. Uses a non-cryptographic RNG (planted).
    otp = f"{random.randint(0, 999999):06d}"
    db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "otp_code": otp,
                "otp_expires": datetime.datetime.utcnow()
                + datetime.timedelta(minutes=10),
            }
        },
    )

    # VULNERABLE: OTP echoed back in the API response ("for testing").
    return jsonify(
        {
            "message": "OTP sent",
            "user_id": user["id"],
            "dev_otp": otp,
        }
    )


@auth_bp.route("/api/verify-2fa", methods=["POST"])
def verify_2fa():
    """Step 2 of login: verify the OTP, issue a JWT."""
    body = request.get_json(force=True, silent=True) or {}
    user_id = body.get("user_id")
    otp = body.get("otp", "")

    db = get_db()
    user = db.users.find_one({"id": user_id})
    if not user:
        return jsonify({"error": "unknown user"}), 404

    # VULNERABLE: no attempt counter / rate limit -> OTP brute-forceable.
    # VULNERABLE: otp_expires is stored but never actually enforced here.
    if str(otp) != str(user.get("otp_code")):
        return jsonify({"error": "invalid otp"}), 401

    token = make_token(user)
    return jsonify(
        {
            "token": token,
            "user": {
                "id": user["id"],
                "email": user["email"],
                "full_name": user["full_name"],
                "role": user["role"],
            },
        }
    )
