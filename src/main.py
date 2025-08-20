import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from datetime import timedelta
from src.models.user import db, User
from src.models.link import Link
from src.models.tracking_event import TrackingEvent
from src.models.campaign import Campaign
from src.routes.user import user_bp
from src.routes.auth import auth_bp
from src.routes.links import links_bp
from src.routes.track import track_bp
from src.routes.events import events_bp
from src.routes.campaigns import campaigns_bp
from src.routes.analytics import analytics_bp
from src.routes.security import security_bp
from src.routes.live_activity import live_activity_bp
from src.routes.geo_analytics import geo_analytics_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Production Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'ej5B3Amppi4gjpbC65te6rJuvJzgVCWW_xfB-ZLR1TE')
app.config['ENV'] = os.environ.get('FLASK_ENV', 'production')
app.config['DEBUG'] = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
app.config['TESTING'] = False

# Database Configuration
database_url = os.environ.get('DATABASE_URL')
if database_url:
    # Use PostgreSQL for production
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
else:
    # Fallback to SQLite for development
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///brain_link_tracker.db'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    "pool_pre_ping": True,
    "pool_recycle": 300,
    "pool_timeout": 20,
    "max_overflow": 0
}

# Security Configuration for Production
app.config['SESSION_COOKIE_SECURE'] = os.environ.get('FLASK_ENV', 'production') == 'production'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = 86400  # 24 hours

# Enable CORS for all routes with production settings
CORS(app, 
     supports_credentials=True,
     origins=["*"],  # Configure specific origins in production
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "X-Requested-With"])

# Register blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(links_bp, url_prefix='/api')
app.register_blueprint(track_bp)
app.register_blueprint(events_bp)
app.register_blueprint(campaigns_bp)
app.register_blueprint(analytics_bp)
app.register_blueprint(security_bp)
app.register_blueprint(live_activity_bp)
app.register_blueprint(geo_analytics_bp)

# --- Added: register security analytics blueprint ---
from src.routes.security_analytics import security_analytics_bp
app.register_blueprint(security_analytics_bp)

# --- Added: simple healthcheck ---
@app.route("/api/health")
def health():
    try:
        return jsonify({"ok": True, "status": "up"}), 200
    except Exception:
        return jsonify({"ok": False}), 500

# Database configuration - use PostgreSQL in production, SQLite for development
database_url = os.environ.get('DATABASE_URL')
if database_url and database_url != '':
    # Production - PostgreSQL (Neon)
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
        'connect_args': {'sslmode': 'require'}
    }
else:
    # Development - SQLite fallback
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Security Headers for Production
@app.after_request
def after_request(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; img-src 'self' data: https: blob:; font-src 'self' data: https:;"
    return response

with app.app_context():
    db.create_all()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    # Handle static files
    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        response = send_from_directory(static_folder_path, path)
        
        # Set correct MIME types for different file types
        if path.endswith('.js'):
            response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
            response.headers['Cache-Control'] = 'public, max-age=31536000'
        elif path.endswith('.css'):
            response.headers['Content-Type'] = 'text/css; charset=utf-8'
            response.headers['Cache-Control'] = 'public, max-age=31536000'
        elif path.endswith('.ico'):
            response.headers['Content-Type'] = 'image/x-icon'
            response.headers['Cache-Control'] = 'public, max-age=86400'
        elif path.endswith(('.png', '.jpg', '.jpeg', '.gif', '.svg')):
            response.headers['Cache-Control'] = 'public, max-age=86400'
            
        return response
    else:
        # Serve index.html for all other routes (SPA routing)
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            response = send_from_directory(static_folder_path, 'index.html')
            response.headers['Content-Type'] = 'text/html; charset=utf-8'
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            return response
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
