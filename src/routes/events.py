from flask import Blueprint, request, jsonify
from src.models.fixed_user import db, TrackingEvent, Link
from src.utils.auth import login_required
from sqlalchemy import desc, and_, or_
from datetime import datetime, timedelta

events_bp = Blueprint('events', __name__)

@events_bp.route('/live', methods=['GET'])
@login_required
def get_live_events():
    """Get live tracking events for the authenticated user"""
    try:
        user = request.current_user
        
        # Get query parameters
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        status_filter = request.args.get('status')
        country_filter = request.args.get('country')
        campaign_filter = request.args.get('campaign', type=int)
        
        # Base query - get events for user's links
        query = db.session.query(TrackingEvent).join(Link).filter(
            Link.user_id == user.id
        )
        
        # Apply filters
        if status_filter:
            query = query.filter(TrackingEvent.status == status_filter)
        
        if country_filter:
            query = query.filter(TrackingEvent.country == country_filter)
        
        if campaign_filter:
            query = query.filter(Link.campaign_id == campaign_filter)
        
        # Order by timestamp descending (most recent first)
        query = query.order_by(desc(TrackingEvent.timestamp))
        
        # Apply pagination
        events = query.offset(offset).limit(limit).all()
        
        # Get total count for pagination
        total_count = query.count()
        
        return jsonify({
            'events': [event.to_dict() for event in events],
            'total': total_count,
            'limit': limit,
            'offset': offset
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@events_bp.route('/history', methods=['GET'])
@login_required
def get_event_history():
    """Get historical tracking events with date range filtering"""
    try:
        user = request.current_user
        
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        link_id = request.args.get('link_id', type=int)
        
        # Base query
        query = db.session.query(TrackingEvent).join(Link).filter(
            Link.user_id == user.id
        )
        
        # Apply date filters
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query = query.filter(TrackingEvent.timestamp >= start_dt)
            except ValueError:
                return jsonify({'error': 'Invalid start_date format'}), 400
        
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                query = query.filter(TrackingEvent.timestamp <= end_dt)
            except ValueError:
                return jsonify({'error': 'Invalid end_date format'}), 400
        
        # Filter by specific link
        if link_id:
            query = query.filter(TrackingEvent.link_id == link_id)
        
        # Order by timestamp
        events = query.order_by(desc(TrackingEvent.timestamp)).all()
        
        return jsonify([event.to_dict() for event in events])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@events_bp.route('/stats', methods=['GET'])
@login_required
def get_event_stats():
    """Get real-time statistics for events"""
    try:
        user = request.current_user
        
        # Get time range (default to last 24 hours)
        hours = request.args.get('hours', 24, type=int)
        since = datetime.utcnow() - timedelta(hours=hours)
        
        # Base query for user's events
        base_query = db.session.query(TrackingEvent).join(Link).filter(
            and_(
                Link.user_id == user.id,
                TrackingEvent.timestamp >= since
            )
        )
        
        # Total events
        total_events = base_query.count()
        
        # Events by status
        status_stats = {}
        for status in ['Open', 'Redirected', 'On Page']:
            count = base_query.filter(TrackingEvent.status == status).count()
            status_stats[status] = count
        
        # Unique visitors (by IP)
        unique_visitors = base_query.distinct(TrackingEvent.ip_address).count()
        
        # Bot vs real traffic
        bot_traffic = base_query.filter(TrackingEvent.is_bot == True).count()
        real_traffic = total_events - bot_traffic
        
        # Blocked attempts
        blocked_attempts = base_query.filter(TrackingEvent.is_blocked == True).count()
        
        # Top countries
        country_stats = db.session.query(
            TrackingEvent.country,
            TrackingEvent.country_name,
            db.func.count(TrackingEvent.id).label('count')
        ).join(Link).filter(
            and_(
                Link.user_id == user.id,
                TrackingEvent.timestamp >= since,
                TrackingEvent.country.isnot(None)
            )
        ).group_by(
            TrackingEvent.country,
            TrackingEvent.country_name
        ).order_by(desc('count')).limit(10).all()
        
        # Device breakdown
        device_stats = db.session.query(
            TrackingEvent.device_type,
            db.func.count(TrackingEvent.id).label('count')
        ).join(Link).filter(
            and_(
                Link.user_id == user.id,
                TrackingEvent.timestamp >= since,
                TrackingEvent.device_type.isnot(None)
            )
        ).group_by(TrackingEvent.device_type).all()
        
        # Captured emails count
        captured_emails = base_query.filter(
            TrackingEvent.captured_email.isnot(None)
        ).count()
        
        return jsonify({
            'total_events': total_events,
            'unique_visitors': unique_visitors,
            'real_traffic': real_traffic,
            'bot_traffic': bot_traffic,
            'blocked_attempts': blocked_attempts,
            'captured_emails': captured_emails,
            'status_breakdown': status_stats,
            'top_countries': [
                {
                    'country_code': stat.country,
                    'country_name': stat.country_name,
                    'count': stat.count
                }
                for stat in country_stats
            ],
            'device_breakdown': [
                {
                    'device_type': stat.device_type,
                    'count': stat.count
                }
                for stat in device_stats
            ],
            'time_range_hours': hours
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@events_bp.route('/active', methods=['GET'])
@login_required
def get_active_sessions():
    """Get currently active sessions (users on page)"""
    try:
        user = request.current_user
        
        # Consider sessions active if last event was within 5 minutes
        active_threshold = datetime.utcnow() - timedelta(minutes=5)
        
        # Get latest event per IP address
        subquery = db.session.query(
            TrackingEvent.ip_address,
            db.func.max(TrackingEvent.timestamp).label('last_activity')
        ).join(Link).filter(
            Link.user_id == user.id
        ).group_by(TrackingEvent.ip_address).subquery()
        
        # Get active sessions
        active_sessions = db.session.query(TrackingEvent).join(
            subquery,
            and_(
                TrackingEvent.ip_address == subquery.c.ip_address,
                TrackingEvent.timestamp == subquery.c.last_activity
            )
        ).filter(
            and_(
                subquery.c.last_activity >= active_threshold,
                TrackingEvent.status == 'On Page'
            )
        ).all()
        
        return jsonify({
            'active_sessions': [event.to_dict() for event in active_sessions],
            'count': len(active_sessions)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

