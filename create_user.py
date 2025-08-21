#!/usr/bin/env python3

import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from src.main import app
from src.models.fixed_user import db, User

def create_user():
    with app.app_context():
        # Check if user already exists
        existing_user = User.query.filter_by(username='Brain').first()
        if existing_user:
            print("User 'Brain' already exists")
            return
        
        # Create new user
        user = User(username='Brain', email='brain@example.com')
        user.set_password('Mayflower1!!')
        
        db.session.add(user)
        db.session.commit()
        
        print("User 'Brain' created successfully")

if __name__ == '__main__':
    create_user()

