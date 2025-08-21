from flask import Blueprint, request, jsonify
from src.models.fixed_user import db, Campaign, Link, TrackingEvent
from src.utils.auth import login_required
from sqlalchemy import desc, and_, func
from datetime import datetime, timedelta

campaigns_bp = Blueprint('campaigns', __name__)

@campaigns_bp.route('', methods=['GET'])
@login_required
def get_campaigns():
    """Get all campaigns for the authenticated user"""
    try:
        user = request.current_user
        campaigns = Campaign.query.filter_by(user_id=user.id).order_by(desc(Campaign.created_at)).all()
        
        # Add analytics for each campaign
        campaign_data = []
        for campaign in campaigns:
            # Get campaign statistics
            total_clicks = db.session.query(func.sum(Link.total_clicks)).filter(
                Link.campaign_id == campaign.id
            ).scalar() or 0
            
            total_opens = db.session.query(TrackingEvent).join(Link).filter(
                Link.campaign_id == campaign.id
            ).count()
            
            captured_emails = db.session.query(TrackingEvent).join(Link).filter(
                and_(
                    Link.campaign_id == campaign.id,
                    TrackingEvent.captured_email.isnot(None)
                )
            ).count()
            
            campaign_dict = campaign.to_dict()
            campaign_dict.update({
                'total_clicks': total_clicks,
                'total_opens': total_opens,
                'captured_emails': captured_emails
            })
            campaign_data.append(campaign_dict)
        
        return jsonify(campaign_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@campaigns_bp.route('', methods=['POST'])
@login_required
def create_campaign():
    """Create a new campaign"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        name = data.get('name')
        if not name:
            return jsonify({'error': 'Campaign name is required'}), 400
        
        user = request.current_user
        campaign = Campaign(
            user_id=user.id,
            name=name,
            description=data.get('description', '')
        )
        
        db.session.add(campaign)
        db.session.commit()
        
        return jsonify(campaign.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@campaigns_bp.route('/<int:campaign_id>', methods=['DELETE'])
@login_required
def delete_campaign(campaign_id):
    """Delete a campaign and all its data"""
    try:
        campaign = Campaign.query.get_or_404(campaign_id)
        if campaign.user_id != request.current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Delete all tracking events for links in this campaign
        link_ids = [link.id for link in campaign.links]
        if link_ids:
            TrackingEvent.query.filter(TrackingEvent.link_id.in_(link_ids)).delete(synchronize_session=False)
        
        # Delete all links in this campaign
        Link.query.filter_by(campaign_id=campaign_id).delete()
        
        # Delete the campaign
        db.session.delete(campaign)
        db.session.commit()
        
        return jsonify({'message': 'Campaign deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@campaigns_bp.route('/delete-all', methods=['DELETE'])
@login_required
def delete_all_campaigns():
    """Delete all campaigns and their data for the user"""
    try:
        user = request.current_user
        
        # Get all campaign IDs for the user
        campaign_ids = [c.id for c in Campaign.query.filter_by(user_id=user.id).all()]
        
        if campaign_ids:
            # Delete all tracking events for user's campaign links
            link_ids = [link.id for link in Link.query.filter(Link.campaign_id.in_(campaign_ids)).all()]
            if link_ids:
                TrackingEvent.query.filter(TrackingEvent.link_id.in_(link_ids)).delete(synchronize_session=False)
            
            # Delete all links in user's campaigns
            Link.query.filter(Link.campaign_id.in_(campaign_ids)).delete(synchronize_session=False)
        
        # Delete all campaigns for the user
        Campaign.query.filter_by(user_id=user.id).delete()
        db.session.commit()
        
        return jsonify({'message': 'All campaigns deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@campaigns_bp.route('/<int:campaign_id>/details', methods=['GET'])
@login_required
def get_campaign_details(campaign_id):
    """Get detailed tracking data for a campaign"""
    try:
        campaign = Campaign.query.get_or_404(campaign_id)
        if campaign.user_id != request.current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get all tracking events for this campaign
        events = db.session.query(TrackingEvent).join(Link).filter(
            Link.campaign_id == campaign_id
        ).order_by(desc(TrackingEvent.timestamp)).all()
        
        return jsonify({
            'campaign': campaign.to_dict(),
            'events': [event.to_dict() for event in events]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

