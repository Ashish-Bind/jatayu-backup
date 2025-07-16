from app import db

class DegreeBranch(db.Model):
    __tablename__ = 'degree_branches'
    branch_id = db.Column(db.Integer, primary_key=True)
    branch_name = db.Column(db.String(100), nullable=False, unique=True)
    __table_args__ = {'extend_existing': True}