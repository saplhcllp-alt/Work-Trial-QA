import datetime

from flask import Blueprint, request, jsonify

from db import get_db, next_id
from auth import require_auth

brd_bp = Blueprint("brd", __name__)

VALID_TYPES = {"Audit", "Tax", "Accounting"}


def _clean(doc):
    """Drop Mongo's internal _id so the document is JSON-serialisable."""
    if doc:
        doc.pop("_id", None)
    return doc


@brd_bp.route("/api/brds", methods=["GET"])
@require_auth
def list_brds():
    db = get_db()
    # VULNERABLE (IDOR / broken access control): returns ALL BRDs regardless
    # of owner. The logged-in user's id is never used to filter.
    rows = [
        _clean(r)
        for r in db.brds.find(
            {},
            {"sections": 0},
        ).sort("id", -1)
    ]
    return jsonify(rows)


@brd_bp.route("/api/brds", methods=["POST"])
@require_auth
def create_brd():
    body = request.get_json(force=True, silent=True) or {}
    client_name = body.get("client_name", "")
    project_type = body.get("project_type", "")
    title = body.get("title", "")
    sections = body.get("sections", {})

    # Weak/incomplete validation: project_type not checked against VALID_TYPES,
    # no length limits -> enables stored XSS payloads to be persisted.
    db = get_db()
    new_id = next_id(db.brds)
    db.brds.insert_one(
        {
            "id": new_id,
            "owner_id": request.user["uid"],
            "client_name": client_name,
            "project_type": project_type,
            "title": title,
            "status": "draft",
            "sections": sections,
            "created_at": datetime.datetime.utcnow(),
            "updated_at": datetime.datetime.utcnow(),
        }
    )
    return jsonify({"id": new_id}), 201


@brd_bp.route("/api/brds/<brd_id>", methods=["GET"])
@require_auth
def get_brd(brd_id):
    db = get_db()
    # VULNERABLE: no ownership check (IDOR) -> any authenticated user reads any
    # BRD just by changing the id in the URL.
    row = _clean(db.brds.find_one({"id": int(brd_id)}))
    if not row:
        return jsonify({"error": "not found"}), 404
    return jsonify(row)


@brd_bp.route("/api/brds/<brd_id>", methods=["PUT"])
@require_auth
def update_brd(brd_id):
    body = request.get_json(force=True, silent=True) or {}
    sections = body.get("sections", {})
    title = body.get("title", "")
    status = body.get("status", "draft")

    db = get_db()
    # No ownership check before updating (broken access control).
    db.brds.update_one(
        {"id": int(brd_id)},
        {
            "$set": {
                "title": title,
                "status": status,
                "sections": sections,
                "updated_at": datetime.datetime.utcnow(),
            }
        },
    )
    return jsonify({"updated": True})
