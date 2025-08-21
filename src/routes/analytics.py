from flask import Blueprint, request, jsonify
from src.models.fixed_user import db, Link, TrackingEvent, Campaign
from src.utils.auth import login_required
from sqlalchemy import desc, and_, func, case
from datetime import datetime, timedelta

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/overview', methods=['GET'])
@login_required
def get_overview():
    """Get dashboard overview statistics"""
    try:
        user = request.current_user
        
        # Get time range (default to last 30 days)
        days = request.args.get('days', 30, type=int)
        since = datetime.utcnow() - timedelta(days=days)
        
        # Total links
        total_links = Link.query.filter_by(user_id=user.id).count()
        
        # Total clicks (all time)
        total_clicks = db.session.query(func.sum(Link.total_clicks)).filter(
            Link.user_id == user.id
        ).scalar() or 0
        
        # Real visitors (all time)
        real_visitors = db.session.query(func.sum(Link.real_visitors)).filter(
            Link.user_id == user.id
        ).scalar() or 0
        
        # Blocked attempts (all time)
        blocked_attempts = db.session.query(func.sum(Link.blocked_attempts)).filter(
            Link.user_id == user.id
        ).scalar() or 0
        
        # Captured emails (recent period)
        captured_emails = db.session.query(TrackingEvent).join(Link).filter(
            and_(
                Link.user_id == user.id,
                TrackingEvent.captured_email.isnot(None),
                TrackingEvent.timestamp >= since
            )
        ).count()
        
        # Recent activity (last 24 hours)
        last_24h = datetime.utcnow() - timedelta(hours=24)
        recent_clicks = db.session.query(TrackingEvent).join(Link).filter(
            and_(
                Link.user_id == user.id,
                TrackingEvent.timestamp >= last_24h
            )
        ).count()
        
        # Calculate percentage changes (comparing to previous period)
        prev_period_start = since - timedelta(days=days)
        prev_clicks = db.session.query(TrackingEvent).join(Link).filter(
            and_(
                Link.user_id == user.id,
                TrackingEvent.timestamp >= prev_period_start,
                TrackingEvent.timestamp < since
            )
        ).count()
        
        current_clicks = db.session.query(TrackingEvent).join(Link).filter(
            and_(
                Link.user_id == user.id,
                TrackingEvent.timestamp >= since
            )
        ).count()
        
        # Calculate percentage change
        clicks_change = 0
        if prev_clicks > 0:
            clicks_change = ((current_clicks - prev_clicks) / prev_clicks) * 100
        elif current_clicks > 0:
            clicks_change = 100
        
        return jsonify({
            'total_links': total_links,
            'total_clicks': total_clicks,
            'real_visitors': real_visitors,
            'blocked_attempts': blocked_attempts,
            'captured_emails': captured_emails,
            'recent_clicks_24h': recent_clicks,
            'clicks_change_percent': round(clicks_change, 1),
            'period_days': days
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/trends', methods=['GET'])
@login_required
def get_trends():
    """Get click trends over time"""
    try:
        user = request.current_user
        
        # Get time range
        days = request.args.get('days', 7, type=int)
        since = datetime.utcnow() - timedelta(days=days)
        
        # Group by date
        trends = db.session.query(
            func.date(TrackingEvent.timestamp).label('date'),
            func.count(TrackingEvent.id).label('total_clicks'),
            func.count(func.distinct(TrackingEvent.ip_address)).label('unique_visitors')
        ).join(Link).filter(
            and_(
                Link.user_id == user.id,
                TrackingEvent.timestamp >= since
            )
        ).group_by(func.date(TrackingEvent.timestamp)).order_by('date').all()
        
        return jsonify([
            {
                'date': trend.date.isoformat(),
                'total_clicks': trend.total_clicks,
                'unique_visitors': trend.unique_visitors
            }
            for trend in trends
        ])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/geographic', methods=['GET'])
@login_required
def get_geographic():
    """Get geographic distribution of traffic"""
    try:
        user = request.current_user
        
        # Get time range
        days = request.args.get('days', 30, type=int)
        since = datetime.utcnow() - timedelta(days=days)
        
        # Country statistics
        country_stats = db.session.query(
            TrackingEvent.country_code,
            TrackingEvent.country,
            func.count(TrackingEvent.id).label('clicks'),
            func.count(func.distinct(TrackingEvent.ip_address)).label('unique_visitors')
        ).join(Link).filter(
            and_(
                Link.user_id == user.id,
                TrackingEvent.timestamp >= since,
                TrackingEvent.country_code.isnot(None)
            )
        ).group_by(
            TrackingEvent.country_code,
            TrackingEvent.country
        ).order_by(desc('clicks')).all()
        
        # City statistics
        city_stats = db.session.query(
            TrackingEvent.city,
            TrackingEvent.country,
            func.count(TrackingEvent.id).label('clicks'),
            func.count(func.distinct(TrackingEvent.ip_address)).label('unique_visitors')
        ).join(Link).filter(
            and_(
                Link.user_id == user.id,
                TrackingEvent.timestamp >= since,
                TrackingEvent.city.isnot(None)
            )
        ).group_by(
            TrackingEvent.city,
            TrackingEvent.country
        ).order_by(desc('clicks')).limit(20).all()
        
        # Calculate total for percentages
        total_clicks = sum(stat.clicks for stat in country_stats)
        
        return jsonify({
            'countries': [
                {
                    'country_code': stat.country_code,
                    'country_name': stat.country,
                    'clicks': stat.clicks,
                    'unique_visitors': stat.unique_visitors,
                    'percentage': round((stat.clicks / total_clicks * 100), 2) if total_clicks > 0 else 0
                }
                for stat in country_stats
            ],
            'cities': [
                {
                    'city': stat.city,
                    'country': stat.country,
                    'clicks': stat.clicks,
                    'unique_visitors': stat.unique_visitors
                }
                for stat in city_stats
            ],
            'total_clicks': total_clicks
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/devices', methods=['GET'])
@login_required
def get_device_analytics():
    """Get device and browser analytics"""
    try:
        user = request.current_user
        
        # Get time range
        days = request.args.get('days', 30, type=int)
        since = datetime.utcnow() - timedelta(days=days)
        
        # Device type breakdown
        device_stats = db.session.query(
            TrackingEvent.device_type,
            func.count(TrackingEvent.id).label('count')
        ).join(Link).filter(
            and_(
                Link.user_id == user.id,
                TrackingEvent.timestamp >= since,
                TrackingEvent.device_type.isnot(None)
            )
        ).group_by(TrackingEvent.device_type).all()
        
        # Browser breakdown
        browser_stats = db.session.query(
            TrackingEvent.browser,
            func.count(TrackingEvent.id).label('count')
        ).join(Link).filter(
            and_(
                Link.user_id == user.id,
                TrackingEvent.timestamp >= since,
                TrackingEvent.browser.isnot(None)
            )
        ).group_by(TrackingEvent.browser).order_by(desc('count')).limit(10).all()
        
        # OS breakdown
        os_stats = db.session.query(
            TrackingEvent.os,
            func.count(TrackingEvent.id).label('count')
        ).join(Link).filter(
            and_(
                Link.user_id == user.id,
                TrackingEvent.timestamp >= since,
                TrackingEvent.os.isnot(None)
            )
        ).group_by(TrackingEvent.os).order_by(desc('count')).limit(10).all()
        
        # Calculate totals for percentages
        total_devices = sum(stat.count for stat in device_stats)
        
        return jsonify({
            'devices': [
                {
                    'type': stat.device_type,
                    'count': stat.count,
                    'percentage': round((stat.count / total_devices * 100), 2) if total_devices > 0 else 0
                }
                for stat in device_stats
            ],
            'browsers': [
                {
                    'browser': stat.browser,
                    'count': stat.count
                }
                for stat in browser_stats
            ],
            'operating_systems': [
                {
                    'os': stat.os,
                    'count': stat.count
                }
                for stat in os_stats
            ]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/hourly', methods=['GET'])
@login_required
def get_hourly_activity():
    """Get hourly activity patterns"""
    try:
        user = request.current_user
        
        # Get time range
        days = request.args.get('days', 7, type=int)
        since = datetime.utcnow() - timedelta(days=days)
        
        # Hourly breakdown
        hourly_stats = db.session.query(
            func.extract('hour', TrackingEvent.timestamp).label('hour'),
            func.count(TrackingEvent.id).label('count')
        ).join(Link).filter(
            and_(
                Link.user_id == user.id,
                TrackingEvent.timestamp >= since
            )
        ).group_by(func.extract('hour', TrackingEvent.timestamp)).order_by('hour').all()
        
        # Fill in missing hours with 0
        hourly_data = {int(stat.hour): stat.count for stat in hourly_stats}
        complete_hourly = [
            {
                'hour': hour,
                'count': hourly_data.get(hour, 0)
            }
            for hour in range(24)
        ]
        
        return jsonify(complete_hourly)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

