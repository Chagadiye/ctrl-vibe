# backend/api/routes.py
from flask import Blueprint, jsonify, request, send_file
from core import lesson_manager, simulation_manager
from services.openai_client import OpenAIService
from services.content_filter import ContentFilter
import json
import io

api_bp = Blueprint('api', __name__)

@api_bp.route('/status', methods=['GET'])
def status():
    """A simple endpoint to check if the server is running."""
    return jsonify({"status": "ok"}), 200

@api_bp.route('/tracks', methods=['GET'])
def get_tracks():
    """Endpoint to get all learning tracks."""
    tracks = lesson_manager.get_all_tracks()
    return jsonify(tracks), 200

@api_bp.route('/tracks/<string:track_id>', methods=['GET'])
def get_track(track_id):
    """Endpoint to get a specific track and its lessons."""
    track = lesson_manager.get_track_by_id(track_id)
    if track:
        return jsonify(track), 200
    return jsonify({"error": "Track not found"}), 404

@api_bp.route('/lesson/<string:track_id>/<string:lesson_id>', methods=['GET'])
def get_lesson(track_id, lesson_id):
    """Get a specific lesson with generated audio if needed"""
    track = lesson_manager.get_track_by_id(track_id)
    if not track:
        return jsonify({"error": "Track not found"}), 404
    
    lesson = next((l for l in track['lessons'] if l['id'] == lesson_id), None)
    if not lesson:
        return jsonify({"error": "Lesson not found"}), 404
    
    # Generate audio for certain lesson types
    if lesson['type'] in ['repeat_after_me', 'listening_comprehension']:
        if lesson['type'] == 'repeat_after_me':
            text = lesson['content']['kannada_phrase']
        else:
            text = lesson['content'].get('audio_text', '')
        
        if text and not lesson['content'].get('audio_url'):
            # Generate audio using OpenAI TTS
            audio_url = OpenAIService.text_to_speech(text)
            lesson['content']['audio_url'] = audio_url
    
    return jsonify(lesson), 200

@api_bp.route('/speech/synthesize', methods=['POST'])
def synthesize_speech():
    """Synthesize speech from text"""
    data = request.get_json()
    text = data.get('text')
    voice = data.get('voice', 'alloy')
    
    if not text:
        return jsonify({"error": "No text provided"}), 400
    
    try:
        audio_url = OpenAIService.text_to_speech(text, voice)
        return jsonify({"audio_url": audio_url}), 200
    except Exception as e:
        print(f"Error in TTS: {e}")
        return jsonify({"error": "Failed to synthesize speech"}), 500

@api_bp.route('/speech/transcribe', methods=['POST'])
def transcribe_speech():
    """Transcribe audio to text"""
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
    
    audio_file = request.files['audio']
    language = request.form.get('language', 'kn')
    
    try:
        audio_bytes = audio_file.read()
        transcription = OpenAIService.transcribe_audio(audio_bytes, language)
        
        return jsonify({
            "transcription": transcription,
            "language": language
        }), 200
    except Exception as e:
        print(f"Error in transcription: {e}")
        return jsonify({"error": "Failed to transcribe audio"}), 500

@api_bp.route('/speech/evaluate', methods=['POST'])
def evaluate_pronunciation():
    """Evaluate user's pronunciation"""
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
    
    audio_file = request.files['audio']
    original_text = request.form.get('original_text')
    
    if not original_text:
        return jsonify({"error": "No original text provided"}), 400
    
    try:
        audio_bytes = audio_file.read()
        evaluation = OpenAIService.evaluate_pronunciation(original_text, audio_bytes)
        
        return jsonify(evaluation), 200
    except Exception as e:
        print(f"Error in pronunciation evaluation: {e}")
        return jsonify({"error": "Failed to evaluate pronunciation"}), 500

@api_bp.route('/simulation/start', methods=['POST'])
def start_sim():
    """Endpoint to start a new simulation."""
    data = request.get_json()
    simulation_type = data.get('simulation_type')
    user_id = data.get('user_id')
    
    if not simulation_type:
        return jsonify({"error": "simulation_type is required"}), 400
    
    # Check if simulation requires age verification
    if simulation_type == 'road_rage_sim':
        age_verified = data.get('age_verified', False)
        if not age_verified:
            return jsonify({"error": "Age verification required for this simulation"}), 403
    
    initial_state = simulation_manager.start_simulation(simulation_type, user_id)
    return jsonify(initial_state), 200

@api_bp.route('/simulation/converse', methods=['POST'])
def converse_sim():
    """Endpoint to handle a conversational turn in a simulation."""
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file part"}), 400
    
    audio_file = request.files['audio']
    if audio_file.filename == '':
        return jsonify({"error": "No selected audio file"}), 400

    try:
        form_data = request.form.get('data')
        data = json.loads(form_data)
        simulation_type = data.get('simulation_type')
        history = data.get('history', [])
        user_id = data.get('user_id')
    except (json.JSONDecodeError, KeyError):
        return jsonify({"error": "Invalid or missing JSON data in 'data' field"}), 400

    audio_bytes = audio_file.read()
    
    # Apply content filtering for road rage simulation
    if simulation_type == 'road_rage_sim':
        filter_result = ContentFilter.check_audio_content(audio_bytes)
        if filter_result.get('inappropriate'):
            return jsonify({
                "error": "Inappropriate content detected",
                "message": "Please keep the conversation civil"
            }), 400
    
    response_state = simulation_manager.process_user_turn(
        simulation_type, history, audio_bytes, user_id
    )
    
    if "error" in response_state:
        return jsonify(response_state), 400
        
    return jsonify(response_state), 200

@api_bp.route('/validate-answer', methods=['POST'])
def validate_answer():
    """Validate user's answer for various lesson types"""
    data = request.get_json()
    lesson_type = data.get('lesson_type')
    user_answer = data.get('user_answer')
    correct_answer = data.get('correct_answer')
    
    if not all([lesson_type, user_answer, correct_answer]):
        return jsonify({"error": "Missing required fields"}), 400
    
    is_correct = False
    feedback = ""
    
    if lesson_type == 'translation':
        # For translation, we might accept multiple correct answers
        if isinstance(correct_answer, list):
            is_correct = any(ans.lower().strip() == user_answer.lower().strip() 
                           for ans in correct_answer)
        else:
            is_correct = correct_answer.lower().strip() == user_answer.lower().strip()
        
        if not is_correct:
            feedback = f"Close! The correct answer is: {correct_answer[0] if isinstance(correct_answer, list) else correct_answer}"
    
    elif lesson_type == 'fill_in_blank':
        is_correct = correct_answer.lower().strip() == user_answer.lower().strip()
        if not is_correct:
            feedback = f"The correct answer is: {correct_answer}"
    
    elif lesson_type == 'sentence_building':
        # For sentence building, order matters
        user_order = user_answer if isinstance(user_answer, list) else user_answer.split()
        correct_order = correct_answer if isinstance(correct_answer, list) else correct_answer.split()
        is_correct = user_order == correct_order
        if not is_correct:
            feedback = "The word order isn't quite right. Try again!"
    
    return jsonify({
        "is_correct": is_correct,
        "feedback": feedback,
        "score": 100 if is_correct else 0
    }), 200

@api_bp.route('/debug/routes', methods=['GET'])
def debug_routes():
    """Debug endpoint to show all available routes"""
    from flask import current_app
    
    routes = []
    for rule in current_app.url_map.iter_rules():
        routes.append({
            'endpoint': rule.endpoint,
            'methods': list(rule.methods - {'HEAD', 'OPTIONS'}),
            'rule': str(rule)
        })
    
    speech_routes = [r for r in routes if 'speech' in r['rule']]
    
    return jsonify({
        "available_routes": routes,
        "total_routes": len(routes),
        "speech_routes": speech_routes,
        "speech_route_count": len(speech_routes),
        "blueprint_info": "Routes registered with api_bp blueprint"
    })

@api_bp.route('/test-speech-simple', methods=['GET'])
def test_speech_simple():
    return jsonify({"message": "Simple speech test works!"})

@api_bp.route('/test-speech-with-service', methods=['GET']) 
def test_speech_with_service():
    try:
        # Test if OpenAIService can be imported
        from services.openai_client import OpenAIService
        return jsonify({"message": "OpenAIService import works!"})
    except Exception as e:
        return jsonify({"error": f"OpenAIService import failed: {str(e)}"})
    
# Add these debug routes to your existing backend/api/routes.py file

@api_bp.route('/speech/debug-simple', methods=['POST'])
def debug_speech_simple():
    """Simple debug endpoint without OpenAI"""
    try:
        data = request.get_json()
        return jsonify({
            "message": "Speech debug endpoint reached!",
            "received_data": data,
            "status": "success"
        }), 200
    except Exception as e:
        return jsonify({"error": f"Debug endpoint error: {str(e)}"}), 500

@api_bp.route('/speech/debug-openai', methods=['POST'])
def debug_speech_openai():
    """Debug endpoint to test OpenAI import and client"""
    try:
        # Test OpenAI import
        from services.openai_client import OpenAIService
        
        # Test if we can create the client (without making API call)
        data = request.get_json()
        
        return jsonify({
            "message": "OpenAI import successful!",
            "openai_service_loaded": True,
            "received_data": data,
            "status": "success"
        }), 200
    
    except Exception as e:
        return jsonify({
            "error": f"OpenAI debug error: {str(e)}",
            "status": "failed"
        }), 500

@api_bp.route('/speech/debug-config', methods=['GET'])
def debug_speech_config():
    """Debug endpoint to check OpenAI configuration"""
    try:
        from config import OPENAI_API_KEY
        
        # Don't expose the actual key, just check if it exists
        has_key = bool(OPENAI_API_KEY and len(OPENAI_API_KEY) > 10)
        
        return jsonify({
            "openai_key_configured": has_key,
            "key_length": len(OPENAI_API_KEY) if OPENAI_API_KEY else 0,
            "status": "success"
        }), 200
    
    except Exception as e:
        return jsonify({
            "error": f"Config debug error: {str(e)}",
            "status": "failed"
        }), 500
    
@api_bp.route('/speech/test-get', methods=['GET'])
def test_speech_get():
    return jsonify({"message": "Speech GET endpoint works!"})