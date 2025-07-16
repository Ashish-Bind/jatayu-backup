import os
from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# from flask_migrate import Migrate

db = SQLAlchemy()
mail = Mail()
limiter = Limiter(key_func=get_remote_address)

# migrate = Migrate()

def create_app():
    load_dotenv()
    app = Flask(__name__)
    app.config.from_object('app.config.Config')
    app.secret_key = os.getenv("SECRET_KEY", "dev-secret-key")

    # Enable CORS
    CORS(app, supports_credentials=True)

    db.init_app(app)
    mail.init_app(app)
    limiter.init_app(app)
    
    # Import models
    from app.models.candidate import Candidate
    from app.models.job import JobDescription
    from app.models.assessment_attempt import AssessmentAttempt
    from app.models.assessment_state import AssessmentState
    from app.models.skill import Skill
    from app.models.candidate_skill import CandidateSkill
    from app.models.required_skill import RequiredSkill
    from app.models.assessment_registration import AssessmentRegistration
    
    # Import and register blueprints
    from app.routes.candidate import candidate_api_bp
    from app.routes.assessment import assessment_api_bp
    from app.routes.recruiter import recruiter_api_bp
    from app.routes.auth import auth_bp
    from app.routes.recruiter_analytics import recruiter_analytics_api_bp
    
    app.register_blueprint(recruiter_analytics_api_bp, url_prefix='/api/recruiter/analytics')
    app.register_blueprint(candidate_api_bp)
    app.register_blueprint(assessment_api_bp)
    app.register_blueprint(recruiter_api_bp)
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    return app

# from flask import Flask
# from flask_sqlalchemy import SQLAlchemy
# from flask_cors import CORS
# from dotenv import load_dotenv
# import os

# db = SQLAlchemy()

# def create_app():
#     load_dotenv()
#     app = Flask(__name__)
#     app.config.from_object('app.config.Config')
#     app.secret_key = os.getenv("SECRET_KEY", "dev-secret-key")

#     # Enable CORS
#     CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

#     db.init_app(app)

#     # Import models
#     from app.models.user import User
#     from app.models.job import JobDescription, RequiredSkill
#     from app.models.skill import Skill
#     from app.models.mcq import MCQ

#     # Register blueprints
#     from app.routes.auth import auth_bp
#     from app.routes.recruiter import recruiter_bp
#     from app.routes.candidate import candidate_api_bp

#     app.register_blueprint(candidate_api_bp)
#     app.register_blueprint(auth_bp, url_prefix='/api/auth')
#     app.register_blueprint(recruiter_bp, url_prefix='/api/recruiter')

#     return app