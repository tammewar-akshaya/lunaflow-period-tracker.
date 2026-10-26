from flask import Flask, jsonify
from config import Config
from app.extensions import db, migrate, jwt, limiter, cors
from app.utils.logger import configure_logging

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)
    
    # Configure CORS - allow frontend to connect seamlessly
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": "*"}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "X-Requested-With"]
    )

    # Health and credential data scrubbing logger
    configure_logging(app)

    # Register Blueprints
    from app.routes.auth import auth_bp
    from app.routes.periods import periods_bp
    from app.routes.wellness import wellness_bp
    from app.routes.user import user_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(periods_bp)
    app.register_blueprint(wellness_bp)
    app.register_blueprint(user_bp)

    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'app': 'LunaFlow Backend API',
            'version': '1.0.0'
        }), 200

    # Global Error Handlers
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({'error': getattr(e, 'description', 'Bad Request')}), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({'error': 'Unauthorized access.'}), 401

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Endpoint not found.'}), 404

    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({'error': f'Rate limit exceeded: {e.description}'}), 429

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'error': 'An internal server error occurred.'}), 500

    return app
