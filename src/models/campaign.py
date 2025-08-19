from .user import db
from datetime import datetime
import json

class Campaign(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), default='active')  # active, paused, completed, draft
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    start_date = db.Column(db.DateTime, nullable=True)
    end_date = db.Column(db.DateTime, nullable=True)
    
    # Relationship to links
    links = db.relationship('Link', backref='campaign', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f"<Campaign {self.name}>"

    def get_analytics(self):
        """Calculate campaign analytics from associated links and events"""
        from .link import Link
        from .tracking_event import TrackingEvent
        
        # Get all links for this campaign
        campaign_links = Link.query.filter_by(campaign_id=self.id).all()
        
        total_clicks = sum(link.total_clicks for link in campaign_links)
        real_visitors = sum(link.real_visitors for link in campaign_links)
        blocked_attempts = sum(link.blocked_attempts for link in campaign_links)
        
        # Get captured emails count
        captured_emails = db.session.query(TrackingEvent).join(Link).filter(
            Link.campaign_id == self.id,
            TrackingEvent.captured_email.isnot(None),
            TrackingEvent.captured_email != ''
        ).count()
        
        # Get email opens count
        email_opens = db.session.query(TrackingEvent).join(Link).filter(
            Link.campaign_id == self.id,
            TrackingEvent.email_opened == True
        ).count()
        
        # Calculate conversion rate
        conversion_rate = (captured_emails / total_clicks * 100) if total_clicks > 0 else 0
        
        return {
            'total_clicks': total_clicks,
            'real_visitors': real_visitors,
            'blocked_attempts': blocked_attempts,
            'captured_emails': captured_emails,
            'email_opens': email_opens,
            'conversion_rate': round(conversion_rate, 2),
            'total_links': len(campaign_links)
        }

    def to_dict(self):
        analytics = self.get_analytics()
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "description": self.description,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "analytics": analytics,
            "links": [link.to_dict() for link in self.links]
        }

