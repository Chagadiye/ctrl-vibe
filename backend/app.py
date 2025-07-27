# backend/app.py
from flask import Flask, jsonify
from flask_cors import CORS

def create_app():
    """Creates and configures the Flask application."""
    app = Flask(__name__)
    
    # Configure CORS properly for development
    CORS(app, 
         origins=["http://localhost:3000", "http://127.0.0.1:3000"],
         allow_headers=["Content-Type", "Authorization"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    # Add a root route for testing
    @app.route('/')
    def index():
        return jsonify({
            "message": "Ctrl-Vibe API is running!",
            "status": "ok",
            "available_endpoints": [
                "/api/status",
                "/api/tracks", 
                "/api/speech/synthesize",
                "/api/speech/transcribe",
                "/api/speech/evaluate",
                "/api/livekit/create-session",
                "/api/livekit/end-session"
            ]
        })
    
    # Import and register blueprints with error handling
    try:
        from api.routes import api_bp
        app.register_blueprint(api_bp, url_prefix='/api')
        print("✅ api_bp registered successfully")
    except Exception as e:
        print(f"❌ Failed to register api_bp: {e}")
    
    try:
        from api.game_routes import game_bp
        app.register_blueprint(game_bp, url_prefix='/api/game')
        print("✅ game_bp registered successfully")
    except Exception as e:
        print(f"❌ Failed to register game_bp: {e}")
    
    try:
        from api.user_routes import user_bp
        app.register_blueprint(user_bp, url_prefix='/api/user')
        print("✅ user_bp registered successfully")
    except Exception as e:
        print(f"❌ Failed to register user_bp: {e}")

    try:
        from api.livekit_routes import livekit_bp
        app.register_blueprint(livekit_bp, url_prefix='/api/livekit')
        print("✅ LiveKit routes registered")
    except ImportError as e:
        print(f"⚠️  LiveKit routes not available: {e}")
        print("Voice simulations will use fallback mode")
    
    # Initialize MongoDB with error handling
    try:
        from core.database import init_db
        init_db(app)
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize database: {e}")
    
    return app

if __name__ == '__main__':
    try:
        from config import PORT, FLASK_ENV
        print(f"Config loaded: PORT={PORT}, FLASK_ENV={FLASK_ENV}")
    except Exception as e:
        print(f"❌ Config import failed: {e}")
        PORT = 5001
        FLASK_ENV = 'development'
        print(f"Using defaults: PORT={PORT}, FLASK_ENV={FLASK_ENV}")
    
    app = create_app()
    print(f"Starting Flask app on http://127.0.0.1:{PORT}")
    
    # List all registered routes
    print("\n📍 Registered routes:")
    for rule in app.url_map.iter_rules():
        methods = ','.join(rule.methods - {'HEAD', 'OPTIONS'})
        print(f"  {rule.rule} [{methods}]")
    
    app.run(debug=(FLASK_ENV == 'development'), port=PORT, host='0.0.0.0')