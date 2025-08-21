from flask import Blueprint, request, jsonify
from src.models.fixed_user import db, TrackingEvent, Link
from src.utils.auth import login_required
from sqlalchemy import desc, and_, func
from datetime import datetime, timedelta

security_bp = Blueprint('security', __name__)

@security_bp.route('/stats', methods=['GET'])
@login_required
def get_security_stats():
    """Get security statistics and threat overview"""
    try:
        user = request.current_user
        
        # Get time range
        days = request.args.get('days', 7, type=int)
        since = datetime.utcnow() - timedelta(days=days)
        
        # Base query for user's events
        base_query = db.session.query(TrackingEvent).join(Link).filter(
            and_(
                Link.user_id == user.id,
                TrackingEvent.timestamp >= since
            )
        )
        
        # Security metrics
        total_requests = base_query.count()
        blocked_requests = base_query.filter(TrackingEvent.is_blocked == True).count()
        bot_requests = base_query.filter(TrackingEvent.is_bot == True).count()
        legitimate_requests = total_requests - blocked_requests - bot_requests
        
        # Threat level calculation
        if total_requests == 0:
            threat_level = 'Low'
            threat_score = 0
        else:
            threat_percentage = (blocked_requests + bot_requests) / total_requests * 100
            if threat_percentage > 50:
                threat_level = 'High'
                threat_score = min(100, threat_percentage)
            elif threat_percentage > 20:
                threat_level = 'Medium'
                threat_score = threat_percentage
            else:
                threat_level = 'Low'
                threat_score = threat_percentage
        
        # Top threatening IPs
        threat_ips = db.session.query(
            TrackingEvent.ip_address,
            TrackingEvent.country_name,
            func.count(TrackingEvent.id).label('attempts'),
            func.sum(case((TrackingEvent.is_blocked == True, 1), else_=0)).label('blocked'),
            func.sum(case((TrackingEvent.is_bot == True, 1), else_=0)).label('bot_attempts')
        ).join(Link).filter(
            and_(
                Link.user_id == user.id,
                TrackingEvent.timestamp >= since,
                or_(TrackingEvent.is_blocked == True, TrackingEvent.is_bot == True)
            )
        ).group_by(
            TrackingEvent.ip_address,
            TrackingEvent.country_name
        ).order_by(desc('attempts')).limit(10).all()
        
        return jsonify({
            'total_requests': total_requests,
            'blocked_requests': blocked_requests,
            'bot_requests': bot_requests,
            'legitimate_requests': legitimate_requests,
            'threat_level': threat_level,
            'threat_score': round(threat_score, 1),
            'block_rate': round((blocked_requests / total_requests * 100), 1) if total_requests > 0 else 0,
            'bot_rate': round((bot_requests / total_requests * 100), 1) if total_requests > 0 else 0,
            'threatening_ips': [
                {
                    'ip_address': ip.ip_address,
                    'country': ip.country_name or 'Unknown',
                    'total_attempts': ip.attempts,
                    'blocked_attempts': ip.blocked,
                    'bot_attempts': ip.bot_attempts
                }
                for ip in threat_ips
            ],
            'period_days': days
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@security_bp.route('/threats', methods=['GET'])
@login_required
def get_threats():
    """Get detailed threat information"""
    try:
        user = request.current_user
        
        # Get recent threats (last 24 hours)
        since = datetime.utcnow() - timedelta(hours=24)
        
        threats = db.session.query(TrackingEvent).join(Link).filter(
            and_(
                Link.user_id == user.id,
                TrackingEvent.timestamp >= since,
                or_(TrackingEvent.is_blocked == True, TrackingEvent.is_bot == True)
            )
        ).order_by(desc(TrackingEvent.timestamp)).limit(100).all()
        
        return jsonify([
            {
                'id': threat.id,
                'timestamp': threat.timestamp.isoformat(),
                'ip_address': threat.ip_address,
                'country': threat.country_name or 'Unknown',
                'city': threat.city or 'Unknown',
                'user_agent': threat.user_agent,
                'is_bot': threat.is_bot,
                'is_blocked': threat.is_blocked,
                'link_title': threat.link.title or threat.link.short_code,
                'threat_type': 'Bot' if threat.is_bot else 'Blocked'
            }
            for threat in threats
        ])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

