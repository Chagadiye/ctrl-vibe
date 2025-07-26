
import json
import os

# Construct the path to the lessons.json file
# This makes sure the file is found regardless of where the script is run from
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
    return data.get("tracks", [])

def get_track_by_id(track_id: str):
    """Returns a single track by its ID."""
    tracks = get_all_tracks()
    for track in tracks:
        if track['id'] == track_id:
            return track
    return None
