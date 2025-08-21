#!/usr/bin/env python3
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, session
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import datetime
from src.models.fixed_user import db, User
from src.routes.auth import auth_bp
from src.routes.links import links_bp
from src.routes.analytics import analytics_bp
from src.routes.tracking import tracking_bp
from src.routes.events import events_bp
from src.routes.security import security_bp
from src.routes.campaigns import campaigns_bp

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'ej5B3Amppi4gjpbC65te6rJuvJzgVCWW_xfB-ZLR1TE')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///brain_tracker.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SESSION_COOKIE_SECURE'] = False  # Allow HTTP for local testing
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Enable CORS for all routes
CORS(app, supports_credentials=True, origins=['*'])

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(links_bp, url_prefix='/api/links')
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
app.register_blueprint(tracking_bp, url_prefix='/t')
app.register_blueprint(events_bp, url_prefix='/api/events')
app.register_blueprint(security_bp, url_prefix='/api/security')
app.register_blueprint(campaigns_bp, url_prefix='/api/campaigns')

# Initialize database
db.init_app(app)

def create_default_user():
    """Create default user if none exists"""
    try:
        with app.app_context():
            # Create tables
            db.create_all()
            
            # Check if default user exists
            if not User.query.filter_by(username='Brain').first():
                user = User(username='Brain')
                user.set_password("Mayflower1!!")
                db.session.add(user)
                db.session.commit()
                print("Default user created: Brain/Mayflower1!!")
    except Exception as e:
        print(f"Database setup error: {e}")
        print("Continuing without database...")

# Create tables and default user
create_default_user()
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    """Serve static files and handle SPA routing"""
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    # Handle robots.txt
    if path == 'robots.txt':
        robots_path = os.path.join(os.path.dirname(static_folder_path), 'public', 'robots.txt')
        if os.path.exists(robots_path):
            return send_from_directory(os.path.dirname(robots_path), 'robots.txt')
    
    # Serve static files
    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        # Serve index.html for SPA routing
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "Backend API is running. Frontend not built yet.", 200

@app.before_request
def before_request():
    """Handle session management"""
    session.permanent = True

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    print(f"Starting server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)

