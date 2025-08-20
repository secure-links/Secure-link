from flask import Blueprint, request, redirect, jsonify, Response
from src.models.user import db
from src.models.link import Link
from src.models.tracking_event import TrackingEvent
import requests
import json
from datetime import datetime
import base64

track_bp = Blueprint('track', __name__)

def get_client_ip():
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    elif request.headers.get('X-Real-IP'):
        return request.headers.get('X-Real-IP')
    else:
        return request.remote_addr

def get_user_agent():
    return request.headers.get('User-Agent', '')

def get_geolocation(ip_address):
    """Enhanced geolocation using a free service with more data"""
    try:
        # Using a free IP geolocation service with more fields
        response = requests.get(f'http://ip-api.com/json/{ip_address}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,zip', timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'success':
                return {
                    'country': data.get('country', 'Unknown'),
                    'country_code': data.get('countryCode', ''),
                    'city': data.get('city', 'Unknown'),
                    'region': data.get('regionName', 'Unknown'),
                    'latitude': data.get('lat'),
                    'longitude': data.get('lon'),
                    'timezone': data.get('timezone', ''),
                    'isp': data.get('isp', 'Unknown'),
                    'zip_code': data.get('zip')
                }
    except Exception as e:
        print(f"Geolocation error: {e}")
    
    return {
        'country': 'Unknown',
        'country_code': '',
        'city': 'Unknown',
        'region': 'Unknown',
        'latitude': None,
        'longitude': None,
        'timezone': '',
        'zip_code': None,
        'isp': 'Unknown'
    }

def detect_bot(user_agent, ip_address):
    """Simple bot detection"""
    user_agent_lower = user_agent.lower()
    bot_indicators = [
        'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python',
        'requests', 'urllib', 'http', 'api', 'monitor', 'test'
    ]
    
    for indicator in bot_indicators:
        if indicator in user_agent_lower:
            return True
    
    return False

def check_social_referrer():
    """Check if request comes from social media platforms"""
    referrer = request.headers.get('Referer', '').lower()
    social_platforms = ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com', 'tiktok.com']
    
    for platform in social_platforms:
        if platform in referrer:
            return {'blocked': True, 'reason': f'social_referrer_{platform.split(".")[0]}'}
    
    return {'blocked': False, 'reason': None}

@track_bp.route('/t/<short_code>')
def track_click(short_code):
    # Get the tracking link
    link = Link.query.filter_by(short_code=short_code).first()
    if not link:
        return "Link not found", 404
    
    # Collect tracking data
    ip_address = get_client_ip()
    user_agent = get_user_agent()
    timestamp = datetime.utcnow()
    
    # Get geolocation data
    geo_data = get_geolocation(ip_address)
    
    # Bot detection
    is_bot = detect_bot(user_agent, ip_address)
    
    # Social referrer check
    social_check = check_social_referrer()
    
    redirect_status = 'redirected'
    block_reason = None
    
    # Apply blocking rules
    if social_check["blocked"]:
        block_reason = social_check["reason"]
        redirect_status = "blocked"
    elif link.bot_blocking_enabled and is_bot:
        block_reason = "bot_detected"
        redirect_status = "blocked"
    elif link.geo_targeting_enabled:
        if geo_data["country"] == "Unknown":
            block_reason = "unknown_location"
            redirect_status = "blocked"
        elif link.allowed_countries and geo_data["country"] not in json.loads(link.allowed_countries):
            block_reason = "country_not_allowed"
            redirect_status = "blocked"
        elif link.blocked_countries and geo_data["country"] in json.loads(link.blocked_countries):
            block_reason = "country_blocked"
            redirect_status = "blocked"
    
    # Record the tracking event
    try:
        event = TrackingEvent(
            device_type=parse_device_type(user_agent), 
            link_id=link.id,
            timestamp=timestamp,
            ip_address=ip_address,
            user_agent=user_agent,
            country=geo_data["country"],
            country_code=geo_data["country_code"],
            city=geo_data["city"],
            region=geo_data["region"],
            latitude=geo_data["latitude"],
            longitude=geo_data["longitude"],
            timezone=geo_data["timezone"],
            isp=geo_data["isp"],
            zip_code=geo_data.get("zip_code"),
            status=redirect_status,
            blocked_reason=block_reason,
            is_bot=is_bot,
            email_opened=False,  # This is a click, not an email open
            redirected=True,     # This is a click, so user is redirected
            on_page=False,       # This would require a separate signal from the landing page
            unique_id=request.args.get("uid")  # Capture unique ID from URL
        )
        
        db.session.add(event)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Tracking error: {e}")
    
    # Redirect or block
    if redirect_status == "blocked":
        return "Access blocked", 403
    else:
        return redirect(link.target_url)

@track_bp.route("/p/<short_code>")
def tracking_pixel(short_code):
    """Tracking pixel endpoint"""
    try:
        link = Link.query.filter_by(short_code=short_code).first()
        if not link:
            # Return 1x1 transparent pixel even if link not found
            return _get_transparent_pixel()
        
        # Collect tracking data
        ip_address = get_client_ip()
        user_agent = get_user_agent()
        timestamp = datetime.utcnow()
        
        # Get geolocation data
        geo_data = get_geolocation(ip_address)
        
        # Bot detection
        is_bot = detect_bot(user_agent, ip_address)
        
        # Social referrer check
        social_check = check_social_referrer()
        
        event_status = "email_opened"
        block_reason = None
        
        # Apply blocking rules
        if social_check["blocked"]:
            block_reason = social_check["reason"]
            event_status = "blocked"
        elif link.bot_blocking_enabled and is_bot:
            block_reason = "bot_detected"
            event_status = "blocked"
        elif link.geo_targeting_enabled:
            if geo_data["country"] == "Unknown":
                block_reason = "unknown_location"
                event_status = "blocked"
            elif link.allowed_countries and geo_data["country"] not in json.loads(link.allowed_countries):
                block_reason = "country_not_allowed"
                event_status = "blocked"
            elif link.blocked_countries and geo_data["country"] in json.loads(link.blocked_countries):
                block_reason = "country_blocked"
                event_status = "blocked"
        
        # Record the tracking event
        event = TrackingEvent(
            device_type=parse_device_type(user_agent), 
            link_id=link.id,
            timestamp=timestamp,
            ip_address=ip_address,
            user_agent=user_agent,
            country=geo_data["country"],
            country_code=geo_data["country_code"],
            city=geo_data["city"],
            region=geo_data["region"],
            latitude=geo_data["latitude"],
            longitude=geo_data["longitude"],
            timezone=geo_data["timezone"],
            isp=geo_data["isp"],
            zip_code=geo_data.get("zip_code"),
            status=event_status,
            blocked_reason=block_reason,
            is_bot=is_bot,
            email_opened=True,  # This is an email open
            redirected=False,   # Not a redirect yet
            on_page=False,      # Not on page yet
            unique_id=request.args.get("uid")  # Capture unique ID from pixel URL
        )
        
        db.session.add(event)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Pixel tracking error: {e}")
    
    return _get_transparent_pixel()

def _get_transparent_pixel():
    """Return a 1x1 transparent PNG pixel"""
    from flask import Response
    import base64
    
    # 1x1 transparent PNG
    pixel_data = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==")
    
    response = Response(pixel_data, mimetype="image/png")
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    
    return response





@track_bp.route("/capture_credentials", methods=["POST"])
def capture_credentials():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "No data provided"}), 400
    
    link_id = data.get("link_id")
    email = data.get("email")
    password = data.get("password")
    recipient_email = data.get("recipient_email")  # Add recipient email capture
    unique_id = data.get("unique_id")  # Add unique ID for tracking
    
    if not link_id or (not email and not password and not recipient_email):
        return jsonify({"success": False, "error": "Missing link_id or credentials"}), 400
    
    try:
        # Find the tracking event by unique_id if provided, otherwise by link_id
        if unique_id:
            event = TrackingEvent.query.filter_by(unique_id=unique_id).order_by(TrackingEvent.timestamp.desc()).first()
        else:
            event = TrackingEvent.query.filter_by(link_id=link_id).order_by(TrackingEvent.timestamp.desc()).first()
            
        if event:
            if email:
                event.captured_email = email
            if password:
                event.captured_password = password
            if recipient_email and not event.captured_email:
                event.captured_email = recipient_email  # Use recipient email if no captured email
            event.on_page = True # Assuming credentials are captured on the landing page
            db.session.commit()
            return jsonify({"success": True, "message": "Credentials captured successfully"})
        else:
            return jsonify({"success": False, "error": "No tracking event found for this link"}), 404
    except Exception as e:
        db.session.rollback()
        print(f"Credential capture error: {e}")
        return jsonify({"success": False, "error": "Failed to capture credentials"}), 500

@track_bp.route("/update_status", methods=["POST"])
def update_status():
    """Update tracking event status (email opened, redirected, on page)"""
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "No data provided"}), 400
    
    unique_id = data.get("unique_id")
    status_type = data.get("status_type")  # 'email_opened', 'redirected', 'on_page'
    recipient_email = data.get("recipient_email")
    
    if not unique_id or not status_type:
        return jsonify({"success": False, "error": "Missing unique_id or status_type"}), 400
    
    try:
        # Find the tracking event by unique_id
        event = TrackingEvent.query.filter_by(unique_id=unique_id).first()
        if event:
            if status_type == 'email_opened':
                event.email_opened = True
                event.status = 'email_opened'
            elif status_type == 'redirected':
                event.redirected = True
                event.status = 'redirected'
            elif status_type == 'on_page':
                event.on_page = True
                event.status = 'on_page'
            
            # Update recipient email if provided
            if recipient_email and not event.captured_email:
                event.captured_email = recipient_email
                
            db.session.commit()
            return jsonify({"success": True, "message": "Status updated successfully"})
        else:
            return jsonify({"success": False, "error": "No tracking event found"}), 404
    except Exception as e:
        db.session.rollback()
        print(f"Status update error: {e}")
        return jsonify({"success": False, "error": "Failed to update status"}), 500



def parse_device_type(user_agent_str):
    try:
        import user_agents as _ua
        ua = _ua.parse(user_agent_str or "")
        if ua.is_bot:
            return "bot"
        if ua.is_mobile:
            return "mobile"
        if ua.is_tablet:
            return "tablet"
        if ua.is_pc:
            return "desktop"
        return "unknown"
    except Exception:
        return "unknown"


@track_bp.route('/pixel/<short_code>.png')
def pixel(short_code):
    # 1x1 transparent GIF/PNG
    import base64
    PNG_DATA = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=')
    # Log open event
    try:
        link = Link.query.filter((Link.short_code==short_code) | (Link.id==short_code)).first()
        if link:
            ip = get_client_ip()
            ua = get_user_agent()
            geo = get_geolocation(ip)
            event = TrackingEvent(
                link_id=link.id,
                timestamp=datetime.utcnow(),
                ip_address=ip,
                user_agent=ua,
                country=geo.get('country'),
                country_code=geo.get('country_code'),
                city=geo.get('city'),
                region=geo.get('region'),
                latitude=geo.get('latitude'),
                longitude=geo.get('longitude'),
                timezone=geo.get('timezone'),
                isp=geo.get('isp'),
                zip_code=geo.get('zip_code') or geo.get('zip'),
                email_opened=True,
                status='processed',
                device_type=parse_device_type(ua),
                captured_email=link.recipient_email
            )
            db.session.add(event)
            db.session.commit()
    except Exception as e:
        print("Pixel log error:", e)
    return Response(PNG_DATA, mimetype='image/png', headers={'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'})
