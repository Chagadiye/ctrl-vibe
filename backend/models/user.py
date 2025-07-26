# backend/models/user.py
from datetime import datetime
from bson import ObjectId

class User:
    def __init__(self, username, email=None):
        self.username = username
        self.email = email
        self.xp = 0
        self.level = 1
        self.streak = 0
        self.last_active = datetime.utcnow()
        self.completed_lessons = []
        self.achievements = []
        self.created_at = datetime.utcnow()
        
    def to_dict(self):
        return {
            "username": self.username,
            "email": self.email,
            "xp": self.xp,
            "level": self.level,
            "streak": self.streak,
            "last_active": self.last_active,
            "completed_lessons": self.completed_lessons,
            "achievements": self.achievements,
            "created_at": self.created_at
        }

class LessonProgress:
    def __init__(self, user_id, track_id, lesson_id):
        self.user_id = ObjectId(user_id)
        self.track_id = track_id
        self.lesson_id = lesson_id
        self.attempts = 0
        self.best_score = 0
        self.completed = False
        self.completed_at = None
        self.time_spent = 0  # in seconds
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        
    def to_dict(self):
        return {
            "user_id": str(self.user_id),
            "track_id": self.track_id,
            "lesson_id": self.lesson_id,
            "attempts": self.attempts,
            "best_score": self.best_score,
            "completed": self.completed,
            "completed_at": self.completed_at,
            "time_spent": self.time_spent,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

class SimulationHistory:
    def __init__(self, user_id, simulation_type):
        self.user_id = ObjectId(user_id)
        self.simulation_type = simulation_type
        self.conversation = []
        self.score = 0
        self.feedback = {}
        self.duration = 0  # in seconds
        self.created_at = datetime.utcnow()
        
    def to_dict(self):
        return {
            "user_id": str(self.user_id),
            "simulation_type": self.simulation_type,
            "conversation": self.conversation,
            "score": self.score,
            "feedback": self.feedback,
            "duration": self.duration,
            "created_at": self.created_at
        }