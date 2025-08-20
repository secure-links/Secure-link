from flask import Blueprint, jsonify, session
from src.models.tracking_event import TrackingEvent
from src.models.link import Link
from src.models.user import db
from sqlalchemy import func

security_analytics_bp = Blueprint("security_analytics", __name__)

@security_analytics_bp.route("/api/security-analytics", methods=["GET"])
def security_analytics():
    if "user_id" not in session:
        return jsonify({"success": False, "error": "Not authenticated"}), 401
    try:
        # Counts by status
        total = db.session.query(func.count(TrackingEvent.id)).join(Link).filter(Link.user_id == session["user_id"]).scalar() or 0
        blocked = db.session.query(func.count(TrackingEvent.id)).join(Link).filter(Link.user_id == session["user_id"], TrackingEvent.status == "blocked").scalar() or 0
        suspected_bots = db.session.query(func.count(TrackingEvent.id)).join(Link).filter(Link.user_id == session["user_id"], TrackingEvent.is_bot == True).scalar() or 0
        reasons = dict(db.session.query(TrackingEvent.blocked_reason, func.count(TrackingEvent.id))
                       .join(Link).filter(Link.user_id == session["user_id"])
                       .group_by(TrackingEvent.blocked_reason).all())
        # Top ISPs
        top_isps = [{"isp": isp or "Unknown", "count": int(c)} for isp, c in db.session.query(TrackingEvent.isp, func.count(TrackingEvent.id))
                    .join(Link).filter(Link.user_id == session["user_id"]).group_by(TrackingEvent.isp).order_by(func.count(TrackingEvent.id).desc()).limit(10).all()]
        return jsonify({"success": True, "total": total, "blocked": blocked, "suspected_bots": suspected_bots, "blocked_reasons": reasons, "top_isps": top_isps})
    except Exception as e:
        print(f"security-analytics error: {e}")
        return jsonify({"success": False, "error": "Failed to fetch security analytics"}), 500
