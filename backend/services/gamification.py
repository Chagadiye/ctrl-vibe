# backend/services/gamification.py
from datetime import datetime, timedelta
from config import XP_PER_CORRECT_ANSWER, XP_PER_LESSON_COMPLETION, XP_PER_PERFECT_LESSON, LEVELS

class GamificationService:
    
    ACHIEVEMENTS = {
        "first_lesson": {
            "id": "first_lesson",
            "name": "First Steps",
            "description": "Complete your first lesson",
            "icon": "🎯",
            "xp_reward": 20
        },
        "streak_3": {
            "id": "streak_3",
            "name": "On Fire!",
            "description": "Maintain a 3-day streak",
            "icon": "🔥",
            "xp_reward": 50
        },
        "streak_7": {
            "id": "streak_7",
            "name": "Week Warrior",
            "description": "Maintain a 7-day streak",
            "icon": "💪",
            "xp_reward": 100
        },
        "perfect_10": {
            "id": "perfect_10",
            "name": "Perfectionist",
            "description": "Get perfect scores on 10 lessons",
            "icon": "⭐",
            "xp_reward": 200
        },
        "night_owl": {
            "id": "night_owl",
            "name": "Night Owl",
            "description": "Complete a lesson after 10 PM",
            "icon": "🦉",
            "xp_reward": 30
        },
        "early_bird": {
            "id": "early_bird",
            "name": "Early Bird",
            "description": "Complete a lesson before 7 AM",
            "icon": "🐦",
            "xp_reward": 30
        },
        "simulation_master": {
            "id": "simulation_master",
            "name": "Conversation Pro",
            "description": "Complete 5 simulations with high scores",
            "icon": "🗣️",
            "xp_reward": 150
        },
        "kannada_champion": {
            "id": "kannada_champion",
            "name": "Kannada Champion",
            "description": "Reach level 10",
            "icon": "🏆",
            "xp_reward": 500
        }
    }
    
    @staticmethod
    def calculate_level(xp: int) -> int:
        """Calculate user level based on XP"""
        for level, required_xp in sorted(LEVELS.items(), reverse=True):
            if xp >= required_xp:
                return level
        return 1
    
    @staticmethod
    def xp_for_next_level(current_xp: int) -> tuple:
        """Calculate XP needed for next level"""
        current_level = GamificationService.calculate_level(current_xp)
        if current_level >= max(LEVELS.keys()):
            return 0, 0  # Max level reached
        
        next_level = current_level + 1
        xp_needed = LEVELS[next_level] - current_xp
        return xp_needed, LEVELS[next_level]
    
    @staticmethod
    def calculate_streak(last_active: datetime) -> bool:
        """Check if user maintains their streak"""
        if not last_active:
            return True
        
        now = datetime.utcnow()
        difference = now - last_active
        
        # Allow up to 36 hours to maintain streak
        return difference <= timedelta(hours=36)
    
    @staticmethod
    def check_achievements(user_data: dict, action: str, context: dict = None) -> list:
        """Check if user earned any new achievements"""
        new_achievements = []
        current_achievements = user_data.get('achievements', [])
        
        # First lesson
        if action == "lesson_completed" and len(user_data.get('completed_lessons', [])) == 1:
            if "first_lesson" not in current_achievements:
                new_achievements.append(ACHIEVEMENTS["first_lesson"]) 
        
        # Streak achievements
        streak = user_data.get('streak', 0)
        if streak >= 3 and "streak_3" not in current_achievements:
            new_achievements.append(ACHIEVEMENTS["streak_3"])
        if streak >= 7 and "streak_7" not in current_achievements:
            new_achievements.append(ACHIEVEMENTS["streak_7"])
        
        # Time-based achievements
        current_hour = datetime.utcnow().hour
        if action == "lesson_completed":
            if current_hour >= 22 or current_hour < 5:
                if "night_owl" not in current_achievements:
                    new_achievements.append(ACHIEVEMENTS["night_owl"])
            elif current_hour < 7:
                if "early_bird" not in current_achievements:
                    new_achievements.append(ACHIEVEMENTS["early_bird"])
        
        # Level achievement
        if user_data.get('level', 1) >= 10 and "kannada_champion" not in current_achievements:
            new_achievements.append(ACHIEVEMENTS["kannada_champion"])
        
        return new_achievements
    
    @staticmethod
    def calculate_lesson_xp(score: float, time_spent: int, first_attempt: bool) -> int:
        """Calculate XP earned for a lesson"""
        base_xp = int(score * XP_PER_LESSON_COMPLETION / 100)
        
        # Bonus for perfect score
        if score == 100:
            base_xp += XP_PER_PERFECT_LESSON - XP_PER_LESSON_COMPLETION
        
        # Bonus for first attempt
        if first_attempt:
            base_xp = int(base_xp * 1.5)
        
        # Speed bonus (if completed under 2 minutes)
        if time_spent < 120:
            base_xp = int(base_xp * 1.2)
        
        return base_xp