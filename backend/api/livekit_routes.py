from flask import Blueprint, request, jsonify
from livekit.api import LiveKitAPI, CreateRoomRequest, DeleteRoomRequest, AccessToken, VideoGrants
import json
import uuid
from datetime import datetime, timedelta
from config import LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL

livekit_bp = Blueprint('livekit', __name__)

def get_simulation_details(simulation_type: str):
    simulations = {
        "auto_driver_sim": {
            "title": "Auto Driver Negotiation",
            "description": "Practice negotiating with an auto-rickshaw driver in Bengaluru",
            "tips": [
                "Start by asking 'ಎಲ್ಲಿಗೆ ಹೋಗಬೇಕು?' (Where do you want to go?)",
                "Be prepared to negotiate the fare",
                "Use simple Kannada mixed with English",
                "Stay polite but firm during negotiation"
            ]
        },
        "salary_negotiation_sim": {
            "title": "Salary Negotiation",
            "description": "Practice salary discussion with a tech manager",
            "tips": [
                "Highlight your achievements and contributions",
                "Be professional and confident",
                "Use Kanglish (Kannada + English mix)",
                "Prepare to discuss specific numbers"
            ]
        },
        "crush_conversation_sim": {
            "title": "Coffee Date Conversation",
            "description": "Practice casual conversation at a coffee shop",
            "tips": [
                "Be friendly and natural",
                "Ask about interests and hobbies",
                "Share about yourself too",
                "Keep the conversation light and fun"
            ]
        },
        "road_rage_sim": {
            "title": "Road Incident De-escalation",
            "description": "Practice handling a minor traffic incident calmly",
            "tips": [
                "Stay calm and apologize if needed",
                "Use respectful language",
                "Try to de-escalate the situation",
                "Focus on solving the problem"
            ]
        }
    }
    return simulations.get(simulation_type, {
        "title": "Simulation",
        "description": "Practice conversation in Kannada",
        "tips": ["Speak naturally", "Don't worry about perfect pronunciation"]
    })

@livekit_bp.route("/create-session", methods=['POST'])
async def create_session():  # Make this async
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400
        
    simulation_type = data.get('simulation_type')
    age_verified = data.get('age_verified', True)

    try:
        room_name = f"sim_{simulation_type}_{uuid.uuid4().hex[:8]}"
        user_id = f"user_{uuid.uuid4().hex[:8]}"
        
        room_metadata = {
            "simulation_type": simulation_type,
            "user_id": user_id,
            "age_verified": age_verified,
            "created_at": datetime.now().isoformat()
        }
        
        lk_api = LiveKitAPI(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
        
        # Now we can use await directly
        await lk_api.room.create_room(
            CreateRoomRequest(
                name=room_name,
                metadata=json.dumps(room_metadata),
                max_participants=2,
                empty_timeout=300,
            )
        )
        
        grant = VideoGrants(
            room=room_name,
            room_join=True,
            can_publish=True,
            can_subscribe=True,
            can_publish_data=True,
        )
        
        token = AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET).with_identity(user_id).with_name(f"User").with_grants(grant).with_ttl(timedelta(hours=1))
        
        simulation_details = get_simulation_details(simulation_type)
        
        return jsonify({
            "room_name": room_name,
            "access_token": token.to_jwt(),
            "livekit_url": LIVEKIT_URL,
            "user_id": user_id,
            "simulation": simulation_details
        })
        
    except Exception as e:
        print(f"Error creating session: {e}")
        return jsonify({"error": f"Failed to create session: {str(e)}"}), 500

@livekit_bp.route("/end-session", methods=['POST'])
async def end_session():  # Make this async too
    data = request.get_json()
    room_name = data.get('room_name')
    if not room_name:
        return jsonify({"error": "room_name is required"}), 400
        
    try:
        lk_api = LiveKitAPI(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
        
        # Now we can use await directly
        await lk_api.room.delete_room(DeleteRoomRequest(room=room_name))
        
        return jsonify({"success": True, "message": "Session ended successfully"})
        
    except Exception as e:
        print(f"Error ending session: {e}")
        return jsonify({"success": True, "message": "Session ended"})
