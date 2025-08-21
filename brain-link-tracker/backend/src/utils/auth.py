from functools import wraps
from flask import session, jsonify, request
from src.models.fixed_user import db, User

def login_required(f):
    """
    Decorator to require authentication for routes
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        
        # Verify user still exists
        user = db.session.get(User, session['user_id'])
        if not user:
            session.clear()
            return jsonify({'error': 'Invalid session'}), 401
        
        # Add user to request context
        request.current_user = user
        return f(*args, **kwargs)
    
    return decorated_function

def get_current_user():
    """
    Get the current authenticated user
    """
    if 'user_id' in session:
        return db.session.get(User, session['user_id'])
    return None

def is_authenticated():
    """
    Check if user is authenticated
    """
    return 'user_id' in session and get_current_user() is not None

