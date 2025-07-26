# backend/api/routes_test.py (create this as a separate file first)
from flask import Blueprint, jsonify, request
import json

# Create a test blueprint
api_bp = Blueprint('api', __name__)

@api_bp.route('/status', methods=['GET'])
def status():
    """A simple endpoint to check if the server is running."""
    return jsonify({"status": "ok"}), 200

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
        "speech_route_count": len(speech_routes)
    })

@api_bp.route('/test-basic', methods=['GET'])
def test_basic():
    return jsonify({"message": "Basic test works!"})

# Test OpenAI import without actually using it
@api_bp.route('/test-import', methods=['GET'])
def test_import():
    try:
        # Just test the import
        from services.openai_client import OpenAIService
        return jsonify({"message": "OpenAI import successful!"})
    except ImportError as e:
        return jsonify({"error": f"Import failed: {str(e)}"})
    except Exception as e:
        return jsonify({"error": f"Other error: {str(e)}"})

# Simple speech endpoint without complex logic
@api_bp.route('/speech/test', methods=['POST'])
def speech_test():
    try:
        data = request.get_json()
        return jsonify({"message": "Speech endpoint reached!", "data_received": data})
    except Exception as e:
        return jsonify({"error": str(e)})