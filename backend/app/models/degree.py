from app import db

class Degree(db.Model):
    __tablename__ = 'degrees'
    degree_id = db.Column(db.Integer, primary_key=True)
    degree_name = db.Column(db.String(100), nullable=False, unique=True)
    __table_args__ = {'extend_existing': True}