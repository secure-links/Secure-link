from flask import Blueprint, jsonify, session, request
from src.models.tracking_event import TrackingEvent
from src.models.link import Link
from src.models.user import db
from sqlalchemy import desc, and_
from datetime import datetime, timedelta
import user_agents

live_activity_bp = Blueprint("live_activity", __name__)

@live_activity_bp.route("/api/live-activity", methods=["GET"])
def get_live_activity():
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401

    try:
        # Get query parameters
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        event_type = request.args.get('type', 'all')
        
        # Get user's links
        user_links = db.session.query(Link.id).filter(Link.user_id == session["user_id"]).subquery()

        # Base query
        query = db.session.query(TrackingEvent).filter(
            TrackingEvent.link_id.in_(user_links)
        )

        # Apply filters
        if event_type != 'all':
            if event_type == 'click':
                query = query.filter(TrackingEvent.redirected == True)
            elif event_type == 'email_open':
                query = query.filter(TrackingEvent.email_opened == True)
            elif event_type == 'blocked':
                query = query.filter(TrackingEvent.status == 'blocked')
            elif event_type == 'bot':
                query = query.filter(TrackingEvent.is_bot == True)

        # Get events with pagination
        events = query.order_by(desc(TrackingEvent.timestamp)).offset(offset).limit(limit).all()

        # Format events for frontend
        formatted_events = []
        for event in events:
            # Parse user agent for device info
            device_info = parse_user_agent(event.user_agent)
            
            # Determine event type
            if event.status == 'blocked':
                event_type = 'blocked'
            elif event.is_bot:
                event_type = 'bot'
            elif event.email_opened and not event.redirected:
                event_type = 'email_open'
            elif event.redirected:
                event_type = 'click'
            else:
                event_type = 'unknown'
            
            # Determine detailed status
            if event.status == 'blocked':
                detailed_status = f"Blocked ({event.blocked_reason or 'Unknown reason'})"
            elif event.on_page:
                detailed_status = "On Page"
            elif event.redirected:
                detailed_status = "Redirected"
            elif event.email_opened:
                detailed_status = "Email Opened"
            else:
                detailed_status = "Processed"
            
            # Calculate threat level
            threat_level = calculate_threat_level(event)
            
            formatted_event = {
                "id": event.id,
                "timestamp": event.timestamp.isoformat() if event.timestamp else None,
                "tracking_id": event.unique_id or f"evt_{event.id}",
                "ip_address": event.ip_address,
                "recipient_email": event.captured_email,  # This would be the target email
                "email": event.captured_email,
                "zip_code": getattr(event, "zip_code", None),
                "captured_email": event.captured_email,
                "country": event.country,
                "country_code": event.country_code,
                "city": event.city,
                "region": event.region,
                "latitude": event.latitude,
                "longitude": event.longitude,
                "timezone": event.timezone,
                "isp": event.isp,
                "device_type": device_info['device_type'],
                "browser": device_info['browser'],
                "browser_version": device_info['browser_version'],
                "operating_system": device_info['os'],
                "user_agent": event.user_agent,
                "status": event.status,
                "event_type": event_type,
                "detailed_status": detailed_status,
                "email_opened": event.email_opened,
                "redirected": event.redirected,
                "on_page": event.on_page,
                "is_bot": event.is_bot,
                "bot_score": calculate_bot_score(event),
                "threat_level": threat_level,
                "blocked_reason": event.blocked_reason
            }
            formatted_events.append(formatted_event)

        # Get total count for pagination
        total_count = query.count()

        return jsonify({
            "success": True,
            "events": formatted_events,
            "total": total_count,
            "has_more": (offset + limit) < total_count
        })

    except Exception as e:
        print(f"Error fetching live activity: {e}")
        return jsonify({"error": "Failed to fetch live activity"}), 500

def parse_user_agent(user_agent_string):
    """Parse user agent string to extract device information"""
    if not user_agent_string:
        return {
            'device_type': 'Unknown',
            'browser': 'Unknown',
            'browser_version': 'Unknown',
            'os': 'Unknown'
        }
    
    try:
        ua = user_agents.parse(user_agent_string)
        
        # Determine device type
        if ua.is_mobile:
            device_type = 'Mobile'
        elif ua.is_tablet:
            device_type = 'Tablet'
        elif ua.is_pc:
            device_type = 'Desktop'
        else:
            device_type = 'Unknown'
        
        return {
            'device_type': device_type,
            'browser': ua.browser.family,
            'browser_version': ua.browser.version_string,
            'os': f"{ua.os.family} {ua.os.version_string}".strip()
        }
    except:
        return {
            'device_type': 'Unknown',
            'browser': 'Unknown',
            'browser_version': 'Unknown',
            'os': 'Unknown'
        }

def calculate_bot_score(event):
    """Calculate a bot probability score"""
    score = 0.0
    
    if event.is_bot:
        score += 0.8
    
    # Check user agent for bot indicators
    if event.user_agent:
        ua_lower = event.user_agent.lower()
        bot_indicators = ['bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python']
        for indicator in bot_indicators:
            if indicator in ua_lower:
                score += 0.2
                break
    
    # Check for suspicious patterns
    if event.status == 'blocked':
        score += 0.3
    
    return min(1.0, score)

def calculate_threat_level(event):
    """Calculate threat level based on event characteristics"""
    if event.status == 'blocked':
        return 'high'
    elif event.is_bot:
        return 'medium'
    elif event.blocked_reason:
        return 'medium'
    else:
        return 'low'

@live_activity_bp.route("/api/live-activity/stats", methods=["GET"])
def get_activity_stats():
    """Get real-time activity statistics"""
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401

    try:
        # Get user's links
        user_links = db.session.query(Link.id).filter(Link.user_id == session["user_id"]).subquery()
        
        # Get stats for the last 24 hours
        last_24h = datetime.utcnow() - timedelta(hours=24)
        
        total_events = db.session.query(TrackingEvent).filter(
            TrackingEvent.link_id.in_(user_links),
            TrackingEvent.timestamp >= last_24h
        ).count()
        
        email_opens = db.session.query(TrackingEvent).filter(
            TrackingEvent.link_id.in_(user_links),
            TrackingEvent.timestamp >= last_24h,
            TrackingEvent.email_opened == True
        ).count()
        
        clicks = db.session.query(TrackingEvent).filter(
            TrackingEvent.link_id.in_(user_links),
            TrackingEvent.timestamp >= last_24h,
            TrackingEvent.redirected == True
        ).count()
        
        blocked = db.session.query(TrackingEvent).filter(
            TrackingEvent.link_id.in_(user_links),
            TrackingEvent.timestamp >= last_24h,
            TrackingEvent.status == 'blocked'
        ).count()
        
        bots = db.session.query(TrackingEvent).filter(
            TrackingEvent.link_id.in_(user_links),
            TrackingEvent.timestamp >= last_24h,
            TrackingEvent.is_bot == True
        ).count()

        return jsonify({
            "success": True,
            "stats": {
                "total_events": total_events,
                "email_opens": email_opens,
                "clicks": clicks,
                "blocked": blocked,
                "bots": bots
            }
        })

    except Exception as e:
        print(f"Error fetching activity stats: {e}")
        return jsonify({"error": "Failed to fetch activity stats"}), 500

