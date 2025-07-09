# app/routes/auth.py
from flask import Blueprint, request, jsonify, session
from app import db, mail, limiter
from app.models.user import User, PasswordResetToken
from app.models.candidate import Candidate
from app.models.recruiter import Recruiter
from app.config import Config
from flask_mail import Message
from flask_limiter import Limiter
from datetime import datetime, timedelta

import os
import secrets
import requests

auth_bp = Blueprint('auth', __name__)

def verify_email(email, api_key=os.getenv('EMAILABLE_API_KEY')):
    url = f'https://api.emailable.com/v1/verify?email={email}&api_key={api_key}'
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        if data.get('state') == 'deliverable':
            return True, None
        return False, data.get('reason', 'Email is not deliverable.')
    except requests.RequestException as e:
        return False, f'Email verification failed: {str(e)}'

@auth_bp.route('/signup',  methods=['POST'])
def signup():
    data = request.json
    print(data)

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'User already exists'}), 400
    
    is_valid, reason = verify_email(data['email'])
    if not is_valid:
        return jsonify({'error': reason or 'Invalid email address.'}), 400

    role = data.get('role', 'candidate')  # default to candidate

    user = User(
        name=data['name'],
        email=data['email'],
        role=role
    )
    user.set_password(data['password'])

    db.session.add(user)
    db.session.commit()

    # Send confirmation email
    token = secrets.token_urlsafe(32)
    confirmation_url = f'http://localhost:5173/candidate/confirm?token={token}'
    confirmation_token = PasswordResetToken(
        user_id=user.id,
        token=token,
        created_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(hours=24)
    )
    db.session.add(confirmation_token)
    db.session.commit()

    print(confirmation_url)
    msg = Message(
        subject='Confirm Your Account',
        sender=os.getenv('MAIL_DEFAULT_SENDER'),
        recipients=[data['email']],
        body=f'Click this link to confirm your account: {confirmation_url}\nThis link expires in 24 hours.'
    )
    mail.send(msg)

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

    if not user.is_active:
        return jsonify({'error': 'Please confirm your email before logging in.'}), 403
        
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
                    'name': user.name,
                    'profile_img': candidate.profile_picture if user.role == 'candidate' and candidate.profile_picture else '' 
                }
            })
    return jsonify({'error': 'Not authenticated'}), 401

@auth_bp.route('/forgot-password', methods=['POST'])
@limiter.limit("5/hour")
def forgot_password():
    data = request.json
    email = data.get('email')
    user = User.query.filter_by(email=email).first()

    if not user:
        # Don't reveal if email exists for security
        return jsonify({'message': 'If an account exists for this email, a reset link has been sent.'}), 200

    # Generate a secure token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=1)  # Token expires in 1 hour

    # Store token in database
    reset_token = PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=expires_at
    )
    db.session.add(reset_token)
    db.session.commit()

    # Send reset email
    reset_url = f"http://localhost:5173/candidate/reset-password?token={token}"  # Update with your frontend URL
    msg = Message(
        subject="Password Reset Request",
        recipients=[user.email],
        body=f"""
        Hello {user.name},

        You requested a password reset. Click the link below to reset your password:
        {reset_url}

        This link will expire in 1 hour. If you did not request a password reset, please ignore this email.

        Best,
        Quizzer
        """
    )
    try:
        mail.send(msg)
        print(reset_url)
        return jsonify({'message': 'If an account exists for this email, a reset link has been sent.'}), 200
    except Exception as e:
        db.session.delete(reset_token)  # Roll back token if email fails
        db.session.commit()
        return jsonify({'error': 'Failed to send reset email'}), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    token = data.get('token')
    new_password = data.get('password')

    reset_token = PasswordResetToken.query.filter_by(token=token).first()

    if not reset_token:
        return jsonify({'error': 'Invalid or expired reset token'}), 400

    if reset_token.is_expired():
        db.session.delete(reset_token)
        db.session.commit()
        return jsonify({'error': 'Reset token has expired'}), 400

    user = User.query.get(reset_token.user_id)

    if user.check_password(new_password):
        return jsonify({'error': 'New password cannot be the same as the old one'}), 400

    user.set_password(new_password)

    # Delete the used token
    db.session.delete(reset_token)
    db.session.commit()

    return jsonify({'message': 'Password reset successfully'}), 200

@auth_bp.route('/confirm', methods=['POST'])
def confirm_email():
    data = request.json
    token = data.get('token')

    confirmation_token = PasswordResetToken.query.filter_by(token=token).first()
    if not confirmation_token:
        return jsonify({'error': 'Invalid or expired confirmation token.'}), 400

    if confirmation_token.is_expired():
        db.session.delete(confirmation_token)
        db.session.commit()
        return jsonify({'error': 'Confirmation token has expired.'}), 400

    user = User.query.get(confirmation_token.user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    # Activate user (e.g., set is_active=True if you add this column)
    user.is_active = True  # Add is_active column to User model
    db.session.delete(confirmation_token)
    db.session.commit()

    return jsonify({'message': 'Email confirmed successfully. You can now log in.'}), 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'})
