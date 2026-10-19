import datetime
import functools

import jwt
from flask import request, jsonify

from config import Config


def make_token(user):
    payload = {
        "uid": user["id"],
        "email": user["email"],
        "role": user["role"],
        # Long-lived token, no rotation (planted weakness).
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm=Config.JWT_ALGO)


def decode_token(token):
    # NOTE: algorithms list includes only HS256, but secret is "secret".
    return jwt.decode(token, Config.JWT_SECRET, algorithms=[Config.JWT_ALGO])


def require_auth(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        token = header.replace("Bearer ", "").strip()
        if not token:
            return jsonify({"error": "missing token"}), 401
        try:
            claims = decode_token(token)
        except Exception as exc:  # noqa: BLE001
            # Verbose error leaks why the token failed (planted).
            return jsonify({"error": "invalid token", "detail": str(exc)}), 401
        request.user = claims
        return fn(*args, **kwargs)

    return wrapper
