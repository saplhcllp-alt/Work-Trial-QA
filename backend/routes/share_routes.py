import datetime

from flask import Blueprint, request, jsonify

from db import get_db
from auth import require_auth

share_bp = Blueprint("share", __name__)


def _next_token(db):
    # VULNERABLE: predictable, sequential share token (e.g. "brd-1", "brd-2").
    # A client who receives one link can enumerate every other client's form.
    n = db.share_links.count_documents({}) + 1
    return f"brd-{n}"


@share_bp.route("/api/brds/<brd_id>/share", methods=["POST"])
@require_auth
def create_share_link(brd_id):
    db = get_db()
    token = _next_token(db)
    db.share_links.insert_one(
        {
            "brd_id": int(brd_id),
            "token": token,
            "is_active": True,
            "created_at": datetime.datetime.utcnow(),
        }
    )
    return jsonify({"token": token, "path": f"/form/{token}"}), 201


# ---- Public endpoints (no auth: a client opens these with just the link) ----


@share_bp.route("/api/public/form/<token>", methods=["GET"])
def public_form(token):
    db = get_db()
    # VULNERABLE: token interpolated into a raw $where JS string (NoSQL
    # injection) + no check that the link is_active.
    link = db.share_links.find_one({"$where": f"this.token == '{token}'"})
    if not link:
        return jsonify({"error": "invalid link"}), 404
    brd = db.brds.find_one({"id": link["brd_id"]})
    if not brd:
        return jsonify({"error": "invalid link"}), 404
    return jsonify(
        {
            "id": brd["id"],
            "client_name": brd["client_name"],
            "project_type": brd["project_type"],
            "title": brd["title"],
        }
    )


@share_bp.route("/api/public/form/<token>", methods=["POST"])
def submit_form(token):
    """Client submits their business requirements against a share link.

    VULNERABLE: state-changing endpoint with NO CSRF protection, NO rate
    limiting, and NO input validation / sanitisation.
    """
    body = request.get_json(force=True, silent=True) or {}
    contact_name = body.get("contact_name", "")
    contact_email = body.get("contact_email", "")
    answers = body.get("answers", {})

    db = get_db()
    link = db.share_links.find_one({"$where": f"this.token == '{token}'"})
    if not link:
        return jsonify({"error": "invalid link"}), 404

    result = db.submissions.insert_one(
        {
            "brd_id": link["brd_id"],
            "contact_name": contact_name,
            "contact_email": contact_email,
            "answers": answers,
            "created_at": datetime.datetime.utcnow(),
        }
    )
    return jsonify(
        {
            "submission_id": str(result.inserted_id),
            "message": "Thank you, your requirements were received.",
        }
    ), 201


@share_bp.route("/api/brds/<brd_id>/submissions", methods=["GET"])
@require_auth
def list_submissions(brd_id):
    db = get_db()
    rows = []
    for r in db.submissions.find({"brd_id": int(brd_id)}).sort("_id", -1):
        rows.append(
            {
                "contact_name": r.get("contact_name", ""),
                "contact_email": r.get("contact_email", ""),
                "answers": r.get("answers", {}),
                "created_at": r.get("created_at"),
            }
        )
    return jsonify(rows)
