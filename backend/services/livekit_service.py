# backend/services/livekit_service.py
import os
from livekit import api
from livekit.api import AccessToken, VideoGrants
import time
import json
import logging
import aiohttp
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class LiveKitService:
    def __init__(self):
        self.api_key = os.getenv('LIVEKIT_API_KEY')
        self.api_secret = os.getenv('LIVEKIT_API_SECRET')
        self.url = os.getenv('LIVEKIT_URL')
        
        # Extract HTTP URL from WebSocket URL
        self.http_url = self.url.replace('wss://', 'https://').replace('ws://', 'http://')
    
    def create_room_token(self, room_name: str, participant_name: str, metadata: dict = None) -> str:
        """Create an access token for a participant to join a room"""
        # Create access token
        token = AccessToken(self.api_key, self.api_secret)
        token.identity = participant_name
        token.name = participant_name
        
        # Set video grants
        token.add_grant(VideoGrants(
            room_join=True,
            room=room_name,
            can_publish=True,
            can_subscribe=True,
            can_publish_data=True
        ))
        
        # Add metadata if provided
        if metadata:
            token.metadata = json.dumps(metadata)
        
        # Set expiration (1 hour)
        token.ttl = 3600
        
        return token.to_jwt()
    
    async def create_room(self, room_name: str, metadata: dict = None) -> dict:
        """Create a new LiveKit room using HTTP API"""
        try:
            # For now, rooms are created automatically when participants join
            # This is a placeholder that returns success
            return {
                "success": True,
                "room_name": room_name,
                "room_id": room_name
            }
        except Exception as e:
            logger.error(f"Error creating room: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def delete_room(self, room_name: str):
        """Delete a LiveKit room"""
        try:
            # In development, rooms auto-expire
            # For production, you'd use the LiveKit HTTP API
            return {"success": True}
        except Exception as e:
            logger.error(f"Error deleting room: {e}")
            return {"success": False, "error": str(e)}
    
    async def list_rooms(self) -> list:
        """List all active rooms"""
        try:
            # Placeholder - in production, use LiveKit HTTP API
            return []
        except Exception as e:
            logger.error(f"Error listing rooms: {e}")
            return []
    
    def generate_room_name(self, user_id: str, simulation_type: str) -> str:
        """Generate a unique room name"""
        timestamp = int(time.time())
        return f"{simulation_type}_{user_id}_{timestamp}"