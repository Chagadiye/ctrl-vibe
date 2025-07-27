# backend/api/livekit_routes.py - No Auth Version
from flask import Blueprint, jsonify, request
from services.livekit_service import LiveKitService
from core.database import mongo, SIMULATION_HISTORY_COLLECTION
from models.user import SimulationHistory
import asyncio
from datetime import datetime
import uuid

livekit_bp = Blueprint('livekit', __name__)
livekit_service = LiveKitService()

@livekit_bp.route('/create-session', methods=['POST'])
def create_simulation_session():
    """Create a new LiveKit room for simulation"""
    data = request.get_json()
    
    # Generate user_id if not provided (for demo)
    user_id = data.get('user_id') or f"demo_user_{uuid.uuid4().hex[:8]}"
    simulation_type = data.get('simulation_type', 'auto_driver_sim')
    age_verified = data.get('age_verified', False)
    
    # Check age verification for restricted content
    if simulation_type == 'road_rage_sim' and not age_verified:
        return jsonify({"error": "Age verification required"}), 403
    
    try:
        # Generate room name
        room_name = livekit_service.generate_room_name(user_id, simulation_type)
        
        # Create room metadata
        metadata = {
            "simulation_type": simulation_type,
            "user_id": user_id,
            "started_at": datetime.utcnow().isoformat(),
            "demo_mode": True
        }
        
        # Create the room (synchronously for Flask)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        room_result = loop.run_until_complete(
            livekit_service.create_room(room_name, metadata)
        )
        
        if not room_result["success"]:
            return jsonify({"error": "Failed to create room"}), 500
        
        # Generate access token for the user
        user_token = livekit_service.create_room_token(
            room_name=room_name,
            participant_name=f"user_{user_id}",
            metadata={"role": "user", "user_id": user_id, "demo": True}
        )
        
        # Create simulation history entry (optional for demo)
        try:
            sim_history = SimulationHistory(user_id, simulation_type)
            mongo.db[SIMULATION_HISTORY_COLLECTION].insert_one(sim_history.to_dict())
        except Exception as e:
            # Don't fail if database is not available
            print(f"Warning: Could not save simulation history: {e}")
        
        # Get simulation details
        simulation_info = get_simulation_info(simulation_type)
        
        return jsonify({
            "success": True,
            "room_name": room_name,
            "access_token": user_token,
            "livekit_url": livekit_service.url,
            "simulation": simulation_info,
            "user_id": user_id,  # Return the user_id for reference
            "demo_mode": True
        }), 200
        
    except Exception as e:
        print(f"Error creating simulation session: {e}")
        return jsonify({"error": "Internal server error"}), 500

@livekit_bp.route('/end-session', methods=['POST'])
def end_simulation_session():
    """End a LiveKit simulation session"""
    data = request.get_json()
    room_name = data.get('room_name')
    user_id = data.get('user_id')
    
    if not room_name:
        return jsonify({"error": "Room name required"}), 400
    
    try:
        # Delete the room
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(
            livekit_service.delete_room(room_name)
        )
        
        # Update simulation history with end time (optional)
        if user_id:
            try:
                mongo.db[SIMULATION_HISTORY_COLLECTION].update_one(
                    {"user_id": user_id},
                    {
                        "$set": {
                            "ended_at": datetime.utcnow(),
                            "status": "completed"
                        }
                    },
                    sort=[("created_at", -1)]  # Update the most recent
                )
            except Exception as e:
                # Don't fail if database is not available
                print(f"Warning: Could not update simulation history: {e}")
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Error ending session: {e}")
        return jsonify({"error": "Internal server error"}), 500

@livekit_bp.route('/active-rooms', methods=['GET'])
def get_active_rooms():
    """Get list of active simulation rooms"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        rooms = loop.run_until_complete(livekit_service.list_rooms())
        
        return jsonify({"rooms": rooms}), 200
        
    except Exception as e:
        print(f"Error listing rooms: {e}")
        return jsonify({"error": "Internal server error"}), 500

@livekit_bp.route('/demo-token', methods=['GET'])
def get_demo_token():
    """Get a demo token for testing (no auth required)"""
    try:
        demo_user_id = f"demo_{uuid.uuid4().hex[:8]}"
        demo_room = f"demo_room_{uuid.uuid4().hex[:8]}"
        
        token = livekit_service.create_room_token(
            room_name=demo_room,
            participant_name=f"demo_user_{demo_user_id}",
            metadata={"role": "demo", "user_id": demo_user_id}
        )
        
        return jsonify({
            "success": True,
            "token": token,
            "room_name": demo_room,
            "user_id": demo_user_id,
            "livekit_url": livekit_service.url
        }), 200
        
    except Exception as e:
        print(f"Error creating demo token: {e}")
        return jsonify({"error": "Internal server error"}), 500

def get_simulation_info(simulation_type: str) -> dict:
    """Get simulation configuration info"""
    simulations = {
        "auto_driver_sim": {
            "title": "Auto Driver Negotiation",
            "description": "Practice bargaining with an auto driver",
            "tips": [
                "Start by greeting politely: 'ನಮಸ್ಕಾರ'",
                "State your destination clearly",
                "Negotiate the fare - it's expected!",
                "Use 'ಎಷ್ಟು?' (eshtu?) to ask 'how much?'"
            ]
        },
        "salary_negotiation_sim": {
            "title": "Salary Negotiation",
            "description": "Discuss salary with your manager",
            "tips": [
                "Be professional but friendly",
                "Mention your achievements",
                "Use English-Kannada mix (Kanglish)",
                "Listen to feedback carefully"
            ]
        },
        "crush_conversation_sim": {
            "title": "Coffee Date",
            "description": "Casual conversation at a coffee shop",
            "tips": [
                "Keep it light and friendly",
                "Ask about interests and hobbies",
                "Compliment when appropriate",
                "Practice common social phrases"
            ]
        },
        "road_rage_sim": {
            "title": "Road Incident",
            "description": "Handle a tense traffic situation",
            "tips": [
                "Stay calm and apologize if needed",
                "Use 'ಕ್ಷಮಿಸಿ' (kshamisi) for 'sorry'",
                "Don't escalate the situation",
                "Focus on de-escalation"
            ]
        }
    }
    
    return simulations.get(simulation_type, simulations["auto_driver_sim"])