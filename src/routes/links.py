from flask import Blueprint, jsonify, session
from src.models.link import Link
from src.models.tracking_event import TrackingEvent
from src.models.user import db

links_bp = Blueprint('links', __name__)

def require_auth():
    return 'user_id' in session

@links_bp.route("/link-stats", methods=["GET"])
def get_link_stats():
    if not require_auth():
        return jsonify({"error": "Authentication required"}), 401

    user_id = session["user_id"]
    
    total_clicks = db.session.query(db.func.sum(Link.click_count)).filter_by(user_id=user_id).scalar() or 0
    real_visitors = db.session.query(db.func.count(db.func.distinct(TrackingEvent.ip_address))).filter(TrackingEvent.link_id.in_([link.id for link in Link.query.filter_by(user_id=user_id).all()]), TrackingEvent.is_bot == False).scalar() or 0
    bot_blocked = db.session.query(db.func.count(TrackingEvent.id)).filter(TrackingEvent.link_id.in_([link.id for link in Link.query.filter_by(user_id=user_id).all()]), TrackingEvent.is_bot == True).scalar() or 0

    return jsonify({
        "success": True,
        "total_clicks": total_clicks,
        "real_visitors": real_visitors,
        "bot_blocked": bot_blocked,
    })

