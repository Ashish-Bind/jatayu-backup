from app import db

class ResumeJson(db.Model):
    __tablename__ = 'resume_json'
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidates.candidate_id'), primary_key=True)
    raw_resume = db.Column(db.Text, nullable=False)