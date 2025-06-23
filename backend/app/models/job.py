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
    degree_required = db.Column(db.String(255))
    description = db.Column(db.Text)
    duration = db.Column(db.Integer, nullable=False)
    num_questions = db.Column(db.Integer, nullable=False)
    schedule_start = db.Column(db.DateTime, nullable=False)
    schedule_end = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    recruiter = db.relationship('User', backref='job_descriptions')
    required_skills = db.relationship('RequiredSkill', backref='job', cascade='all, delete-orphan')

# # class RequiredSkill(db.Model):
#     __tablename__ = 'required_skills'
    
#     job_id = db.Column(db.Integer, db.ForeignKey('job_descriptions.job_id'), primary_key=True)
#     skill_id = db.Column(db.Integer, db.ForeignKey('skills.skill_id'), primary_key=True)
#     priority = db.Column(db.Integer, nullable=False)  # 1 to 5

#     # Relationships
#     skill = db.relationship('Skill', backref='required_skills')