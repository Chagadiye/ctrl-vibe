# backend/core/lesson_manager.py
import json
import os

# Construct the path to the lessons.json file
current_dir = os.path.dirname(__file__)
json_file_path = os.path.join(current_dir, '..', 'content', 'lessons.json')

def load_lesson_data():
    """Loads the lesson data from the JSON file."""
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: {json_file_path} not found.")
        return {"tracks": []}
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {json_file_path}.")
        return {"tracks": []}

def get_all_tracks():
    """Returns a list of all available learning tracks."""
    data = load_lesson_data()
    tracks = data.get("tracks", [])
    
    # Add lesson count and completion info
    for track in tracks:
        track['lesson_count'] = len(track.get('lessons', []))
        track['has_simulation'] = 'simulation' in track
    
    return tracks

def get_track_by_id(track_id: str):
    """Returns a single track by its ID."""
    tracks = get_all_tracks()
    for track in tracks:
        if track['id'] == track_id:
            return track
    return None

def get_lesson_by_id(track_id: str, lesson_id: str):
    """Returns a specific lesson."""
    track = get_track_by_id(track_id)
    if not track:
        return None
    
    for lesson in track.get('lessons', []):
        if lesson['id'] == lesson_id:
            return {
                'track_id': track_id,
                'track_name': track['name'],
                'lesson': lesson
            }
    return None

def get_lesson_types():
    """Returns all available lesson types."""
    return [
        "mcq",
        "repeat_after_me",
        "fill_in_blank",
        "word_matching",
        "listening_comprehension",
        "translation",
        "sentence_building"
    ]