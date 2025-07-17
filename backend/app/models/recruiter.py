from app import db

class Recruiter(db.Model):
    __tablename__ = 'recruiters'

    recruiter_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    company = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    company_image = db.Column(db.String(200))

    def _repr_(self):
        return f'<Recruiter user_id={self.user_id}>'