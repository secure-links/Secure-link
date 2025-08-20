from flask import Blueprint, jsonify, session, request
from src.models.tracking_event import TrackingEvent
from src.models.link import Link
from src.models.user import db
from sqlalchemy import func, desc, and_
from datetime import datetime, timedelta
import json

security_bp = Blueprint("security", __name__)

@security_bp.route("/api/security/analytics", methods=["GET"])
def get_security_analytics():
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401

    try:
        timeframe = request.args.get('timeframe', '7d')
        
        # Calculate date range
        now = datetime.utcnow()
        if timeframe == '24h':
            start_date = now - timedelta(hours=24)
        elif timeframe == '7d':
            start_date = now - timedelta(days=7)
        elif timeframe == '30d':
            start_date = now - timedelta(days=30)
        elif timeframe == '90d':
            start_date = now - timedelta(days=90)
        else:
            start_date = now - timedelta(days=7)

        # Get user's links
        user_links = db.session.query(Link.id).filter(Link.user_id == session["user_id"]).subquery()

        # Overview statistics
        total_events = db.session.query(func.count(TrackingEvent.id)).filter(
            TrackingEvent.link_id.in_(user_links),
            TrackingEvent.timestamp >= start_date
        ).scalar() or 0

        blocked_attempts = db.session.query(func.count(TrackingEvent.id)).filter(
            TrackingEvent.link_id.in_(user_links),
            TrackingEvent.timestamp >= start_date,
            TrackingEvent.status == 'blocked'
        ).scalar() or 0

        data_captured = db.session.query(func.count(TrackingEvent.id)).filter(
            TrackingEvent.link_id.in_(user_links),
            TrackingEvent.timestamp >= start_date,
            TrackingEvent.captured_email.isnot(None)
        ).scalar() or 0

        unique_ips = db.session.query(func.count(func.distinct(TrackingEvent.ip_address))).filter(
            TrackingEvent.link_id.in_(user_links),
            TrackingEvent.timestamp >= start_date
        ).scalar() or 0

        bot_blocked = db.session.query(func.count(TrackingEvent.id)).filter(
            TrackingEvent.link_id.in_(user_links),
            TrackingEvent.timestamp >= start_date,
            TrackingEvent.is_bot == True
        ).scalar() or 0

        # Calculate rates
        blocking_rate = (blocked_attempts / total_events * 100) if total_events > 0 else 0
        capture_rate = (data_captured / total_events * 100) if total_events > 0 else 0

        # Determine threat level
        if blocking_rate < 5:
            threat_level = "Minimal"
        elif blocking_rate < 15:
            threat_level = "Low"
        elif blocking_rate < 30:
            threat_level = "Medium"
        elif blocking_rate < 50:
            threat_level = "High"
        else:
            threat_level = "Critical"

        # Threat trend data (daily for the timeframe)
        threat_trend = []
        for i in range(min(int((now - start_date).days), 30)):  # Limit to 30 days max
            day_start = start_date + timedelta(days=i)
            day_end = day_start + timedelta(days=1)
            
            daily_threats = db.session.query(func.count(TrackingEvent.id)).filter(
                TrackingEvent.link_id.in_(user_links),
                TrackingEvent.timestamp >= day_start,
                TrackingEvent.timestamp < day_end,
                TrackingEvent.status == 'blocked'
            ).scalar() or 0
            
            daily_blocked = daily_threats  # All threats are blocked in this context
            
            threat_trend.append({
                'date': day_start.strftime('%Y-%m-%d'),
                'threats': daily_threats,
                'blocked': daily_blocked
            })

        # Threat types distribution
        threat_types = []
        
        # Bot threats
        bot_threats = db.session.query(func.count(TrackingEvent.id)).filter(
            TrackingEvent.link_id.in_(user_links),
            TrackingEvent.timestamp >= start_date,
            TrackingEvent.is_bot == True
        ).scalar() or 0
        
        # Geo violations
        geo_violations = db.session.query(func.count(TrackingEvent.id)).filter(
            TrackingEvent.link_id.in_(user_links),
            TrackingEvent.timestamp >= start_date,
            TrackingEvent.blocked_reason.like('%country%')
        ).scalar() or 0
        
        # Social referrer blocks
        social_blocks = db.session.query(func.count(TrackingEvent.id)).filter(
            TrackingEvent.link_id.in_(user_links),
            TrackingEvent.timestamp >= start_date,
            TrackingEvent.blocked_reason.like('%social%')
        ).scalar() or 0
        
        # Unknown location blocks
        unknown_location = db.session.query(func.count(TrackingEvent.id)).filter(
            TrackingEvent.link_id.in_(user_links),
            TrackingEvent.timestamp >= start_date,
            TrackingEvent.blocked_reason == 'unknown_location'
        ).scalar() or 0
        
        # Other blocks
        other_blocks = blocked_attempts - (bot_threats + geo_violations + social_blocks + unknown_location)
        
        if blocked_attempts > 0:
            threat_types = [
                {"name": "Automated Bots", "value": bot_threats, "color": "#ef4444"},
                {"name": "Geo Violations", "value": geo_violations, "color": "#8b5cf6"},
                {"name": "Social Referrers", "value": social_blocks, "color": "#f59e0b"},
                {"name": "Unknown Location", "value": unknown_location, "color": "#06b6d4"},
                {"name": "Other", "value": max(0, other_blocks), "color": "#6b7280"}
            ]
        else:
            threat_types = [
                {"name": "No Threats", "value": 1, "color": "#10b981"}
            ]

        # Protection features status
        total_links = db.session.query(func.count(Link.id)).filter(Link.user_id == session["user_id"]).scalar() or 0
        
        bot_enabled_links = db.session.query(func.count(Link.id)).filter(
            Link.user_id == session["user_id"],
            Link.bot_blocking_enabled == True
        ).scalar() or 0
        
        geo_enabled_links = db.session.query(func.count(Link.id)).filter(
            Link.user_id == session["user_id"],
            Link.geo_targeting_enabled == True
        ).scalar() or 0
        
        # Email capture is always enabled if links exist
        email_enabled_links = total_links
        
        # Password capture (assuming it's a feature that can be enabled)
        password_enabled_links = 0  # This would need to be tracked in the Link model
        
        protection_features = [
            {
                "name": "Bot Blocking",
                "enabled": bot_enabled_links > 0,
                "linksEnabled": bot_enabled_links,
                "totalLinks": total_links,
                "detectionRate": (bot_threats / total_events * 100) if total_events > 0 else 0,
                "status": "active" if bot_enabled_links > 0 else "disabled"
            },
            {
                "name": "Geo Targeting",
                "enabled": geo_enabled_links > 0,
                "linksEnabled": geo_enabled_links,
                "totalLinks": total_links,
                "detectionRate": (geo_violations / total_events * 100) if total_events > 0 else 0,
                "status": "active" if geo_enabled_links > 0 else "disabled"
            },
            {
                "name": "Email Capture",
                "enabled": True,
                "linksEnabled": email_enabled_links,
                "totalLinks": total_links,
                "detectionRate": capture_rate,
                "status": "active"
            },
            {
                "name": "Password Capture",
                "enabled": False,
                "linksEnabled": password_enabled_links,
                "totalLinks": total_links,
                "detectionRate": 0,
                "status": "disabled"
            }
        ]

        # High risk IPs
        high_risk_ips = db.session.query(
            TrackingEvent.ip_address,
            TrackingEvent.country,
            func.count(TrackingEvent.id).label('attempts'),
            func.max(TrackingEvent.timestamp).label('last_seen')
        ).filter(
            TrackingEvent.link_id.in_(user_links),
            TrackingEvent.timestamp >= start_date,
            TrackingEvent.status == 'blocked'
        ).group_by(
            TrackingEvent.ip_address,
            TrackingEvent.country
        ).order_by(
            desc('attempts')
        ).limit(10).all()

        high_risk_ip_list = []
        for ip_data in high_risk_ips:
            ip, country, attempts, last_seen = ip_data
            
            # Calculate time since last seen
            time_diff = now - last_seen
            if time_diff.days > 0:
                last_seen_str = f"{time_diff.days} day{'s' if time_diff.days > 1 else ''} ago"
            elif time_diff.seconds > 3600:
                hours = time_diff.seconds // 3600
                last_seen_str = f"{hours} hour{'s' if hours > 1 else ''} ago"
            else:
                minutes = time_diff.seconds // 60
                last_seen_str = f"{minutes} minute{'s' if minutes > 1 else ''} ago"
            
            # Determine risk level
            if attempts >= 10:
                risk = "High"
            elif attempts >= 5:
                risk = "Medium"
            else:
                risk = "Low"
            
            high_risk_ip_list.append({
                "ip": ip,
                "country": country or "Unknown",
                "attempts": attempts,
                "lastSeen": last_seen_str,
                "risk": risk
            })

        return jsonify({
            "success": True,
            "overview": {
                "threatLevel": threat_level,
                "totalEvents": total_events,
                "blockedAttempts": blocked_attempts,
                "dataCaptured": data_captured,
                "uniqueIPs": unique_ips,
                "blockingRate": round(blocking_rate, 1),
                "captureRate": round(capture_rate, 1)
            },
            "threatTrend": threat_trend,
            "protectionFeatures": protection_features,
            "threatTypes": threat_types,
            "highRiskIPs": high_risk_ip_list
        })

    except Exception as e:
        print(f"Error fetching security analytics: {e}")
        return jsonify({"error": "Failed to fetch security analytics"}), 500

