from app import db
import uuid

class Candidate(db.Model):
    __tablename__ = 'candidates'

    candidate_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    location = db.Column(db.String(100))
    linkedin = db.Column(db.String(200))
    github = db.Column(db.String(200))
    degree = db.Column(db.String(100))
    years_of_experience = db.Column(db.Float, nullable=False)
    resume = db.Column(db.String(200))
    profile_picture = db.Column(db.String(200))
    is_profile_complete = db.Column(db.Boolean, default=False)
    camera_image = db.Column(db.String(200))

    def _repr_(self):
        return f'<Candidate {self.name}>'