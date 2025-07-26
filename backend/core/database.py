# backend/core/database.py
from flask_pymongo import PyMongo
from pymongo import MongoClient
from config import MONGODB_URI

mongo = None

def init_db(app):
    """Initialize MongoDB connection with Flask app"""
    global mongo
    app.config["MONGO_URI"] = MONGODB_URI
    mongo = PyMongo(app)
    return mongo

def get_db():
    """Get database instance for non-Flask contexts"""
    client = MongoClient(MONGODB_URI)
    return client.get_database()

# Collection names
USERS_COLLECTION = "users"
LESSON_PROGRESS_COLLECTION = "lesson_progress"
SIMULATION_HISTORY_COLLECTION = "simulation_history"
ACHIEVEMENTS_COLLECTION = "achievements"
LEADERBOARD_COLLECTION = "leaderboard"