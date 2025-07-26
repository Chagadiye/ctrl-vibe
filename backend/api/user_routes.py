# backend/api/user_routes.py
from flask import Blueprint, jsonify, request, session
from core.database import mongo, USERS_COLLECTION
from models.user import User
from datetime import datetime
from bson import ObjectId
import hashlib

user_bp = Blueprint('user', __name__)

@user_bp.route('/create-guest', methods=['POST'])
def create_guest_user():
    """Create a guest user for quick start"""
    try:
        # Generate a unique guest username
        timestamp = datetime.utcnow().timestamp()
        guest_username = f"Guest_{int(timestamp)}"
        
        # Create user
        user = User(username=guest_username)
        user_dict = user.to_dict()
        
        # Insert into database
        result = mongo.db[USERS_COLLECTION].insert_one(user_dict)
        user_id = str(result.inserted_id)
        
        # Store in session
        session['user_id'] = user_id
        session['username'] = guest_username
        
        return jsonify({
            "user_id": user_id,
            "username": guest_username,
            "xp": 0,
            "level": 1,
            "streak": 0
        }), 201
        
    except Exception as e:
        print(f"Error creating guest user: {e}")
        return jsonify({"error": "Failed to create guest user"}), 500

@user_bp.route('/profile/<user_id>', methods=['GET'])
def get_user_profile(user_id):
    """Get user profile information"""
    try:
        user = mongo.db[USERS_COLLECTION].find_one(
            {"_id": ObjectId(user_id)},
            {"password": 0}  # Exclude password
        )
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Convert ObjectId to string
        user['_id'] = str(user['_id'])
        
        return jsonify(user), 200
        
    except Exception as e:
        print(f"Error getting user profile: {e}")
        return jsonify({"error": "Internal server error"}), 500

@user_bp.route('/update-username', methods=['PUT'])
def update_username():
    """Update username"""
    data = request.get_json()
    user_id = data.get('user_id')
    new_username = data.get('username')
    
    if not all([user_id, new_username]):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Validate username
    if len(new_username) < 3 or len(new_username) > 20:
        return jsonify({"error": "Username must be between 3 and 20 characters"}), 400
    
    try:
        # Check if username already exists
        existing = mongo.db[USERS_COLLECTION].find_one({"username": new_username})
        if existing and str(existing['_id']) != user_id:
            return jsonify({"error": "Username already taken"}), 409
        
        # Update username
        result = mongo.db[USERS_COLLECTION].update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"username": new_username}}
        )
        
        if result.modified_count == 0:
            return jsonify({"error": "Failed to update username"}), 500
        
        return jsonify({"success": True, "username": new_username}), 200
        
    except Exception as e:
        print(f"Error updating username: {e}")
        return jsonify({"error": "Internal server error"}), 500

@user_bp.route('/session', methods=['GET'])
def get_session():
    """Get current session info"""
    if 'user_id' in session:
        return jsonify({
            "logged_in": True,
            "user_id": session['user_id'],
            "username": session.get('username')
        }), 200
    else:
        return jsonify({"logged_in": False}), 200