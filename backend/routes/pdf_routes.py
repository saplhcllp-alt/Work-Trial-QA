import io

from flask import Blueprint, send_file, jsonify
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

from db import get_db
from auth import require_auth

pdf_bp = Blueprint("pdf", __name__)


@pdf_bp.route("/api/brds/<brd_id>/pdf", methods=["GET"])
@require_auth
def brd_pdf(brd_id):
    db = get_db()
    # No ownership check (broken access control) -- any BRD id is exportable.
    brd = db.brds.find_one({"id": int(brd_id)})
    if not brd:
        return jsonify({"error": "not found"}), 404

    submissions = list(
        db.submissions.find({"brd_id": int(brd_id)}).sort("_id", -1)
    )

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4
    y = height - 25 * mm

    c.setFont("Helvetica-Bold", 16)
    c.drawString(20 * mm, y, "Harshwal & Company LLP")
    y -= 8 * mm
    c.setFont("Helvetica", 12)
    c.drawString(20 * mm, y, "Business Requirements Document")
    y -= 12 * mm

    c.setFont("Helvetica-Bold", 11)
    for label, value in [
        ("Client", brd.get("client_name", "")),
        ("Project Type", brd.get("project_type", "")),
        ("Title", brd.get("title", "")),
        ("Status", brd.get("status", "")),
    ]:
        c.drawString(20 * mm, y, f"{label}:")
        c.setFont("Helvetica", 11)
        c.drawString(55 * mm, y, str(value))
        c.setFont("Helvetica-Bold", 11)
        y -= 7 * mm

    y -= 4 * mm
    c.setFont("Helvetica-Bold", 12)
    c.drawString(20 * mm, y, "Sections")
    y -= 7 * mm
    c.setFont("Helvetica", 10)
    for key, val in (brd.get("sections") or {}).items():
        c.drawString(22 * mm, y, f"- {key}: {str(val)[:90]}")
        y -= 6 * mm
        if y < 30 * mm:
            c.showPage()
            y = height - 25 * mm

    y -= 4 * mm
    c.setFont("Helvetica-Bold", 12)
    c.drawString(20 * mm, y, "Client Submissions")
    y -= 7 * mm
    c.setFont("Helvetica", 10)
    for sub in submissions:
        c.drawString(
            22 * mm, y, f"{sub.get('contact_name', '')} <{sub.get('contact_email', '')}>"
        )
        y -= 6 * mm
        for key, val in (sub.get("answers") or {}).items():
            c.drawString(26 * mm, y, f"- {key}: {str(val)[:80]}")
            y -= 6 * mm
            if y < 30 * mm:
                c.showPage()
                y = height - 25 * mm

    c.showPage()
    c.save()
    buf.seek(0)
    return send_file(
        buf,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"BRD-{brd_id}.pdf",
    )
