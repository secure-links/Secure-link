from flask import Blueprint, request, make_response
from src.models.fixed_user import db, Link, TrackingEvent
from src.utils.security import (
    get_geolocation, parse_user_agent_details, get_client_ip
)
from datetime import datetime
import base64

pixel_bp = Blueprint('pixel', __name__)

# 1x1 transparent pixel image data
PIXEL_DATA = base64.b64decode(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAHGbK7bKgAAAABJRU5ErkJggg=='
)

@pixel_bp.route('/<short_code>')
def track_pixel(short_code):
    """Handle pixel tracking"""
    try:
        # Find the link
        link = Link.query.filter_by(short_code=short_code).first()
        if not link:
            # Return pixel even if link not found to avoid detection
            response = make_response(PIXEL_DATA)
            response.headers['Content-Type'] = 'image/png'
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response.headers['Pragma'] = 'no-cache'
            response.headers['Expires'] = '0'
            return response
        
        # Get request information
        user_agent = request.headers.get('User-Agent', '')
        referer = request.headers.get('Referer', '')
        ip_address = get_client_ip(request)
        recipient_id = request.args.get('uid', '')  # Email tracking
        
        # Parse user agent details
        ua_details = parse_user_agent_details(user_agent)
        
        # Get geolocation
        geo_info = get_geolocation(ip_address)
        
        # Create tracking event
        tracking_event = TrackingEvent(
            link_id=link.id,
            event_type='pixel',
            ip_address=ip_address,
            user_agent=user_agent,
            referer=referer,
            country=geo_info['country'],
            country_code=geo_info['country_code'],
            city=geo_info['city'],
            region=geo_info.get("region", ""),
            zip_code=geo_info.get("zip_code", ""),
            isp=geo_info.get("isp", ""),
            is_bot=False,  # Pixels are usually not accessed by bots
            is_blocked=False,
            device_type=ua_details['device_type'],
            browser=ua_details['browser'],
            os=ua_details['os'],
            status='pixel_loaded',
            captured_email=recipient_id if recipient_id else None
        )
        
        # Update link statistics
        link.total_clicks += 1
        link.real_visitors += 1
        
        db.session.add(tracking_event)
        db.session.commit()
        
        # Return 1x1 transparent pixel
        response = make_response(PIXEL_DATA)
        response.headers['Content-Type'] = 'image/png'
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response
        
    except Exception as e:
        print(f"Pixel tracking error: {e}")
        # Always return pixel to avoid detection
        response = make_response(PIXEL_DATA)
        response.headers['Content-Type'] = 'image/png'
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response

