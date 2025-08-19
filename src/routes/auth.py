from flask import Blueprint, request, jsonify, session
from src.models.user import db, User
import re

auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def sanitize_input(text):
    if not text:
        return ''
    return text.strip()

@auth_bp.route('/auth', methods=['GET', 'POST', 'DELETE'])
def auth():
    if request.method == 'GET':
        # Check if user is logged in
        if 'user_id' in session:
            user = User.query.get(session['user_id'])
            if user:
                return jsonify({
                    'authenticated': True,
                    'user': user.to_dict()
                })
        
        return jsonify({'authenticated': False})
    
    elif request.method == 'POST':
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        # Handle direct login (new frontend format)
        username = sanitize_input(data.get('username', ''))
        password = data.get('password', '')
        action = data.get('action', 'login')  # Default to login for new frontend
        
        if action == 'login' or (username and password):
            if not username or not password:
                return jsonify({'success': False, 'error': 'Username and password are required'}), 400
            
            # Find user by username or email
            user = User.query.filter(
                (User.username == username) | (User.email == username)
            ).first()
            
            if user and user.check_password(password):
                session['user_id'] = user.id
                return jsonify({
                    'success': True,
                    'message': 'Login successful',
                    'user': user.to_dict()
                })
            else:
                return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
        
        elif action == 'register':
            email = sanitize_input(data.get('email', ''))
            
            if not username or not email or not password:
                return jsonify({'success': False, 'error': 'All fields are required'}), 400
            
            if not validate_email(email):
                return jsonify({'success': False, 'error': 'Invalid email format'}), 400
            
            if len(password) < 6:
                return jsonify({'success': False, 'error': 'Password must be at least 6 characters long'}), 400
            
            # Check if user already exists
            existing_user = User.query.filter(
                (User.username == username) | (User.email == email)
            ).first()
            
            if existing_user:
                return jsonify({'success': False, 'error': 'Username or email already exists'}), 409
            
            # Create new user
            try:
                user = User(username=username, email=email)
                user.set_password(password)
                db.session.add(user)
                db.session.commit()
                
                return jsonify({
                    'success': True,
                    'message': 'User created successfully',
                    'user_id': user.id
                })
            except Exception as e:
                db.session.rollback()
                return jsonify({'success': False, 'error': 'Failed to create user'}), 500
        
        else:
            return jsonify({'success': False, 'error': 'Invalid action'}), 400
    
    elif request.method == 'DELETE':
        # Handle logout
        session.pop('user_id', None)
        return jsonify({
            'success': True,
            'message': 'Logout successful'
        })

