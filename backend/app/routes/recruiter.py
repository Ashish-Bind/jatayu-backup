from flask import Blueprint, jsonify, request, session
from app import db
from app.models.user import User
from app.models.job import JobDescription
from app.models.skill import Skill
from app.models.recruiter import Recruiter
from app.models.required_skill import RequiredSkill
from app.models.candidate import Candidate
from app.models.assessment_registration import AssessmentRegistration
from app.models.candidate_skill import CandidateSkill
from sqlalchemy import and_
from datetime import datetime

from app.services import question_batches
from sqlalchemy.orm import joinedload

from app.models.assessment_attempt import AssessmentAttempt

recruiter_api_bp = Blueprint('recruiter_api', __name__, url_prefix='/api/recruiter')

# Fetch past and active assessments
@recruiter_api_bp.route('/assessments', methods=['GET'])
def get_assessments():
    if 'user_id' not in session or session.get('role') != 'recruiter':
        return jsonify({'error': 'Unauthorized'}), 401

    recruiter = Recruiter.query.filter_by(user_id=session['user_id']).first()
    if not recruiter:
        return jsonify({'error': 'Recruiter not found'}), 404

    current_time = datetime.utcnow()
    # Eagerly load required_skills and their related Skill objects
    jobs = JobDescription.query.options(
        joinedload(JobDescription.required_skills).joinedload(RequiredSkill.skill)
    ).filter_by(recruiter_id=recruiter.recruiter_id).all()

    past_assessments = []
    active_assessments = []
    for job in jobs:
        assessment = {
            'job_id': job.job_id,
            'job_title': job.job_title,
            'company': job.company,
            'schedule_start': job.schedule_start.isoformat() if job.schedule_start else None,
            'schedule_end': job.schedule_end.isoformat() if job.schedule_end else None,
            'num_questions': job.num_questions,
            'duration': job.duration,
            'experience_min': job.experience_min,
            'experience_max': job.experience_max,
            'degree_required': job.degree_required,
            'description': job.description,
            'skills': [
                {'name': rs.skill.name, 'priority': rs.priority}
                for rs in job.required_skills
            ]
        }
        if job.schedule_start and job.schedule_end and job.schedule_end < current_time:
            past_assessments.append(assessment)
        else:
            active_assessments.append(assessment)

    return jsonify({
        'past_assessments': past_assessments,
        'active_assessments': active_assessments
    }), 200

# Create a new assessment
@recruiter_api_bp.route('/assessments', methods=['POST'])
def create_assessment():
    if 'user_id' not in session or session.get('role') != 'recruiter':
        return jsonify({'error': 'Unauthorized'}), 401

    recruiter = Recruiter.query.filter_by(user_id=session['user_id']).first()
    if not recruiter:
        return jsonify({'error': 'Recruiter not found'}), 404

    data = request.json
    required_fields = ['job_title', 'company', 'experience_min', 'experience_max', 'duration', 'num_questions', 'schedule', 'skills']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    # Validate skills format
    if not isinstance(data['skills'], list) or not all('name' in skill and 'priority' in skill for skill in data['skills']):
        return jsonify({'error': 'Skills must be a list of objects with "name" and "priority"'}), 400

    try:
        schedule = datetime.fromisoformat(data['schedule'].replace('Z', '+00:00'))
        assessment = JobDescription(
            recruiter_id=recruiter.recruiter_id,
            job_title=data['job_title'],
            company=data['company'],
            experience_min=float(data['experience_min']),
            experience_max=float(data['experience_max']),
            duration=int(data['duration']),
            num_questions=int(data['num_questions']),
            schedule=schedule,
            degree_required=data.get('degree_required'),
            description=data.get('description')
        )
        db.session.add(assessment)
        db.session.flush()  # Get job_id before committing

        # Add skills (create new skills if they don't exist)
        priority_map = {'low': 2, 'medium': 3, 'high': 5}
        for skill_data in data['skills']:
            priority = priority_map.get(skill_data['priority'].lower())
            if not priority:
                raise ValueError(f"Invalid priority: {skill_data['priority']}. Must be 'low', 'medium', or 'high'.")

            skill = Skill.query.filter_by(name=skill_data['name']).first()
            if not skill:
                skill = Skill(name=skill_data['name'], category='technical')
                db.session.add(skill)
                db.session.flush()

            required_skill = RequiredSkill(
                job_id=assessment.job_id,
                skill_id=skill.skill_id,
                priority=priority
            )
            db.session.add(required_skill)

        db.session.commit()

        # Trigger question generation
        try:
            skills_with_priorities = [
                {'name': skill_data['name'], 'priority': priority_map[skill_data['priority'].lower()]}
                for skill_data in data['skills']
            ]
            jd_experience_range = f"{data['experience_min']}-{data['experience_max']}"
            question_batches.prepare_question_batches(skills_with_priorities, jd_experience_range, assessment.job_id)
        except Exception as e:
            print(f"⚠️ Error generating questions: {e}")
            # Continue even if question generation fails
            pass

        return jsonify({'message': 'Assessment created successfully', 'job_id': assessment.job_id}), 201

    except ValueError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create assessment: {str(e)}'}), 500

# Fetch assessments for a specific recruiter (alternative endpoint)
@recruiter_api_bp.route('/assessments/<int:user_id>', methods=['GET'])
def get_assessments_by_id(user_id):
    if 'user_id' not in session or session['role'] != 'recruiter':
        return jsonify({'error': 'Unauthorized'}), 401

    recruiter = Recruiter.query.filter_by(user_id=session['user_id']).first()
    print(session['user_id'])
    if not recruiter or recruiter.user_id != user_id:
        return jsonify({'error': 'Unauthorized access to recruiter data'}), 403

    assessments = JobDescription.query.filter_by(recruiter_id=recruiter.recruiter_id).all()
    return jsonify([{
        'job_id': assessment.job_id,
        'job_title': assessment.job_title,
        'company': assessment.company,
        'experience_min': assessment.experience_min,
        'experience_max': assessment.experience_max,
        'duration': assessment.duration,
        'num_questions': assessment.num_questions,
        'schedule': assessment.schedule.isoformat() if assessment.schedule else None,
        'degree_required': assessment.degree_required,
        'description': assessment.description
    } for assessment in assessments]), 200

# Fetch ranked candidates for a job
@recruiter_api_bp.route('/candidates/<int:job_id>', methods=['GET'])
def get_ranked_candidates(job_id):
    if 'user_id' not in session or session['role'] != 'recruiter':
        return jsonify({'error': 'Unauthorized'}), 401

    job = JobDescription.query.get_or_404(job_id)
    registrations = AssessmentRegistration.query.filter_by(job_id=job_id).all()
    candidate_ids = [r.candidate_id for r in registrations]
    candidates = Candidate.query.filter(Candidate.candidate_id.in_(candidate_ids)).all()
    
    required_skills = RequiredSkill.query.filter_by(job_id=job_id).all()
    required_skill_dict = {rs.skill_id: rs.priority for rs in required_skills}
    
    candidate_skills = CandidateSkill.query.filter(
        and_(
            CandidateSkill.candidate_id.in_(candidate_ids),
            CandidateSkill.skill_id.in_(required_skill_dict.keys())
        )
    ).all()
    
    candidate_skill_map = {}
    for cs in candidate_skills:
        if cs.candidate_id not in candidate_skill_map:
            candidate_skill_map[cs.candidate_id] = {}
        candidate_skill_map[cs.candidate_id][cs.skill_id] = cs.proficiency
    
    max_proficiency = 8
    max_skill_score = sum(required_skill_dict.values()) * max_proficiency
    
    ranked_candidates = []
    for candidate in candidates:
        skill_score = 0
        matched_skills = []
        for skill_id, priority in required_skill_dict.items():
            proficiency = candidate_skill_map.get(candidate.candidate_id, {}).get(skill_id, 0)
            if proficiency > 0:
                skill_name = Skill.query.get(skill_id).name
                matched_skills.append(f"{skill_name} (Proficiency: {proficiency})")
                skill_score += priority * proficiency
        
        skill_score_normalized = skill_score / max_skill_score if max_skill_score > 0 else 0
        
        exp_midpoint = (job.experience_min + job.experience_max) / 2
        exp_range = job.experience_max - job.experience_min
        exp_diff = abs(candidate.years_of_experience - exp_midpoint)
        exp_score = max(0, 1 - (exp_diff / (exp_range / 2))) if exp_range > 0 else 1
        
        total_score = (0.7 * skill_score_normalized) + (0.3 * exp_score)
        
        description = f"{candidate.name} is ranked based on "
        if matched_skills:
            description += f"strong skills in {', '.join(matched_skills)}"
        else:
            description += "limited skill matches"
        description += f" and {candidate.years_of_experience} years of experience, which "
        if exp_diff < 0.5:
            description += "closely matches"
        elif exp_diff < 1.5:
            description += "reasonably matches"
        else:
            description += "is outside"
        description += f" the job's {job.experience_min}-{job.experience_max} year requirement."
        
        ranked_candidates.append({
            'candidate_id': candidate.candidate_id,
            'name': candidate.name,
            'email': candidate.email,
            'total_score': round(total_score, 2),
            'skill_score': round(skill_score_normalized, 2),
            'experience_score': round(exp_score, 2),
            'description': description
        })
    
    ranked_candidates.sort(key=lambda x: x['total_score'], reverse=True)
    
    for i, candidate in enumerate(ranked_candidates, 1):
        candidate['rank'] = i
    
    return jsonify({
        'job_id': job_id,
        'job_title': job.job_title,
        'candidates': ranked_candidates
    }), 200

@recruiter_api_bp.route('/report/<int:job_id>', methods=['GET'])
def get_post_assessment_report(job_id):
    current_time = datetime.utcnow()
    job = JobDescription.query.get_or_404(job_id)
    
    # if job.end_date > current_time:
    #     return jsonify({'error': 'Report not available until assessment ends'}), 403
    
    registrations = AssessmentRegistration.query.filter_by(job_id=job_id).all()
    candidate_ids = [r.candidate_id for r in registrations]
    candidates = Candidate.query.filter(Candidate.candidate_id.in_(candidate_ids)).all()
    
    attempts = AssessmentAttempt.query.filter(
        and_(
            AssessmentAttempt.job_id == job_id,
            AssessmentAttempt.candidate_id.in_(candidate_ids),
            AssessmentAttempt.status == 'completed'
        )
    ).all()
    attempt_map = {a.candidate_id: a.performance_log for a in attempts}
    
    report = []
    for candidate in candidates:
        performance = attempt_map.get(candidate.candidate_id)
        if performance:
            total_accuracy = sum(skill_data['accuracy_percent'] for skill_data in performance.values()) / len(performance)
            total_questions = sum(skill_data['questions_attempted'] for skill_data in performance.values())
            total_time = sum(skill_data['time_spent'] for skill_data in performance.values())
            avg_time_per_question = round(total_time / total_questions, 2) if total_questions > 0 else 0
            final_bands = {skill: data['final_band'] for skill, data in performance.items()}
            status = 'Completed'
        else:
            total_accuracy = 0
            total_questions = 0
            avg_time_per_question = 0
            final_bands = {}
            status = 'Did Not Attempt'
        
        report.append({
            'candidate_id': candidate.candidate_id,
            'name': candidate.name,
            'email': candidate.email,
            'accuracy': round(total_accuracy, 2),
            'total_questions': total_questions,
            'avg_time_per_question': avg_time_per_question,
            'final_bands': final_bands,
            'status': status
        })
    
    return jsonify({
        'job_id': job_id,
        'job_title': job.job_title,
        'candidates': report
    }), 200

@recruiter_api_bp.route('/combined-report/<int:job_id>', methods=['GET'])
def get_combined_report(job_id):
    current_time = datetime.utcnow()
    job = JobDescription.query.get_or_404(job_id)
    
    # if job.end_date > current_time:
    #     return jsonify({'error': 'Report not available until assessment ends'}), 403
    
    registrations = AssessmentRegistration.query.filter_by(job_id=job_id).all()
    candidate_ids = [r.candidate_id for r in registrations]
    candidates = Candidate.query.filter(Candidate.candidate_id.in_(candidate_ids)).all()
    
    attempts = AssessmentAttempt.query.filter(
        and_(
            AssessmentAttempt.job_id == job_id,
            AssessmentAttempt.candidate_id.in_(candidate_ids),
            AssessmentAttempt.status == 'completed'
        )
    ).all()
    attempt_map = {a.candidate_id: a.performance_log for a in attempts}
    
    required_skills = RequiredSkill.query.filter_by(job_id=job_id).all()
    required_skill_dict = {rs.skill_id: rs.priority for rs in required_skills}
    
    candidate_skills = CandidateSkill.query.filter(
        and_(
            CandidateSkill.candidate_id.in_(candidate_ids),
            CandidateSkill.skill_id.in_(required_skill_dict.keys())
        )
    ).all()
    
    candidate_skill_map = {}
    for cs in candidate_skills:
        if cs.candidate_id not in candidate_skill_map:
            candidate_skill_map[cs.candidate_id] = {}
        candidate_skill_map[cs.candidate_id][cs.skill_id] = cs.proficiency
    
    max_proficiency = 8
    max_skill_score = sum(required_skill_dict.values()) * max_proficiency
    
    ranked_candidates = []
    for candidate in candidates:
        skill_score = 0
        matched_skills = []
        for skill_id, priority in required_skill_dict.items():
            proficiency = candidate_skill_map.get(candidate.candidate_id, {}).get(skill_id, 0)
            if proficiency > 0:
                skill_name = Skill.query.get(skill_id).name
                matched_skills.append(f"{skill_name} (Proficiency: {proficiency})")
                skill_score += priority * proficiency
        
        skill_score_normalized = skill_score / max_skill_score if max_skill_score > 0 else 0
        
        exp_midpoint = (job.experience_min + job.experience_max) / 2
        exp_range = job.experience_max - job.experience_min
        exp_diff = abs(candidate.years_of_experience - exp_midpoint)
        exp_score = max(0, 1 - (exp_diff / (exp_range / 2))) if exp_range > 0 else 1
        
        pre_score = (0.7 * skill_score_normalized) + (0.3 * exp_score)
        
        performance = attempt_map.get(candidate.candidate_id)
        if performance:
            total_accuracy = sum(skill_data['accuracy_percent'] for skill_data in performance.values()) / len(performance)
            post_score = total_accuracy / 100
            total_questions = sum(skill_data['questions_attempted'] for skill_data in performance.values())
            total_time = sum(skill_data['time_spent'] for skill_data in performance.values())
            avg_time_per_question = round(total_time / total_questions, 2) if total_questions > 0 else 0
            final_bands = {skill: data['final_band'] for skill, data in performance.items()}
            status = 'Completed'
            combined_score = 0.5 * pre_score + 0.5 * post_score
        else:
            post_score = 0
            total_questions = 0
            avg_time_per_question = 0
            final_bands = {}
            status = 'Did Not Attempt'
            combined_score = 0.5 * pre_score
        
        ranked_candidates.append({
            'candidate_id': candidate.candidate_id,
            'name': candidate.name,
            'email': candidate.email,
            'pre_score': round(pre_score, 2),
            'post_score': round(post_score, 2),
            'combined_score': round(combined_score, 2),
            'total_questions': total_questions,
            'avg_time_per_question': avg_time_per_question,
            'final_bands': final_bands,
            'status': status,
            'description': f"{candidate.name} has {len(matched_skills)} matched skills and {candidate.years_of_experience} years experience."
        })
    
    ranked_candidates.sort(key=lambda x: (x['status'] == 'Completed', x['combined_score']), reverse=True)
    
    for i, candidate in enumerate(ranked_candidates, 1):
        candidate['rank'] = i
    
    return jsonify({
        'job_id': job_id,
        'job_title': job.job_title,
        'candidates': ranked_candidates
    }), 200