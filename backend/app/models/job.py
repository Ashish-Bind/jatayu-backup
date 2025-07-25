from app import db
from datetime import datetime

class JobDescription(db.Model):
    __tablename__ = 'job_descriptions'
    
    job_id = db.Column(db.Integer, primary_key=True)
    recruiter_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    job_title = db.Column(db.String(255), nullable=False)
    company = db.Column(db.String(255), nullable=False)
    location = db.Column(db.String(255))
    experience_min = db.Column(db.Integer, nullable=False)
    experience_max = db.Column(db.Integer, nullable=False)
    degree_required = db.Column(db.Integer, db.ForeignKey('degrees.degree_id'))
    degree_branch = db.Column(db.Integer, db.ForeignKey('degree_branches.branch_id'))
    passout_year = db.Column(db.Integer)
    passout_year_required = db.Column(db.Boolean, default=False)
    job_description = db.Column(db.Text)
    duration = db.Column(db.Integer, nullable=False)
    num_questions = db.Column(db.Integer, nullable=False)
    schedule_start = db.Column(db.DateTime, nullable=False)
    schedule_end = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    custom_prompt = db.Column(db.Text)
    status = db.Column(db.String(50), default='active')
    suspension_reason=  db.Column(db.String(255), default='')# e.g., draft, active, closed

    # Relationships
    recruiter = db.relationship('User', backref='job_descriptions')
    degree = db.relationship('Degree', backref='job_descriptions')
    branch = db.relationship('DegreeBranch', backref='job_descriptions')
    required_skills = db.relationship('RequiredSkill', backref='job', cascade='all, delete-orphan')