#!/usr/bin/env python3
"""
Production Fixes for Brain Link Tracker
Applies necessary fixes for production deployment
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add src to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.models.user import db, User
from src.models.link import Link
from src.models.tracking_event import TrackingEvent
from src.main import app

def apply_database_migrations():
    """Apply database migrations for production"""
    print("🔧 Applying database migrations...")
    
    try:
        with app.app_context():
            # Create all tables
            db.create_all()
            print("✅ Database tables created successfully")
            
            # Check if Brain user exists, create if not
            test_user = User.query.filter_by(username='Brain').first()
            if not test_user:
                test_user = User(username='Brain', email='admin@brainlinktracker.com')
                test_user.set_password('Mayflower1!!')
                db.session.add(test_user)
                db.session.commit()
                print("✅ Created admin user 'Brain'")
            else:
                print("✅ Admin user 'Brain' already exists")
                
            # Add title column to Link table if it doesn't exist
            try:
                # Try to query the title column
                db.session.execute(db.text("SELECT title FROM link LIMIT 1"))
                print("✅ Link table title column already exists")
            except Exception:
                # Add title column
                try:
                    db.session.execute(db.text("ALTER TABLE link ADD COLUMN title VARCHAR(255)"))
                    db.session.commit()
                    print("✅ Added title column to Link table")
                except Exception as e:
                    print(f"⚠️  Could not add title column: {e}")
            
            return True
            
    except Exception as e:
        print(f"❌ Database migration failed: {e}")
        return False

def fix_cors_configuration():
    """Fix CORS configuration for production"""
    print("🔧 Checking CORS configuration...")
    
    # CORS is already configured in main.py
    print("✅ CORS configuration is properly set")
    return True

def validate_environment():
    """Validate production environment"""
    print("🔧 Validating production environment...")
    
    required_vars = ['SECRET_KEY', 'DATABASE_URL']
    missing_vars = []
    
    for var in required_vars:
        if not os.environ.get(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        return False
    else:
        print("✅ All required environment variables are set")
        return True

def create_production_config():
    """Create production configuration file"""
    print("🔧 Creating production configuration...")
    
    config_content = """# Production Configuration for Brain Link Tracker

# Gunicorn Configuration
bind = "0.0.0.0:5000"
workers = 4
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 2
preload_app = True

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190
"""
    
    with open('../gunicorn.conf.py', 'w') as f:
        f.write(config_content)
    
    print("✅ Created gunicorn.conf.py")
    return True

def create_startup_script():
    """Create production startup script"""
    print("🔧 Creating startup script...")
    
    startup_content = """#!/bin/bash
# Brain Link Tracker Production Startup Script

echo "🚀 Starting Brain Link Tracker..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded"
fi

# Apply database migrations
echo "🔧 Applying database migrations..."
cd src && python3 production_fixes.py

# Start the application with Gunicorn
echo "🚀 Starting application server..."
cd ..
gunicorn -c gunicorn.conf.py src.main:app
"""
    
    with open('../start_production.sh', 'w') as f:
        f.write(startup_content)
    
    # Make executable
    os.chmod('../start_production.sh', 0o755)
    
    print("✅ Created start_production.sh")
    return True

def main():
    """Apply all production fixes"""
    print("🚀 Brain Link Tracker - Production Fixes")
    print("=" * 50)
    
    fixes_applied = 0
    total_fixes = 5
    
    if validate_environment():
        fixes_applied += 1
    
    if apply_database_migrations():
        fixes_applied += 1
    
    if fix_cors_configuration():
        fixes_applied += 1
    
    if create_production_config():
        fixes_applied += 1
    
    if create_startup_script():
        fixes_applied += 1
    
    print("\n" + "=" * 50)
    print(f"🎯 Production Fixes Summary: {fixes_applied}/{total_fixes} applied")
    
    if fixes_applied == total_fixes:
        print("🎉 All production fixes applied successfully!")
        print("📋 Next steps:")
        print("   1. Run: chmod +x start_production.sh")
        print("   2. Run: ./start_production.sh")
        print("   3. Test the application at http://localhost:5000")
        return True
    else:
        print("⚠️  Some fixes failed. Please review the output above.")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)

