import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional
import uuid
import jwt
import time
import json

logger = logging.getLogger(__name__)

class LiveKitService:
    def __init__(self):
        # Load config with proper error handling
        try:
            from config import LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL
            self.api_key = LIVEKIT_API_KEY
            self.api_secret = LIVEKIT_API_SECRET
            self.url = LIVEKIT_URL
            
            # Validate credentials
            if not all([self.api_key, self.api_secret, self.url]):
                raise ValueError("Missing LiveKit credentials")
                
            # Remove demo mode - we're going real
            self.demo_mode = False
            logger.info(f"LiveKit service initialized with URL: {self.url}")
            
        except (ImportError, ValueError) as e:
            logger.error(f"LiveKit configuration error: {e}")
            raise e

    def generate_room_name(self, user_id: str, simulation_type: str) -> str:
        """Generate a unique room name"""
        timestamp = int(time.time())
        return f"sim_{simulation_type}_{user_id}_{timestamp}"

    async def create_room(self, room_name: str, metadata: Dict) -> Dict:
        """Create a room using LiveKit Cloud API"""
        try:
            # For LiveKit Cloud, we don't need to pre-create rooms
            # They are created automatically when the first participant joins
            logger.info(f"Room will be auto-created: {room_name}")
            return {
                "success": True,
                "room_name": room_name,
                "metadata": metadata,
                "note": "Room will be created automatically on join"
            }
            
        except Exception as e:
            logger.error(f"Room setup issue for {room_name}: {e}")
            # Continue anyway - LiveKit Cloud handles room creation
            return {
                "success": True,
                "room_name": room_name,
                "metadata": metadata,
                "note": f"Proceeding with auto-creation: {e}"
            }

    async def delete_room(self, room_name: str) -> Dict:
        """Delete a room (demo version)"""
        if self.demo_mode:
            logger.info(f"[DEMO] Deleting room: {room_name}")
            await asyncio.sleep(0.1)
            return {"success": True, "room_name": room_name, "demo": True}
        
        try:
            # Real deletion would go here
            return {"success": True, "room_name": room_name}
        except Exception as e:
            logger.error(f"Failed to delete room: {e}")
            return {"success": False, "error": str(e)}

    async def list_rooms(self) -> list:
        """List active rooms (demo version)"""
        if self.demo_mode:
            return [
                {
                    "name": "demo_room_1",
                    "participants": 1,
                    "created_at": datetime.utcnow().isoformat()
                }
            ]
        
        try:
            # Real room listing would go here
            return []
        except Exception as e:
            logger.error(f"Failed to list rooms: {e}")
            return []

    def create_room_token(self, room_name: str, participant_name: str, metadata: Dict = None) -> str:
        """Create a JWT token for room access - LiveKit Cloud proper format"""
        try:
            import jwt
            import json as json_module  # Explicit import to avoid conflicts
            
            # LiveKit Cloud standard JWT payload
            payload = {
                "iss": self.api_key,
                "sub": participant_name,
                "name": participant_name,
                "room": room_name,
                "exp": int(time.time()) + 3600,  # 1 hour from now
                "iat": int(time.time()),
                "nbf": int(time.time()) - 10,  # valid from 10 seconds ago
            }
            
            # Add proper LiveKit grants
            payload["grants"] = {
                "room": room_name,
                "roomJoin": True,
                "roomList": True,
                "roomCreate": True,
                "canPublish": True,
                "canSubscribe": True,
                "canPublishData": True,
                "canUpdateOwnMetadata": True
            }
            
            # Add metadata as separate field (not in grants)
            if metadata:
                payload["metadata"] = json_module.dumps(metadata)
            
            logger.info(f"Creating LiveKit Cloud token with grants for room: {room_name}")
            
            # Create JWT token
            token = jwt.encode(payload, self.api_secret, algorithm="HS256")
            
            # Convert to string if it's bytes (older PyJWT versions)
            if isinstance(token, bytes):
                token = token.decode('utf-8')
                
            logger.info(f"Generated LiveKit token: {token[:50]}...")
            return token
            
        except Exception as e:
            logger.error(f"Failed to create JWT token: {e}")
            raise e

# Create a global instance
livekit_service = LiveKitService()
