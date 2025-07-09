from app import db
from sqlalchemy.dialects.postgresql import JSONB

class AssessmentProctoringData(db.Model):
    __tablename__ = 'assessment_proctoring_data'

    attempt_id = db.Column(db.Integer, db.ForeignKey('assessment_attempts.attempt_id'), primary_key=True)
    snapshots = db.Column(JSONB, default=lambda: [])
    tab_switches = db.Column(db.Integer, default=0)
    fullscreen_warnings = db.Column(db.Integer, default=0)
    remarks = db.Column(JSONB, default=lambda: [])
    forced_termination = db.Column(db.Boolean, default=False)
    termination_reason = db.Column(db.String(255), default='')
    attempt = db.relationship('AssessmentAttempt', back_populates='proctoring')

    def __repr__(self):
        return f'<AssessmentProctoringData for attempt_id={self.attempt_id}>'