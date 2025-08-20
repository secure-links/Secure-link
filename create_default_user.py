#!/usr/bin/env python3
"""
Script to create the default user in the production database
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.models.user import db, User
from src.main import app

def create_default_user():
    """Create the default user for the application"""
    with app.app_context():
        try:
            # Check if the default user already exists
            existing_user = User.query.filter(
                (User.username == 'Brain') | (User.email == 'brain@example.com')
            ).first()
            
            if existing_user:
                print("Default user already exists")
                print(f"Username: {existing_user.username}")
                print(f"Email: {existing_user.email}")
                return True
            
            # Create the default user
            user = User(username='Brain', email='brain@example.com')
            user.set_password('Mayflower1!!')
            
            db.session.add(user)
            db.session.commit()
            
            print("✓ Default user created successfully!")
            print("Username: Brain")
            print("Password: Mayflower1!!")
            print("Email: brain@example.com")
            
            return True
            
        except Exception as e:
            print(f"Error creating default user: {e}")
            import traceback
            traceback.print_exc()
            db.session.rollback()
            return False

if __name__ == "__main__":
    create_default_user()

