from app import db

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
    degree_id = db.Column(db.Integer, db.ForeignKey('degrees.degree_id'))
    degree_branch = db.Column(db.Integer, db.ForeignKey('degree_branches.branch_id'))
    passout_year = db.Column(db.Integer)
    years_of_experience = db.Column(db.Float, nullable=False)
    resume = db.Column(db.String(200))
    profile_picture = db.Column(db.String(200))
    is_profile_complete = db.Column(db.Boolean, default=False)
    camera_image = db.Column(db.String(200))
    status = db.Column(db.String(50), default='active')  # e.g., active, inactive, suspended
    block_reason = db.Column(db.String(255), default='')  # Reason for blocking the candidate


    # Add relationship to AssessmentAttempt
    degree = db.relationship('Degree', backref='candidates')  # Relationship to Degree model
    assessment_attempts = db.relationship('AssessmentAttempt', backref='candidate', lazy='dynamic')
    branch = db.relationship('DegreeBranch', backref='candidates')
    candidate_skills = db.relationship('CandidateSkill', backref='candidate', lazy='joined')


    def __repr__(self):
        return f'<Candidate {self.name}>'