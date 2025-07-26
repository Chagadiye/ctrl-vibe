import os
import json
import base64
from io import BytesIO
from quickdraw import QuickDrawData

# Load duel words from content JSON
json_path = os.path.join(os.path.dirname(__file__), "..", "content", "duel_words.json")

def load_words():
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("words", [])
    except Exception as e:
        print(f"[duel_manager] Error loading JSON: {e}")
        return []

WORDS = load_words()
qd = QuickDrawData()  # Uses .quickdrawcache/ by default

def get_base64_image(label: str) -> str:
    try:
        drawing = qd.get_drawing(label)
        img = drawing.image

        buffer = BytesIO()
        img.save(buffer, format="PNG")
        encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{encoded}"
    except Exception as e:
        print(f"[duel_manager] Failed to fetch drawing for '{label}': {e}")
        return None

def get_round(round_id: int):
    if 0 <= round_id < len(WORDS):
        entry = WORDS[round_id]
        image_data = get_base64_image(entry["label"])
        if not image_data:
            return None

        return {
            "kannada": entry["kannada"],
            "roman": entry["roman"],
            "letters": entry["letters"],
            "image_base64": image_data
        }
    return None
