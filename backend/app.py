from flask import Flask
from flask_cors import CORS
from api.routes import api_bp

def create_app():
    """Creates and configures the Flask application."""
    app = Flask(__name__)
    
    # Enable CORS to allow your frontend to communicate with this backend
    CORS(app,
         origins=["https://kannadagotta.wouldsoftware.com", "localhost:5001"],
         supports_credentials=True)
    
    # Register the blueprint that contains all our API routes
    app.register_blueprint(api_bp, url_prefix='/api')
    
    return app

if __name__ == '__main__':
    app = create_app()
    # Running in debug mode is convenient for development
    app.run(debug=True, host='0.0.0.0', port=5001)
