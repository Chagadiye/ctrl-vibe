# backend/api/game_routes.py
from flask import Blueprint, jsonify, request
from core.database import mongo, USERS_COLLECTION, LESSON_PROGRESS_COLLECTION, LEADERBOARD_COLLECTION
from services.gamification import GamificationService
from datetime import datetime
from bson import ObjectId

game_bp = Blueprint('game', __name__)

@game_bp.route('/submit-lesson', methods=['POST'])
def submit_lesson():
    """Submit lesson results and calculate XP/achievements"""
    data = request.get_json()
    
    user_id = data.get('user_id')
    track_id = data.get('track_id')
    lesson_id = data.get('lesson_id')
    score = data.get('score', 0)
    time_spent = data.get('time_spent', 0)
    answers = data.get('answers', {})
    
    if not all([user_id, track_id, lesson_id]):
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        # Get user data
        user = mongo.db[USERS_COLLECTION].find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Check if this is first attempt
        existing_progress = mongo.db[LESSON_PROGRESS_COLLECTION].find_one({
            "user_id": ObjectId(user_id),
            "track_id": track_id,
            "lesson_id": lesson_id
        })
        
        first_attempt = existing_progress is None
        
        # Calculate XP earned
        xp_earned = GamificationService.calculate_lesson_xp(score, time_spent, first_attempt)
        
        # Update or create lesson progress
        progress_update = {
            "user_id": ObjectId(user_id),
            "track_id": track_id,
            "lesson_id": lesson_id,
            "best_score": max(score, existing_progress.get('best_score', 0) if existing_progress else 0),
            "attempts": (existing_progress.get('attempts', 0) if existing_progress else 0) + 1,
            "completed": score >= 80,  # 80% to complete
            "time_spent": time_spent,
            "last_attempt": datetime.utcnow(),
            "answers": answers
        }
        
        if score >= 80 and (not existing_progress or not existing_progress.get('completed')):
            progress_update['completed_at'] = datetime.utcnow()
        
        mongo.db[LESSON_PROGRESS_COLLECTION].update_one(
            {"user_id": ObjectId(user_id), "track_id": track_id, "lesson_id": lesson_id},
            {"$set": progress_update},
            upsert=True
        )
        
        # Update user stats
        user_updates = {
            "xp": user.get('xp', 0) + xp_earned,
            "last_active": datetime.utcnow()
        }
        
        # Update streak
        if GamificationService.calculate_streak(user.get('last_active')):
            user_updates['streak'] = user.get('streak', 0) + 1
        else:
            user_updates['streak'] = 1
        
        # Calculate new level
        new_level = GamificationService.calculate_level(user_updates['xp'])
        if new_level > user.get('level', 1):
            user_updates['level'] = new_level
            level_up = True
        else:
            level_up = False
        
        # Check for new achievements
        user['xp'] = user_updates['xp']
        user['streak'] = user_updates['streak']
        user['level'] = new_level
        
        new_achievements = GamificationService.check_achievements(
            user, 
            'lesson_completed' if score >= 80 else 'lesson_attempted',
            {'score': score, 'lesson_id': lesson_id}
        )
        
        # Award achievement XP
        achievement_xp = sum(ach['xp_reward'] for ach in new_achievements)
        if achievement_xp > 0:
            user_updates['xp'] += achievement_xp
            xp_earned += achievement_xp
        
        # Add achievements to user
        if new_achievements:
            current_achievements = user.get('achievements', [])
            for ach in new_achievements:
                if ach['id'] not in current_achievements:
                    current_achievements.append(ach['id'])
            user_updates['achievements'] = current_achievements
        
        # Add completed lesson if score >= 80
        if score >= 80:
            completed_lessons = user.get('completed_lessons', [])
            lesson_key = f"{track_id}:{lesson_id}"
            if lesson_key not in completed_lessons:
                completed_lessons.append(lesson_key)
                user_updates['completed_lessons'] = completed_lessons
        
        # Update user in database
        mongo.db[USERS_COLLECTION].update_one(
            {"_id": ObjectId(user_id)},
            {"$set": user_updates}
        )
        
        # Update leaderboard
        mongo.db[LEADERBOARD_COLLECTION].update_one(
            {"user_id": ObjectId(user_id)},
            {
                "$set": {
                    "username": user.get('username'),
                    "xp": user_updates['xp'],
                    "level": new_level,
                    "streak": user_updates['streak'],
                    "updated_at": datetime.utcnow()
                }
            },
            upsert=True
        )
        
        # Calculate XP for next level
        xp_needed, next_level_xp = GamificationService.xp_for_next_level(user_updates['xp'])
        
        return jsonify({
            "success": True,
            "xp_earned": xp_earned,
            "total_xp": user_updates['xp'],
            "level": new_level,
            "level_up": level_up,
            "streak": user_updates['streak'],
            "new_achievements": new_achievements,
            "xp_for_next_level": xp_needed,
            "next_level_total": next_level_xp,
            "lesson_completed": score >= 80
        }), 200
        
    except Exception as e:
        print(f"Error in submit_lesson: {e}")
        return jsonify({"error": "Internal server error"}), 500

@game_bp.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    """Get global leaderboard"""
    try:
        # Get top 100 users
        leaderboard = list(mongo.db[LEADERBOARD_COLLECTION].find(
            {},
            {"_id": 0, "user_id": 0}  # Exclude these fields
        ).sort("xp", -1).limit(100))
        
        return jsonify({
            "leaderboard": leaderboard,
            "total_players": mongo.db[USERS_COLLECTION].count_documents({})
        }), 200
        
    except Exception as e:
        print(f"Error getting leaderboard: {e}")
        return jsonify({"error": "Internal server error"}), 500

@game_bp.route('/achievements', methods=['GET'])
def get_all_achievements():
    """Get list of all possible achievements"""
    return jsonify({
        "achievements": list(GamificationService.ACHIEVEMENTS.values())
    }), 200

@game_bp.route('/user/<user_id>/progress', methods=['GET'])
def get_user_progress(user_id):
    """Get detailed progress for a user"""
    try:
        # Get user data
        user = mongo.db[USERS_COLLECTION].find_one(
            {"_id": ObjectId(user_id)},
            {"password": 0}  # Exclude password if it exists
        )
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Get lesson progress
        lesson_progress = list(mongo.db[LESSON_PROGRESS_COLLECTION].find(
            {"user_id": ObjectId(user_id)}
        ))
        
        # Convert ObjectIds to strings
        for progress in lesson_progress:
            progress['_id'] = str(progress['_id'])
            progress['user_id'] = str(progress['user_id'])
        
        # Get user's rank
        user_rank = mongo.db[LEADERBOARD_COLLECTION].count_documents({
            "xp": {"$gt": user.get('xp', 0)}
        }) + 1
        
        # Calculate progress to next level
        xp_needed, next_level_xp = GamificationService.xp_for_next_level(user.get('xp', 0))
        current_level_xp = LEVELS.get(user.get('level', 1), 0)
        progress_percentage = ((user.get('xp', 0) - current_level_xp) / 
                            (next_level_xp - current_level_xp) * 100) if next_level_xp > current_level_xp else 100
        
        # Get achievement details
        achievement_details = []
        for ach_id in user.get('achievements', []):
            if ach_id in GamificationService.ACHIEVEMENTS:
                achievement_details.append(GamificationService.ACHIEVEMENTS[ach_id])
        
        return jsonify({
            "user": {
                "_id": str(user['_id']),
                "username": user.get('username'),
                "xp": user.get('xp', 0),
                "level": user.get('level', 1),
                "streak": user.get('streak', 0),
                "completed_lessons": user.get('completed_lessons', []),
                "achievements": achievement_details,
                "last_active": user.get('last_active'),
                "created_at": user.get('created_at')
            },
            "lesson_progress": lesson_progress,
            "stats": {
                "global_rank": user_rank,
                "xp_to_next_level": xp_needed,
                "level_progress_percentage": progress_percentage,
                "total_lessons_completed": len(user.get('completed_lessons', [])),
                "perfect_lessons": sum(1 for p in lesson_progress if p.get('best_score', 0) == 100)
            }
        }), 200
        
    except Exception as e:
        print(f"Error getting user progress: {e}")
        return jsonify({"error": "Internal server error"}), 500