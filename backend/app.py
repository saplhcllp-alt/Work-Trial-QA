from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from routes.auth_routes import auth_bp
from routes.brd_routes import brd_bp
from routes.share_routes import share_bp
from routes.pdf_routes import pdf_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # VULNERABLE CORS: reflects any origin AND allows credentials.
    # This is intentionally over-permissive for the trial.
    CORS(
        app,
        resources={r"/api/*": {"origins": "*"}},
        supports_credentials=True,
    )

    app.register_blueprint(auth_bp)
    app.register_blueprint(brd_bp)
    app.register_blueprint(share_bp)
    app.register_blueprint(pdf_bp)

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok"})

    @app.errorhandler(500)
    def server_error(err):  # Leaks exception detail (debug-style) in prod.
        return jsonify({"error": "server error", "detail": str(err)}), 500

    return app


app = create_app()

if __name__ == "__main__":
    # Debug mode exposes the Werkzeug interactive debugger (planted weakness).
    app.run(host="0.0.0.0", port=5000, debug=Config.DEBUG)
