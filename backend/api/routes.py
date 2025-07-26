from flask import Blueprint, jsonify, request
from core import lesson_manager, simulation_manager, duel_manager

api_bp = Blueprint('api', __name__)


@api_bp.route('/duel/round/<int:round_id>', methods=['GET'])
def get_duel_round(round_id):
    data = duel_manager.get_round(round_id)
    if not data:
        return jsonify({"error": "Invalid round or image issue"}), 404
    return jsonify(data), 200

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

@api_bp.route('/simulation/start', methods=['POST'])
def start_sim():
    """Endpoint to start a new simulation."""
    data = request.get_json()
    simulation_type = data.get('simulation_type')
    if not simulation_type:
        return jsonify({"error": "simulation_type is required"}), 400

    initial_state = simulation_manager.start_simulation(simulation_type)
    return jsonify(initial_state), 200

@api_bp.route('/simulation/converse', methods=['POST'])
def converse_sim():
    """Endpoint to handle a conversational turn in a simulation."""
    # This expects a multipart/form-data request
    # with a JSON payload for 'data' and an audio file for 'audio'
    
    # Check if the post request has the file part
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
    except (json.JSONDecodeError, KeyError):
        return jsonify({"error": "Invalid or missing JSON data in 'data' field"}), 400

    audio_bytes = audio_file.read()
    
    response_state = simulation_manager.process_user_turn(simulation_type, history, audio_bytes)
    
    if "error" in response_state:
        return jsonify(response_state), 400
        
    return jsonify(response_state), 200
