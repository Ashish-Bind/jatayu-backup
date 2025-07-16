from flask import Blueprint, jsonify, request, session
from app import db, mail
from app.models.job import JobDescription
from app.models.recruiter import Recruiter
from app.models.candidate import Candidate
from app.models.assessment_registration import AssessmentRegistration
from app.models.assessment_attempt import AssessmentAttempt
from flask_mail import Message

recruiter_analytics_api_bp = Blueprint('recruiter_analytics_api', __name__, url_prefix='/api/recruiter/analytics')

@recruiter_analytics_api_bp.route('/candidates', methods=['GET'])
def get_candidates():
    """Retrieve all candidates for the recruiter's jobs, with optional filters."""
    if 'user_id' not in session or session.get('role') != 'recruiter':
        return jsonify({'error': 'Unauthorized'}), 401

    recruiter = Recruiter.query.filter_by(user_id=session['user_id']).first()
    if not recruiter:
        return jsonify({'error': 'Recruiter not found'}), 404

    job_id = request.args.get('job_id', type=int)
    status = request.args.get('status')

    # Build the query
    query = Candidate.query.join(
        AssessmentRegistration,
        Candidate.candidate_id == AssessmentRegistration.candidate_id
    ).join(
        JobDescription,
        AssessmentRegistration.job_id == JobDescription.job_id
    ).outerjoin(
        AssessmentAttempt,
        (AssessmentAttempt.candidate_id == Candidate.candidate_id) & 
        (AssessmentAttempt.job_id == AssessmentRegistration.job_id)
    ).filter(
        JobDescription.recruiter_id == recruiter.recruiter_id
    )

    if job_id:
        query = query.filter(AssessmentRegistration.job_id == job_id)
    if status:
        query = query.filter(Candidate.status == status)

    candidates = query.all()

    # Process candidates and calculate total_score
    result = []
    for candidate in candidates:
        # Get the job_title from the first registration
        job_title = 'N/A'
        if candidate.assessment_registrations:
            job = JobDescription.query.get(candidate.assessment_registrations[0].job_id)
            job_title = job.job_title if job else 'N/A'

        # Calculate total_score from the first relevant attempt
        total_score = 0
        # Filter attempts for jobs the candidate is registered for
        relevant_job_ids = [r.job_id for r in candidate.assessment_registrations]
        attempts = candidate.assessment_attempts.filter(
            AssessmentAttempt.job_id.in_(relevant_job_ids)
        ).all()
        if attempts and attempts[0].performance_log:
            performance = {
                k: v for k, v in attempts[0].performance_log.items() 
                if k != 'proctoring_data' and v.get('accuracy_percent') is not None
            }
            if performance:
                total_score = sum(p['accuracy_percent'] for p in performance.values()) / len(performance)

        result.append({
            'candidate_id': candidate.candidate_id,
            'name': candidate.name,
            'job_title': job_title,
            'status': candidate.status or 'active',
            'block_reason': candidate.block_reason or '',
            'total_score': round(total_score, 2)
        })

    return jsonify(result), 200

@recruiter_analytics_api_bp.route('/candidate/block/<int:candidate_id>', methods=['POST'])
def block_candidate(candidate_id):
    """Block a candidate with a reason."""
    if 'user_id' not in session or session.get('role') != 'recruiter':
        return jsonify({'error': 'Unauthorized'}), 401

    recruiter = Recruiter.query.filter_by(user_id=session['user_id']).first()
    if not recruiter:
        return jsonify({'error': 'Recruiter not found'}), 404

    candidate = Candidate.query.get_or_404(candidate_id)
    data = request.get_json()
    reason = data.get('reason', 'No reason provided')

    candidate.status = 'blocked'
    candidate.block_reason = reason
    db.session.commit()

    try:
        msg = Message(
            subject='Account Suspension Notification',
            recipients=[candidate.email],
            body=f'Your account has been suspended due to the following reason: {reason}. Please contact support for further details.'
        )
        mail.send(msg)
    except Exception as e:
        return jsonify({'error': f'Candidate blocked, but failed to send email: {str(e)}'}), 500

    return jsonify({'message': 'Candidate blocked successfully'}), 200

@recruiter_analytics_api_bp.route('/candidate/<int:candidate_id>/proctoring', methods=['GET'])
def get_proctoring_data(candidate_id):
    """Retrieve proctoring data for a candidate's assessment attempts."""
    if 'user_id' not in session or session.get('role') != 'recruiter':
        return jsonify({'error': 'Unauthorized'}), 401

    recruiter = Recruiter.query.filter_by(user_id=session['user_id']).first()
    if not recruiter:
        return jsonify({'error': 'Recruiter not found'}), 404

    candidate = Candidate.query.get_or_404(candidate_id)
    attempts = AssessmentAttempt.query.join(JobDescription, AssessmentAttempt.job_id == JobDescription.job_id)\
        .filter(AssessmentAttempt.candidate_id == candidate_id, JobDescription.recruiter_id == recruiter.recruiter_id).all()
    
    proctoring_data = []
    for attempt in attempts:
        proctoring = attempt.performance_log.get('proctoring_data', {}) if attempt.performance_log else {}
        if proctoring:
            proctoring_data.append({
                'attempt_id': attempt.attempt_id,
                'job_title': JobDescription.query.get(attempt.job_id).job_title,
                'snapshots': proctoring.get('snapshots', []),
                'tab_switches': proctoring.get('tab_switches', 0),
                'fullscreen_warnings': proctoring.get('fullscreen_warnings', 0),
                'remarks': proctoring.get('remarks', []),
                'forced_termination': proctoring.get('forced_termination', False),
                'termination_reason': proctoring.get('termination_reason', '')
            })
    
    return jsonify({
        'candidate_id': candidate.candidate_id,
        'name': candidate.name,
        'proctoring_data': proctoring_data
    }), 200

@recruiter_analytics_api_bp.route('/jobs', methods=['GET'])
def get_jobs():
    """Retrieve all jobs posted by the recruiter."""
    if 'user_id' not in session or session.get('role') != 'recruiter':
        return jsonify({'error': 'Unauthorized'}), 401

    recruiter = Recruiter.query.filter_by(user_id=session['user_id']).first()
    if not recruiter:
        return jsonify({'error': 'Recruiter not found'}), 404

    jobs = JobDescription.query.filter_by(recruiter_id=recruiter.recruiter_id).all()
    return jsonify([{
        'job_id': j.job_id,
        'job_title': j.job_title,
        'company': j.company,
        'status': j.status or 'active',
        'suspension_reason': j.suspension_reason or '',
        'created_at': j.created_at.isoformat() if j.created_at else None
    } for j in jobs]), 200

@recruiter_analytics_api_bp.route('/job/suspend/<int:job_id>', methods=['POST'])
def suspend_job(job_id):
    """Suspend a job with a reason and notify registered candidates."""
    if 'user_id' not in session or session.get('role') != 'recruiter':
        return jsonify({'error': 'Unauthorized'}), 401

    recruiter = Recruiter.query.filter_by(user_id=session['user_id']).first()
    if not recruiter:
        return jsonify({'error': 'Recruiter not found'}), 404

    job = JobDescription.query.get_or_404(job_id)
    if job.recruiter_id != recruiter.recruiter_id:
        return jsonify({'error': 'Unauthorized access'}), 403

    data = request.get_json()
    reason = data.get('reason', 'Internal reasons')

    job.status = 'suspended'
    job.suspension_reason = reason
    db.session.commit()

    registrations = AssessmentRegistration.query.filter_by(job_id=job_id).all()
    for reg in registrations:
        candidate = Candidate.query.get(reg.candidate_id)
        try:
            msg = Message(
                subject='Job Suspension Notification',
                recipients=[candidate.email],
                body=f'The job "{job.job_title}" has been suspended due to: {reason}. We apologize for any inconvenience.'
            )
            mail.send(msg)
        except Exception as e:
            return jsonify({'error': f'Job suspended, but failed to send email to candidate {candidate.candidate_id}: {str(e)}'}), 500

    return jsonify({'message': 'Job suspended successfully'}), 200

@recruiter_analytics_api_bp.route('/job/delete/<int:job_id>', methods=['DELETE'])
def delete_job(job_id):
    """Delete a job and notify registered candidates."""
    if 'user_id' not in session or session.get('role') != 'recruiter':
        return jsonify({'error': 'Unauthorized'}), 401

    recruiter = Recruiter.query.filter_by(user_id=session['user_id']).first()
    if not recruiter:
        return jsonify({'error': 'Recruiter not found'}), 404

    job = JobDescription.query.get_or_404(job_id)
    if job.recruiter_id != recruiter.recruiter_id:
        return jsonify({'error': 'Unauthorized access'}), 403

    registrations = AssessmentRegistration.query.filter_by(job_id=job_id).all()
    for reg in registrations:
        candidate = Candidate.query.get(reg.candidate_id)
        try:
            msg = Message(
                subject='Job Deletion Notification',
                recipients=[candidate.email],
                body=f'The job "{job.job_title}" has been deleted. Please contact the recruiter for more details.'
            )
            mail.send(msg)
        except Exception as e:
            return jsonify({'error': f'Job deleted, but failed to send email to candidate {candidate.candidate_id}: {str(e)}'}), 500

    db.session.delete(job)
    db.session.commit()
    return jsonify({'message': 'Job deleted successfully'}), 200

@recruiter_analytics_api_bp.route('/shortlist/notify', methods=['POST'])
def notify_shortlisted():
    """Send email notifications to shortlisted candidates."""
    if 'user_id' not in session or session.get('role') != 'recruiter':
        return jsonify({'error': 'Unauthorized'}), 401

    recruiter = Recruiter.query.filter_by(user_id=session['user_id']).first()
    if not recruiter:
        return jsonify({'error': 'Recruiter not found'}), 404

    data = request.get_json()
    candidate_ids = data.get('candidate_ids', [])

    for candidate_id in candidate_ids:
        candidate = Candidate.query.get_or_404(candidate_id)
        try:
            msg = Message(
                subject='Shortlist Notification',
                recipients=[candidate.email],
                body=f'Congratulations! You have been shortlisted for a job opportunity. Please check your dashboard for further details.'
            )
            mail.send(msg)
        except Exception as e:
            return jsonify({'error': f'Failed to send email to candidate {candidate_id}: {str(e)}'}), 500

    return jsonify({'message': 'Emails sent to shortlisted candidates'}), 200