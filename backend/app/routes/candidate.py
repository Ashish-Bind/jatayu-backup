from flask import Blueprint, jsonify, request
import os
import re
import difflib
from deepface import DeepFace
from app import db
from app.models.candidate import Candidate
from app.models.job import JobDescription
from app.models.assessment_attempt import AssessmentAttempt
from app.models.assessment_registration import AssessmentRegistration
from app.models.skill import Skill
from app.models.candidate_skill import CandidateSkill
from app.models.assessment_state import AssessmentState
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timezone, timedelta
import google.generativeai as genai
import logging
from io import BytesIO
from pdfminer.high_level import extract_text
import json

candidate_api_bp = Blueprint('candidate_api', __name__, url_prefix='/api/candidate')

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configure Gemini API
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))

def is_valid_pdf(file):
    """Check if the file is a valid PDF by verifying its magic number."""
    try:
        file.seek(0)
        magic = file.read(5)
        file.seek(0)
        return magic == b'%PDF-'
    except Exception as e:
        return False

def extract_text_from_pdf(pdf_file):
    try:
        if hasattr(pdf_file, 'read'):
            if not is_valid_pdf(pdf_file):
                raise ValueError("The uploaded file is not a valid PDF.")
            pdf_content = pdf_file.read()
            pdf_file.seek(0)
            pdf_stream = BytesIO(pdf_content)
            text = extract_text(pdf_stream)
        else:
            raise ValueError("pdf_file must be a file-like object with a read method.")
        return text
    except Exception as e:
        return None

def analyze_resume(resume_text):
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""
You are a JSON assistant. Extract and return ONLY valid JSON in the following format (no comments or explanations):

{{
  "name": "",
  "phone": "",
  "Skills": {{
    "Technical Skills": [],
    "Soft Skills": [],
    "Tools": []
  }},
  "Work Experience": [
    {{
      "Company": "",
      "Title": "",
      "Start Date": "",
      "End Date": "",
      "Description": "",
      "Technologies": ""
    }}
  ],
  "Projects": [
    {{
      "Title": "",
      "Description": "",
      "Technologies": ""
    }}
  ],
  "Education": [
    {{
      "Degree": "",
      "Institution": "",
      "Graduation Year": 0,
      "Certification": false
    }}
  ]
}}

Extract information from the resume as follows:
- Extract the candidate's full name and store it in "name".
- Extract the phone number and store it in "phone". Include the country code if present (e.g., +91).
- Under "Skills", categorize into "Technical Skills", "Soft Skills", and "Tools".
- Under "Work Experience", include each job with "Start Date" and "End Date" in "YYYY-MM" format. Use "Present" for ongoing roles.
- Under "Projects", list each project with its "Title", "Description", and "Technologies".
- Infer technologies for both "Work Experience" and "Projects":
  - If "Jupyter Notebook", "Google Collab", "Flask", or "Jupyter" is mentioned, include "Python".
  - If React is mentioned, include "JavaScript".
  - If terms like "deep learning", "reinforcement learning", "AIML", or "AI" are mentioned, include "Artificial Intelligence" and "Machine Learning".
  - If terms like "data structures", "algorithms", or "programming" are mentioned, include "Python" or "Java" if specified.
- Include skills like "Excel Pivoting" and "GitHub" in "Technical Skills" if mentioned.

Resume:
{resume_text}
        """
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return None

def parse_json_output(json_string):
    try:
        cleaned = json_string.strip().removeprefix("```json").removesuffix("```").strip()
        result = json.loads(cleaned)
        return result
    except json.JSONDecodeError as e:
        return None

def normalize_phone_number(phone):
    if not phone:
        return None
    cleaned = re.sub(r'[^\d+]', '', phone)
    if cleaned.startswith('+91'):
        return cleaned
    elif cleaned.startswith('+'):
        return '+91' + cleaned[3:]
    else:
        return '+91' + cleaned

def compare_strings(str1, str2, threshold=0.8):
    if not str1 or not str2:
        return False
    str1 = str1.lower().strip()
    str2 = str2.lower().strip()
    similarity = difflib.SequenceMatcher(None, str1, str2).ratio()
    return similarity >= threshold

def calculate_total_experience(work_experience):
    """Calculate total work experience in years, handling overlaps."""
    if not work_experience:
        return 0.0

    intervals = []
    current_date = datetime(2025, 7, 9)

    for exp in work_experience:
        start_date_str = exp.get('Start Date', '')
        end_date_str = exp.get('End Date', '')

        try:
            if end_date_str.lower() == 'present':
                end_date = current_date
            else:
                if len(end_date_str) == 4:
                    end_date = datetime(int(end_date_str), 12, 31)
                else:
                    end_date = datetime.strptime(end_date_str, '%Y-%m')

            if len(start_date_str) == 4:
                start_date = datetime(int(start_date_str), 1, 1)
            else:
                start_date = datetime.strptime(start_date_str, '%Y-%m')

            if start_date > end_date:
                continue

            intervals.append((start_date, end_date))
        except ValueError as e:
            continue

    if not intervals:
        return 0.0

    intervals.sort(key=lambda x: x[0])
    merged = []
    current_start, current_end = intervals[0]

    for start, end in intervals[1:]:
        if start <= current_end:
            current_end = max(current_end, end)
        else:
            merged.append((current_start, current_end))
            current_start, current_end = start, end
    merged.append((current_start, current_end))

    total_days = sum((end - start).days for start, end in merged)
    total_years = total_days / 365.25
    return round(total_years, 2)

def infer_proficiency(skill, work_experience, education, projects):
    score = 0
    skill_lower = skill.lower()
    strong_keywords = ["developed", "built", "implemented", "designed", "used", "created", "led", "integrated", "deployed"]
    related_terms = {
        "artificial intelligence": ["ai", "aiml", "reinforcement learning", "deep learning"],
        "machine learning": ["ml", "aiml", "deep learning", "reinforcement learning"],
        "python": ["jupyter notebook", "google collab", "flask", "jupyter"],
        "javascript": ["react", "ajax"]
    }

    for exp in work_experience:
        combined = (str(exp.get("Title", "")) + " " + str(exp.get("Description", "")) + " " + str(exp.get("Technologies", ""))).lower()
        skill_found = False
        if skill_lower in combined:
            score += 2
            skill_found = True
        for related_term in related_terms.get(skill_lower, []):
            if related_term in combined:
                score += 2
                skill_found = True
                break
        if skill_found and any(kw in combined for kw in strong_keywords):
            score += 2
        if combined.count(skill_lower) >= 2:
            score += 1

    for proj in projects:
        proj_text = (str(proj.get("Title", "")) + " " + str(proj.get("Description", "")) + " " + str(proj.get("Technologies", ""))).lower()
        skill_found = False
        if skill_lower in proj_text:
            score += 2
            skill_found = True
        for related_term in related_terms.get(skill_lower, []):
            if related_term in proj_text:
                score += 2
                skill_found = True
                break
        if skill_found and any(kw in proj_text for kw in strong_keywords):
            score += 2
        if proj_text.count(skill_lower) >= 2:
            score += 1

    for edu in education:
        edu_text = (str(edu.get("Degree", "")) + " " + str(edu.get("Institution", ""))).lower()
        skill_found = False
        if skill_lower in edu_text:
            score += 1
            skill_found = True
        for related_term in related_terms.get(skill_lower, []):
            if related_term in edu_text:
                score += 1
                skill_found = True
                break
        if skill_found and "certification" in edu_text:
            score += 2

    if score >= 5:
        proficiency = 8
    elif score >= 2:
        proficiency = 6
    else:
        proficiency = 4
    return proficiency

def verify_faces(profile_pic_file, webcam_image_file):
    """Verify if the faces in the two images match with at least 70% similarity."""
    try:
        profile_pic_path = f"app/static/uploads/temp_profile_{datetime.now().timestamp()}.jpg"
        webcam_image_path = f"app/static/uploads/temp_webcam_{datetime.now().timestamp()}.jpg"

        profile_pic_file.save(profile_pic_path)
        webcam_image_file.save(webcam_image_path)

        result = DeepFace.verify(
            img1_path=profile_pic_path,
            img2_path=webcam_image_path,
            model_name='Facenet',
            distance_metric='cosine',
            enforce_detection=True
        )

        os.remove(profile_pic_path)
        os.remove(webcam_image_path)

        verified = result['verified']
        distance = result['distance']
        similarity_percentage = (1 - distance) * 100
        print(f"Face verification: {similarity_percentage:.2f}% similarity")
        print(f"Face verification {'successful' if verified and distance <= 0.4 else 'failed'}")
        return {
            'verified': verified and distance <= 0.4,
            'similarity': round(similarity_percentage, 2)
        }
    except Exception as e:
        print(f"Face verification failed: {str(e)}")
        return {'verified': False, 'similarity': 0.0}

@candidate_api_bp.route('/profile/<int:user_id>', methods=['GET'])
def get_profile_by_user(user_id):
    candidate = Candidate.query.filter_by(user_id=user_id).first_or_404()
    return jsonify({
        'candidate_id': candidate.candidate_id,
        'name': candidate.name,
        'email': candidate.email,
        'phone': candidate.phone,
        'location': candidate.location,
        'linkedin': candidate.linkedin,
        'github': candidate.github,
        'degree': candidate.degree,
        'years_of_experience': candidate.years_of_experience,
        'resume': candidate.resume,
        'profile_picture': candidate.profile_picture,
        'camera_image': candidate.camera_image,
        'is_profile_complete': candidate.is_profile_complete
    })

@candidate_api_bp.route('/profile/<int:user_id>', methods=['POST'])
def update_profile(user_id):
    candidate = Candidate.query.filter_by(user_id=user_id).first_or_404()

    form_name = request.form.get('name')
    form_phone = request.form.get('phone')
    form_experience = request.form.get('years_of_experience')
    form_location = request.form.get('location')
    form_linkedin = request.form.get('linkedin')
    form_github = request.form.get('github')
    form_degree = request.form.get('degree')
    resume_file = request.files.get('resume')
    profile_pic_file = request.files.get('profile_picture')
    webcam_image_file = request.files.get('webcam_image')

    if not form_name or not form_experience:
        return jsonify({'error': 'Name and years of experience are required.'}), 400
    try:
        form_experience = float(form_experience)
    except ValueError:
        return jsonify({'error': 'Years of experience must be a number.'}), 400

    try:
        # Validate face verification first
        face_verification_result = None
        if profile_pic_file and webcam_image_file:
            face_verification_result = verify_faces(profile_pic_file, webcam_image_file)
            if not face_verification_result['verified']:
                return jsonify({
                    'error': f'Face verification failed: Images do not match with 70% similarity ({face_verification_result["similarity"]}% similarity).'
                }), 400
            profile_pic_file.seek(0)
            webcam_image_file.seek(0)
        elif not profile_pic_file and not webcam_image_file:
            return jsonify({'error': 'At least one of profile picture or webcam image is required.'}), 400

        # Validate and process resume
        parsed_data = None
        if resume_file:
            resume_text = extract_text_from_pdf(resume_file)
            if not resume_text:
                return jsonify({'error': 'Failed to extract text from resume. Ensure it is a valid PDF.'}), 400

            gemini_output = analyze_resume(resume_text)
            if not gemini_output:
                return jsonify({'error': 'Failed to parse resume with Gemini API.'}), 400

            parsed_data = parse_json_output(gemini_output)
            if not parsed_data:
                return jsonify({'error': 'Failed to parse Gemini API output.'}), 400

            resume_name = parsed_data.get("name", "")
            resume_phone = normalize_phone_number(parsed_data.get("phone", ""))
            if not compare_strings(form_name, resume_name):
                return jsonify({'error': 'Name in form does not match resume name (80% similarity required). Please verify.'}), 400
            if resume_phone and form_phone and resume_phone != normalize_phone_number(form_phone):
                return jsonify({'error': 'Phone number in form does not match resume. Please verify.'}), 400

            resume_experience = calculate_total_experience(parsed_data.get("Work Experience", []))
            if form_experience > 0 and resume_experience == 0:
                return jsonify({'error': 'No work experience found in resume, but form claims experience. Please verifies.'}), 400
            elif form_experience > 0:
                min_allowed = 0.8 * form_experience
                if not (min_allowed <= resume_experience):
                    return jsonify({
                        'error': f'Resume experience ({resume_experience:.2f} years) does not match form input ({form_experience:.2f} years). It should be at least 80% of the stated experience.'
                    }), 400

        # All validations passed, now update candidate and save files
        candidate.name = form_name
        candidate.phone = normalize_phone_number(form_phone)
        candidate.location = form_location
        candidate.linkedin = form_linkedin
        candidate.github = form_github
        candidate.degree = form_degree
        candidate.years_of_experience = form_experience

        if resume_file:
            resume_filename = f"resumes/{candidate.candidate_id}_{resume_file.filename}"
            resume_path = os.path.join('app/static/uploads', resume_filename)
            resume_file.save(resume_path)
            candidate.resume = resume_filename

            # Update skills
            skills_data = parsed_data.get("Skills", {})
            work_experience = parsed_data.get("Work Experience", [])
            projects = parsed_data.get("Projects", [])
            education = parsed_data.get("Education", [])

            all_skills = (
                skills_data.get("Technical Skills", []) +
                skills_data.get("Soft Skills", []) +
                skills_data.get("Tools", [])
            )

            for skill_name in all_skills:
                skill_name = skill_name.strip()
                if not skill_name:
                    continue

                skill = Skill.query.filter_by(name=skill_name).first()
                if not skill:
                    skill = Skill(name=skill_name, category='technical')
                    db.session.add(skill)
                    db.session.flush()

                proficiency = infer_proficiency(skill_name, work_experience, education, projects)

                existing_skill = CandidateSkill.query.filter_by(
                    candidate_id=candidate.candidate_id,
                    skill_id=skill.skill_id
                ).first()

                if existing_skill:
                    existing_skill.proficiency = proficiency
                else:
                    candidate_skill = CandidateSkill(
                        candidate_id=candidate.candidate_id,
                        skill_id=skill.skill_id,
                        proficiency=proficiency
                    )
                    db.session.add(candidate_skill)

        if profile_pic_file:
            profile_pic_filename = f"profile_pics/{candidate.candidate_id}_{profile_pic_file.filename}"
            profile_pic_path = os.path.join('app/static/uploads', profile_pic_filename)
            profile_pic_file.save(profile_pic_path)
            candidate.profile_picture = profile_pic_filename

        if webcam_image_file:
            webcam_image_filename = f"webcam_images/{candidate.candidate_id}_{webcam_image_file.filename}"
            webcam_image_path = os.path.join('app/static/uploads', webcam_image_filename)
            webcam_image_file.save(webcam_image_path)
            candidate.camera_image = webcam_image_filename

        candidate.is_profile_complete = True
        db.session.add(candidate)
        db.session.commit()

        return jsonify({
            'message': 'Profile updated successfully',
            'face_verification': face_verification_result if face_verification_result else None
        }), 200

    except IntegrityError as e:
        db.session.rollback()
        if 'phone' in str(e):
            return jsonify({'error': 'This phone number is already in use.'}), 400
        elif 'linkedin' in str(e):
            return jsonify({'error': 'This LinkedIn profile is already in use.'}), 400
        elif 'github' in str(e):
            return jsonify({'error': 'This GitHub profile is already in use.'}), 400
        else:
            return jsonify({'error': 'An error occurred while updating your profile.'}), 400
    except ValueError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500
@candidate_api_bp.route('/eligible-assessments/<int:user_id>', methods=['GET'])
def get_eligible_assessments(user_id):
    """Retrieve eligible and attempted assessments for a candidate."""
    candidate = Candidate.query.filter_by(user_id=user_id).first_or_404()

    if not candidate.is_profile_complete:
        return jsonify({'eligible_assessments': [], 'attempted_assessments': []}), 200

    # Current date and time in IST (UTC+5:30)
    current_time = datetime.now(timezone.utc).astimezone(timezone(offset=timedelta(hours=5, minutes=30)))

    assessments = JobDescription.query.all()
    eligible_assessments = []
    attempted_assessments = set()

    # Check for completed or started attempts
    attempts = AssessmentAttempt.query.filter_by(candidate_id=candidate.candidate_id).all()
    for attempt in attempts:
        if attempt.status in ['started', 'completed']:
            attempted_assessments.add(attempt.job_id)

    for assessment in assessments:
        # Convert schedule_start to offset-aware datetime with IST
        schedule_start = assessment.schedule_start.replace(tzinfo=timezone(offset=timedelta(hours=5, minutes=30))) if assessment.schedule_start else None
        schedule_end = assessment.schedule_end.replace(tzinfo=timezone(offset=timedelta(hours=5, minutes=30))) if assessment.schedule_end else None

        # Skip if past schedule_end and no attempt exists
        if schedule_end and current_time > schedule_end:
            has_attempt = AssessmentAttempt.query.filter_by(
                candidate_id=candidate.candidate_id,
                job_id=assessment.job_id
            ).first() is not None
            if not has_attempt:
                continue

        # Check years of experience
        experience_match = (
            assessment.experience_min <= candidate.years_of_experience <= assessment.experience_max
        )

        # Check degree
        degree_match = False
        if assessment.degree_required and candidate.degree:
            degree_match = assessment.degree_required.lower() == candidate.degree.lower()
        elif not assessment.degree_required:
            degree_match = True

        # Exclude if already attempted
        if assessment.job_id in attempted_assessments:
            continue

        if experience_match and degree_match:
            is_registered = AssessmentRegistration.query.filter_by(
                candidate_id=candidate.candidate_id,
                job_id=assessment.job_id
            ).first() is not None

            eligible_assessments.append({
                'job_id': assessment.job_id,
                'job_title': assessment.job_title,
                'company': assessment.company,
                'experience_min': assessment.experience_min,
                'experience_max': assessment.experience_max,
                'degree_required': assessment.degree_required,
                'schedule_start': assessment.schedule_start.isoformat() if assessment.schedule_start else None,
                'schedule_end': assessment.schedule_end.isoformat() if assessment.schedule_end else None,
                'duration': assessment.duration,
                'num_questions': assessment.num_questions,
                'description': assessment.description if hasattr(assessment, 'description') else None,
                'is_registered': is_registered
            })

    # Fetch attempted assessments (align with /api/assessment/all)
    attempted_assessments_data = []
    for attempt in attempts:
        if attempt.status in ['started', 'completed']:
            job = JobDescription.query.get(attempt.job_id)
            if job:
                attempted_assessments_data.append({
                    'job_id': job.job_id,
                    'job_title': job.job_title,
                    'company': job.company,
                    'attempt_id': attempt.attempt_id,
                    'status': attempt.status,
                    'attempt_date': attempt.start_time.isoformat() if attempt.start_time else None
                })

    response = {
        'eligible_assessments': eligible_assessments,
        'attempted_assessments': attempted_assessments_data
    }
    # logger.debug(f"Returning assessments at {current_time}: {response}")
    return jsonify(response), 200

@candidate_api_bp.route('/register-assessment', methods=['POST'])
def register_assessment():
    """Register a candidate for an assessment."""
    data = request.get_json()
    candidate_id = data.get('candidate_id')
    job_id = data.get('job_id')

    if not candidate_id or not job_id:
        return jsonify({'error': 'Missing candidate_id or job_id'}), 400

    candidate = Candidate.query.filter_by(user_id=candidate_id).first_or_404()
    job = JobDescription.query.get_or_404(job_id)

    existing_registration = AssessmentRegistration.query.filter_by(
        candidate_id=candidate.candidate_id,
        job_id=job_id
    ).first()
    if existing_registration:
        return jsonify({'error': 'Already registered for this assessment'}), 400

    registration = AssessmentRegistration(
        candidate_id=candidate.candidate_id,
        job_id=job_id,
        registration_date=datetime.utcnow()
    )
    db.session.add(registration)
    try:
        db.session.commit()
    except IntegrityError as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to register: Invalid data ({str(e)})'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to register: {str(e)}'}), 500

    return jsonify({'message': 'Successfully registered for assessment'}), 200

@candidate_api_bp.route('/start-assessment', methods=['POST'])
def start_assessment():
    """Start a new assessment attempt for a candidate."""
    data = request.get_json()
    user_id = data.get('user_id')
    job_id = data.get('job_id')

    candidate = Candidate.query.filter_by(user_id=user_id).first_or_404()
    candidate_id = candidate.candidate_id

    if not candidate_id or not job_id:
        return jsonify({'error': 'Missing candidate_id or job_id'}), 400

    # Check if assessment is registered
    registration = AssessmentRegistration.query.filter_by(
        candidate_id=candidate_id,
        job_id=job_id
    ).first()
    if not registration:
        return jsonify({'error': 'Candidate not registered for this assessment'}), 403

    # Check schedule
    job = JobDescription.query.get_or_404(job_id)
    current_time = datetime.now(timezone.utc).astimezone(timezone(offset=timedelta(hours=5, minutes=30)))
    schedule_start = job.schedule_start.replace(tzinfo=timezone(offset=timedelta(hours=5, minutes=30))) if job.schedule_start else None
    schedule_end = job.schedule_end.replace(tzinfo=timezone(offset=timedelta(hours=5, minutes=30))) if job.schedule_end else None

    if schedule_start and current_time < schedule_start:
        return jsonify({'error': f'Assessment not yet started. Scheduled for {schedule_start}'}), 403
    if schedule_end and current_time > schedule_end:
        return jsonify({'error': f'Assessment period has ended. Ended at {schedule_end}'}), 403

    # Check for existing attempt
    existing_attempt = AssessmentAttempt.query.filter_by(
        candidate_id=candidate_id,
        job_id=job_id,
        status='started'
    ).first()
    if existing_attempt:
        return jsonify({'attempt_id': existing_attempt.attempt_id}), 200

    attempt = AssessmentAttempt(
        candidate_id=candidate_id,
        job_id=job_id,
        start_time=datetime.utcnow(),
        status='started'
    )
    db.session.add(attempt)
    db.session.commit()

    return jsonify({'attempt_id': attempt.attempt_id}), 200