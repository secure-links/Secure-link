#!/usr/bin/env python3
"""
Database fix script for Brain Link Tracker
This script properly initializes the database with correct table creation order
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask
from dotenv import load_dotenv
from src.models.fixed_user import db, User, Campaign, Link, TrackingEvent, SecurityThreat

# Load environment variables
load_dotenv()

def create_app():
    """Create Flask app for database operations"""
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'ej5B3Amppi4gjpbC65te6rJuvJzgVCWW_xfB-ZLR1TE')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///brain_tracker.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize database
    db.init_app(app)
    
    return app

def fix_database():
    """Fix database by dropping and recreating all tables in correct order"""
    app = create_app()
    
    with app.app_context():
        try:
            print("Checking existing database...")
            
            # Check if we're using PostgreSQL and need to drop with CASCADE
            if 'postgresql' in app.config['SQLALCHEMY_DATABASE_URI']:
                print("PostgreSQL detected - dropping with CASCADE...")
                with db.engine.connect() as conn:
                    conn.execute(db.text('DROP SCHEMA IF EXISTS public CASCADE'))
                    conn.execute(db.text('CREATE SCHEMA public'))
                    conn.execute(db.text('GRANT ALL ON SCHEMA public TO public'))
                    conn.commit()
            else:
                print("Dropping existing tables...")
                db.drop_all()
            
            print("Creating tables in correct order...")
            # Create tables in dependency order
            # 1. Users table first (no dependencies)
            db.create_all()
            
            print("Database tables created successfully!")
            
            # Create default user
            print("Creating default user...")
            if not User.query.filter_by(username='Brain').first():
                user = User(username='Brain')
                user.set_password('Mayflower1!!')
                db.session.add(user)
                db.session.commit()
                print("Default user created: Brain/Mayflower1!!")
            else:
                print("Default user already exists")
                
            # Verify tables exist
            print("\nVerifying tables:")
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            for table in tables:
                print(f"  ✓ {table}")
                
            print("\nDatabase fix completed successfully!")
            
        except Exception as e:
            print(f"Database fix error: {e}")
            return False
            
    return True

if __name__ == '__main__':
    success = fix_database()
    if success:
        print("\n✅ Database is ready for use!")
    else:
        print("\n❌ Database fix failed!")
        sys.exit(1)

