from flask import Blueprint, jsonify, session
from src.models.tracking_event import TrackingEvent
from src.models.link import Link
from src.models.user import db
from sqlalchemy import func

analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.route("/api/geo-analytics", methods=["GET"])
def get_geo_analytics():
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401

    try:
        # Aggregate data by country
        country_data = (
            db.session.query(
                TrackingEvent.country,
                TrackingEvent.country_code,
                func.count(TrackingEvent.id).label("total_visits"),
                func.count(func.distinct(TrackingEvent.ip_address)).label("unique_visits"),
                func.sum(func.case([(TrackingEvent.captured_email.isnot(None), 1)], else_=0)).label("captured_emails"),
            )
            .join(Link).filter(Link.user_id == session["user_id"])
            .group_by(TrackingEvent.country, TrackingEvent.country_code)
            .all()
        )

        # Aggregate data by city
        city_data = (
            db.session.query(
                TrackingEvent.city,
                TrackingEvent.country,
                func.count(TrackingEvent.id).label("visits"),
                func.count(func.distinct(TrackingEvent.ip_address)).label("unique_visits"),
            )
            .join(Link).filter(Link.user_id == session["user_id"])
            .group_by(TrackingEvent.city, TrackingEvent.country)
            .all()
        )

        # Format data for the frontend
        countries = [
            {
                "country": country,
                "country_code": country_code or "",
                "total_visits": total_visits,
                "unique_visits": unique_visits,
                "captured_emails": captured_emails,
                "conversion_rate": (captured_emails / total_visits) * 100 if total_visits > 0 else 0,
            }
            for country, country_code, total_visits, unique_visits, captured_emails in country_data
        ]

        cities = [
            {
                "city": city,
                "country": country,
                "visits": visits,
                "unique_visits": unique_visits,
            }
            for city, country, visits, unique_visits in city_data
        ]

        return jsonify({
            "success": True,
            "countries": countries,
            "cities": cities,
        })

    except Exception as e:
        print(f"Error fetching geo analytics: {e}")
        return jsonify({"error": "Failed to fetch geo analytics"}), 500


@analytics_bp.route("/api/link-stats", methods=["GET"])
def get_link_stats():
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401

    try:
        # Get overall link statistics
        total_clicks = db.session.query(func.count(TrackingEvent.id)).join(Link).filter(Link.user_id == session["user_id"]).scalar() or 0

        real_visitors = db.session.query(func.count(func.distinct(TrackingEvent.ip_address))).join(Link).filter(Link.user_id == session["user_id"], TrackingEvent.is_bot == False).scalar() or 0

        bot_blocked = db.session.query(func.count(TrackingEvent.id)).join(Link).filter(Link.user_id == session["user_id"], TrackingEvent.is_bot == True).scalar() or 0

        return jsonify({
            "total_clicks": total_clicks,
            "real_visitors": real_visitors,
            "bot_blocked": bot_blocked,
        })

    except Exception as e:
        print(f"Error fetching link stats: {e}")
        return jsonify({"error": "Failed to fetch link stats"}), 500



