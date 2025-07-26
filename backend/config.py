# backend/config.py
import os
from dotenv import load_dotenv

load_dotenv()

# API Keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")
LIVEKIT_URL = os.getenv("LIVEKIT_URL")

# Database
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/kannada-learning")

# Application Settings
PORT = int(os.getenv("PORT", 5001))
FLASK_ENV = os.getenv("FLASK_ENV", "development")

# Game Settings
XP_PER_CORRECT_ANSWER = 10
XP_PER_LESSON_COMPLETION = 50
XP_PER_PERFECT_LESSON = 100
LEVELS = {
    1: 0,
    2: 100,
    3: 250,
    4: 500,
    5: 1000,
    6: 2000,
    7: 3500,
    8: 5000,
    9: 7500,
    10: 10000
}

# Content Filtering
INAPPROPRIATE_WORDS = [
    # Add Kannada inappropriate words here for filtering
    # This is just a placeholder - you'll need to add actual words
]