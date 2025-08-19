from flask import Blueprint, request, jsonify, session
from src.models.user import db, User
from src.models.campaign import Campaign
from src.models.link import Link
from src.models.tracking_event import TrackingEvent
from datetime import datetime, timedelta
import json

campaigns_bp = Blueprint('campaigns', __name__)

def require_auth():
    """Check if user is authenticated"""
    if 'user_id' not in session:
        return False
    return True

@campaigns_bp.route('/campaigns', methods=['GET', 'POST'])
def campaigns():
    if not require_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    user_id = session['user_id']
    
    if request.method == 'GET':
        # Get all campaigns for the user
        campaigns = Campaign.query.filter_by(user_id=user_id).order_by(Campaign.created_at.desc()).all()
        
        # Get search and filter parameters
        search = request.args.get('search', '')
        status_filter = request.args.get('status', '')
        
        # Apply filters
        if search:
            campaigns = [c for c in campaigns if search.lower() in c.name.lower() or search.lower() in (c.description or '').lower()]
        
        if status_filter:
            campaigns = [c for c in campaigns if c.status == status_filter]
        
        return jsonify({
            'success': True,
            'campaigns': [campaign.to_dict() for campaign in campaigns]
        })
    
    elif request.method == 'POST':
        # Create new campaign
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()
        
        if not name:
            return jsonify({'error': 'Campaign name is required'}), 400
        
        try:
            campaign = Campaign(
                user_id=user_id,
                name=name,
                description=description,
                status='active'
            )
            db.session.add(campaign)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Campaign created successfully',
                'campaign': campaign.to_dict()
            })
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Failed to create campaign'}), 500

@campaigns_bp.route('/campaigns/<int:campaign_id>', methods=['GET', 'PUT', 'DELETE'])
def campaign_detail(campaign_id):
    if not require_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    user_id = session['user_id']
    campaign = Campaign.query.filter_by(id=campaign_id, user_id=user_id).first()
    
    if not campaign:
        return jsonify({'error': 'Campaign not found'}), 404
    
    if request.method == 'GET':
        return jsonify({
            'success': True,
            'campaign': campaign.to_dict()
        })
    
    elif request.method == 'PUT':
        # Update campaign
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        try:
            if 'name' in data:
                campaign.name = data['name'].strip()
            if 'description' in data:
                campaign.description = data['description'].strip()
            if 'status' in data:
                campaign.status = data['status']
            
            campaign.updated_at = datetime.utcnow()
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Campaign updated successfully',
                'campaign': campaign.to_dict()
            })
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Failed to update campaign'}), 500
    
    elif request.method == 'DELETE':
        # Delete campaign and all associated links and events
        try:
            # Delete all tracking events for links in this campaign
            link_ids = [link.id for link in campaign.links]
            if link_ids:
                TrackingEvent.query.filter(TrackingEvent.link_id.in_(link_ids)).delete(synchronize_session=False)
            
            # Delete the campaign (links will be deleted due to cascade)
            db.session.delete(campaign)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Campaign deleted successfully'
            })
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Failed to delete campaign'}), 500

@campaigns_bp.route('/campaigns/<int:campaign_id>/events', methods=['GET'])
def campaign_events(campaign_id):
    if not require_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    user_id = session['user_id']
    campaign = Campaign.query.filter_by(id=campaign_id, user_id=user_id).first()
    
    if not campaign:
        return jsonify({'error': 'Campaign not found'}), 404
    
    # Get all tracking events for this campaign
    events = db.session.query(TrackingEvent).join(Link).filter(
        Link.campaign_id == campaign_id,
        Link.user_id == user_id
    ).order_by(TrackingEvent.timestamp.desc()).all()
    
    # Add link information to each event
    events_data = []
    for event in events:
        event_dict = event.to_dict()
        link = Link.query.get(event.link_id)
        if link:
            event_dict['link_short_code'] = link.short_code
            event_dict['link_target_url'] = link.target_url
        events_data.append(event_dict)
    
    return jsonify({
        'success': True,
        'events': events_data
    })

@campaigns_bp.route('/campaigns/<int:campaign_id>/analytics', methods=['GET'])
def campaign_analytics(campaign_id):
    if not require_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    user_id = session['user_id']
    campaign = Campaign.query.filter_by(id=campaign_id, user_id=user_id).first()
    
    if not campaign:
        return jsonify({'error': 'Campaign not found'}), 404
    
    # Get time range from query params
    days = int(request.args.get('days', 30))
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get performance data over time
    performance_data = []
    for i in range(days):
        date = start_date + timedelta(days=i)
        date_str = date.strftime('%Y-%m-%d')
        
        # Count events for this date
        daily_events = db.session.query(TrackingEvent).join(Link).filter(
            Link.campaign_id == campaign_id,
            Link.user_id == user_id,
            TrackingEvent.timestamp >= date,
            TrackingEvent.timestamp < date + timedelta(days=1)
        ).all()
        
        clicks = len([e for e in daily_events if e.status in ['processed', 'redirected']])
        visitors = len(set([e.ip_address for e in daily_events if e.status in ['processed', 'redirected']]))
        opens = len([e for e in daily_events if e.email_opened])
        
        performance_data.append({
            'date': date_str,
            'clicks': clicks,
            'visitors': visitors,
            'opens': opens
        })
    
    # Get top countries
    country_stats = db.session.query(
        TrackingEvent.country,
        db.func.count(TrackingEvent.id).label('count')
    ).join(Link).filter(
        Link.campaign_id == campaign_id,
        Link.user_id == user_id,
        TrackingEvent.country.isnot(None)
    ).group_by(TrackingEvent.country).order_by(db.func.count(TrackingEvent.id).desc()).limit(10).all()
    
    return jsonify({
        'success': True,
        'analytics': {
            'performance': performance_data,
            'countries': [{'country': stat.country, 'count': stat.count} for stat in country_stats],
            'summary': campaign.get_analytics()
        }
    })

@campaigns_bp.route('/campaigns/delete-all', methods=['DELETE'])
def delete_all_campaigns():
    if not require_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    user_id = session['user_id']
    
    try:
        # Get all campaigns for the user
        campaigns = Campaign.query.filter_by(user_id=user_id).all()
        
        # Delete all tracking events for all links in all campaigns
        for campaign in campaigns:
            link_ids = [link.id for link in campaign.links]
            if link_ids:
                TrackingEvent.query.filter(TrackingEvent.link_id.in_(link_ids)).delete(synchronize_session=False)
        
        # Delete all campaigns (links will be deleted due to cascade)
        Campaign.query.filter_by(user_id=user_id).delete()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'All campaigns deleted successfully'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete all campaigns'}), 500

@campaigns_bp.route('/campaigns/export', methods=['GET'])
def export_campaigns():
    if not require_auth():
        return jsonify({'error': 'Authentication required'}), 401
    
    user_id = session['user_id']
    
    # Get all campaigns with their events
    campaigns = Campaign.query.filter_by(user_id=user_id).all()
    
    export_data = []
    for campaign in campaigns:
        # Get all events for this campaign
        events = db.session.query(TrackingEvent).join(Link).filter(
            Link.campaign_id == campaign.id,
            Link.user_id == user_id
        ).order_by(TrackingEvent.timestamp.desc()).all()
        
        for event in events:
            link = Link.query.get(event.link_id)
            export_data.append({
                'Campaign Name': campaign.name,
                'Campaign Status': campaign.status,
                'Link Short Code': link.short_code if link else '',
                'Target URL': link.target_url if link else '',
                'Timestamp': event.timestamp.isoformat() if event.timestamp else '',
                'IP Address': event.ip_address or '',
                'Country': event.country or '',
                'City': event.city or '',
                'ISP': event.isp or '',
                'Captured Email': event.captured_email or '',
                'User Agent': event.user_agent or '',
                'Status': event.status or '',
                'Email Opened': 'Yes' if event.email_opened else 'No',
                'Redirected': 'Yes' if event.redirected else 'No',
                'On Page': 'Yes' if event.on_page else 'No',
                'Is Bot': 'Yes' if event.is_bot else 'No'
            })
    
    return jsonify({
        'success': True,
        'data': export_data
    })

