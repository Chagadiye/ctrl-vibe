# backend/test_livekit.py
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_livekit_config():
    """Test LiveKit configuration"""
    try:
        from config import LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL
        print(f"✅ Config loaded:")
        print(f"   API Key: {LIVEKIT_API_KEY[:10]}..." if LIVEKIT_API_KEY else "   API Key: None")
        print(f"   Secret: {LIVEKIT_API_SECRET[:10]}..." if LIVEKIT_API_SECRET else "   Secret: None")
        print(f"   URL: {LIVEKIT_URL}")
        
        if not all([LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL]):
            print("❌ Missing LiveKit credentials!")
            return False
            
        return True
    except Exception as e:
        print(f"❌ Config error: {e}")
        return False

def test_jwt_creation():
    """Test JWT token creation"""
    try:
        from services.livekit_service import LiveKitService
        
        service = LiveKitService()
        token = service.create_room_token(
            room_name="test_room",
            participant_name="test_user"
        )
        
        print(f"✅ Token created: {token[:50]}...")
        
        # Decode and verify token
        import jwt
        decoded = jwt.decode(token, options={"verify_signature": False})
        print(f"✅ Token payload: {decoded}")
        
        return True
    except Exception as e:
        print(f"❌ JWT creation failed: {e}")
        return False

async def test_room_creation():
    """Test room creation"""
    try:
        from services.livekit_service import LiveKitService
        
        service = LiveKitService()
        result = await service.create_room(
            room_name="test_room_123",
            metadata={"test": True}
        )
        
        print(f"✅ Room creation result: {result}")
        return True
    except Exception as e:
        print(f"❌ Room creation failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing LiveKit Configuration...")
    
    if not test_livekit_config():
        print("\n❌ Fix your .env file first!")
        print("Required:")
        print("LIVEKIT_URL=wss://your-project.livekit.cloud")
        print("LIVEKIT_API_KEY=your-api-key")
        print("LIVEKIT_API_SECRET=your-api-secret")
        sys.exit(1)
    
    if not test_jwt_creation():
        print("\n❌ JWT token creation failed!")
        sys.exit(1)
    
    import asyncio
    if not asyncio.run(test_room_creation()):
        print("\n❌ Room creation failed!")
        sys.exit(1)
    
    print("\n🎉 All tests passed! LiveKit should work now.")