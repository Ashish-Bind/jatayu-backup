# app/routes/auth.py
from flask import Blueprint, request, jsonify, session
from app import db
from app.models.user import User
from app.models.candidate import Candidate
from app.models.recruiter import Recruiter

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup',  methods=['POST'])
def signup():
    data = request.json
    print(data)

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'User already exists'}), 400

    role = data.get('role', 'candidate')  # default to candidate

    user = User(
        name=data['name'],
        email=data['email'],
        role=role
    )
    user.set_password(data['password'])

    db.session.add(user)
    db.session.commit()

    # Now add to Candidate or Recruiter table
    if role == 'candidate':
        candidate = Candidate(
            user_id=user.id,
            name=user.name,
            email=user.email,
            years_of_experience=0.0  # Default value; can be updated later
        )
        db.session.add(candidate)

    elif role == 'recruiter':
        recruiter = Recruiter(
            user_id=user.id,
            phone=data.get('phone', ''),
            company=data.get('company', '')
        )
        db.session.add(recruiter)

    db.session.commit()

    return jsonify({'message': f'{role.capitalize()} signup successful'}), 200

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()
    if user and user.check_password(data['password']):
        session['user_id'] = user.id
        session['role'] = user.role
        return jsonify({'message': 'Login successful', 'role': user.role})
    return jsonify({'error': 'Invalid credentials'}), 401

@auth_bp.route('/check')
def check_auth():
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        candidate = Candidate.query.filter_by(user_id=user.id).first()
        if user:
            return jsonify({
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'role': user.role,
                    'profile_img': candidate.profile_picture if user.role == 'candidate' and candidate.profile_picture else '' 
                }
            })
    return jsonify({'error': 'Not authenticated'}), 401

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'})
