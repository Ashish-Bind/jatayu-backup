from flask import Blueprint, jsonify, request
import os
from app import db
from app.models.candidate import Candidate
from app.models.job import JobDescription
from app.models.assessment_attempt import AssessmentAttempt
from app.models.skill import Skill
from app.models.candidate_skill import CandidateSkill
from sqlalchemy.exc import IntegrityError
from datetime import datetime
import google.generativeai as genai
import logging
from io import BytesIO
from pdfminer.high_level import extract_text
import json

from app.models.assessment_registration import AssessmentRegistration

candidate_api_bp = Blueprint('candidate_api', __name__, url_prefix='/api/candidate')

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configure Gemini API
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))

def is_valid_pdf(file):
    """Check if the file is a valid PDF by verifying its magic number."""
    try:
        # Read the first 5 bytes of the file
        file.seek(0)
        magic = file.read(5)
        file.seek(0)  # Reset the pointer
        return magic == b'%PDF-'
    except Exception as e:
        logger.error(f"Error checking PDF magic number: {e}")
        return False

def extract_text_from_pdf(pdf_file):
    try:
        # Check if the input is a FileStorage object (from Flask request.files)
        if hasattr(pdf_file, 'read'):
            # Validate that the file is a PDF
            if not is_valid_pdf(pdf_file):
                raise ValueError("The uploaded file is not a valid PDF.")
            # Read the file content into a BytesIO object
            pdf_content = pdf_file.read()
            pdf_file.seek(0)  # Reset the file pointer to the beginning
            pdf_stream = BytesIO(pdf_content)
            text = extract_text(pdf_stream)
        else:
            raise ValueError("pdf_file must be a file-like object with a read method.")
        return text
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        return None

def analyze_resume(resume_text):
    try:
        model = genai.GenerativeModel('gemini-1.5-pro-latest')
        prompt = f"""
You are a JSON assistant. Extract and return ONLY valid JSON in the following format (no comments or explanations):

{{
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

Extract skills and related information from the resume as follows:
- Under "Skills", categorize into "Technical Skills", "Soft Skills", and "Tools".
- Under "Work Experience", include each work experience with a brief "Description" and "Technologies".
- Under "Projects", list each project with its "Title", "Description", and "Technologies".
- Infer technologies for both "Work Experience" and "Projects":
  - If "Jupyter Notebook", "Google Collab", "Flask", or "Jupyter" is mentioned, include "Python" in Technologies.
  - If React is mentioned, include "JavaScript" in Technologies.
  - If terms like "deep learning", "reinforcement learning", "AIML", or "AI" are mentioned, include "Artificial Intelligence" and "Machine Learning" in Technologies.
  - If terms like "data structures", "algorithms", or "programming" are mentioned, include the relevant programming language (e.g., "Python", "Java") if specified.
- Include skills like "Excel Pivoting" and "GitHub" in "Technical Skills" if mentioned, even if they might also be considered tools.

Resume:
{resume_text}
        """
        response = model.generate_content(prompt)
        logger.debug(f"Raw Gemini API output: {response.text}")
        return response.text
    except Exception as e:
        logger.error(f"Error during Gemini API call: {e}")
        return None

def refine_json_output(json_string):
    try:
        cleaned = json_string.strip().removeprefix("```json").removesuffix("```").strip()
        result = json.loads(cleaned)
        return result
    except Exception as e:
        logger.error(f"Error parsing JSON: {e}")
        return None

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
    
    logger.debug(f"Evaluating proficiency for skill: {skill}")

    # Check work experience
    for exp in work_experience:
        combined = (str(exp.get("Title", "")) + " " + str(exp.get("Description", "")) + " " + str(exp.get("Technologies", ""))).lower()
        skill_found = False
        if skill_lower in combined:
            score += 2
            skill_found = True
            logger.debug(f"Skill '{skill}' found in work experience: +2 (Score: {score})")
        for related_term in related_terms.get(skill_lower, []):
            if related_term in combined:
                score += 2
                skill_found = True
                logger.debug(f"Related term '{related_term}' for skill '{skill}' found in work experience: +2 (Score: {score})")
                break
        if skill_found and any(kw in combined for kw in strong_keywords):
            score += 2
            logger.debug(f"Strong keyword found for '{skill}' in work experience: +2 (Score: {score})")
        if combined.count(skill_lower) >= 2:
            score += 1
            logger.debug(f"Multiple mentions of '{skill}' in work experience: +1 (Score: {score})")

    # Check projects
    for proj in projects:
        proj_text = (str(proj.get("Title", "")) + " " + str(proj.get("Description", "")) + " " + str(proj.get("Technologies", ""))).lower()
        skill_found = False
        if skill_lower in proj_text:
            score += 2
            skill_found = True
            logger.debug(f"Skill '{skill}' found in projects: +2 (Score: {score})")
        for related_term in related_terms.get(skill_lower, []):
            if related_term in proj_text:
                score += 2
                skill_found = True
                logger.debug(f"Related term '{related_term}' for skill '{skill}' found in projects: +2 (Score: {score})")
                break
        if skill_found and any(kw in proj_text for kw in strong_keywords):
            score += 2
            logger.debug(f"Strong keyword found in project for '{skill}': +2 (Score: {score})")
        if proj_text.count(skill_lower) >= 2:
            score += 1
            logger.debug(f"Multiple mentions of '{skill}' in projects: +1 (Score: {score})")

    # Check education
    for edu in education:
        edu_text = (str(edu.get("Degree", "")) + " " + str(edu.get("Institution", ""))).lower()
        skill_found = False
        if skill_lower in edu_text:
            score += 1
            skill_found = True
            logger.debug(f"Skill '{skill}' found in education: +1 (Score: {score})")
        for related_term in related_terms.get(skill_lower, []):
            if related_term in edu_text:
                score += 1
                skill_found = True
                logger.debug(f"Related term '{related_term}' for skill '{skill}' found in education: +1 (Score: {score})")
                break
        if skill_found and "certification" in edu_text:
            score += 2
            logger.debug(f"Certification mention for '{skill}' in education: +2 (Score: {score})")

    if score >= 5:
        proficiency = 8  # Advanced
        logger.debug(f"Final proficiency for '{skill}': Advanced (8) with score {score}")
    elif score >= 2:
        proficiency = 6  # Intermediate
        logger.debug(f"Final proficiency for '{skill}': Intermediate (6) with score {score}")
    else:
        proficiency = 4  # Beginner
        logger.debug(f"Final proficiency for '{skill}': Beginner (4) with score {score}")
    return proficiency

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
        'is_profile_complete': candidate.is_profile_complete
    })

@candidate_api_bp.route('/profile/<int:user_id>', methods=['POST'])
def update_profile(user_id):
    candidate = Candidate.query.get_or_404(user_id)

    try:
        # Handle form data
        candidate.name = request.form.get('name')
        candidate.phone = request.form.get('phone')
        candidate.location = request.form.get('location')
        candidate.linkedin = request.form.get('linkedin')
        candidate.github = request.form.get('github')
        candidate.degree = request.form.get('degree')
        candidate.years_of_experience = float(request.form.get('years_of_experience'))
        
        # Handle file uploads (resume and profile picture)
        resume_file = request.files.get('resume')
        profile_pic_file = request.files.get('profile_picture')
        
        if resume_file:
            resume_filename = f"resumes/{user_id}_{resume_file.filename}"
            resume_path = os.path.join('app/static/uploads', resume_filename)
            resume_file.save(resume_path)
            candidate.resume = resume_filename

            # Parse resume and extract skills
            resume_text = extract_text_from_pdf(resume_file)
            if not resume_text:
                return jsonify({'error': 'Failed to extract text from the resume. Please ensure the file is a valid, non-corrupted PDF.'}), 400

            gemini_output = analyze_resume(resume_text)
            if not gemini_output:
                return jsonify({'error': 'Failed to parse resume with Gemini API.'}), 400

            parsed_data = refine_json_output(gemini_output)
            if not parsed_data:
                return jsonify({'error': 'Failed to parse Gemini API output.'}), 400

            # Extract skills and calculate proficiency
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

                # Check if skill exists, otherwise create it
                skill = Skill.query.filter_by(name=skill_name).first()
                if not skill:
                    skill = Skill(name=skill_name, category='technical')  # Default to technical category
                    db.session.add(skill)
                    db.session.flush()

                # Calculate proficiency
                proficiency = infer_proficiency(skill_name, work_experience, education, projects)

                # Check if the candidate already has this skill
                existing_skill = CandidateSkill.query.filter_by(
                    candidate_id=candidate.candidate_id,
                    skill_id=skill.skill_id
                ).first()

                if existing_skill:
                    # Update proficiency if the skill already exists
                    existing_skill.proficiency = proficiency
                else:
                    # Add new skill entry
                    candidate_skill = CandidateSkill(
                        candidate_id=candidate.candidate_id,
                        skill_id=skill.skill_id,
                        proficiency=proficiency
                    )
                    db.session.add(candidate_skill)
        
        if profile_pic_file:
            profile_pic_filename = f"profile_pics/{user_id}_{profile_pic_file.filename}"
            profile_pic_path = os.path.join('app/static/uploads', profile_pic_filename)
            profile_pic_file.save(profile_pic_path)
            candidate.profile_picture = profile_pic_filename

        candidate.is_profile_complete = True
        db.session.commit()

        return jsonify({'message': 'Profile updated successfully'}), 200

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
    except ValueError:
        return jsonify({'error': 'Please enter a valid number for years of experience.'}), 400

@candidate_api_bp.route('/eligible-assessments/<int:user_id>', methods=['GET'])
def get_eligible_assessments(user_id):
    # Fetch candidate by user_id
    candidate = Candidate.query.filter_by(user_id=user_id).first_or_404()

    # Return empty list if profile is incomplete
    if not candidate.is_profile_complete:
        return jsonify([]), 200

    # Fetch all job descriptions (assessments)
    assessments = JobDescription.query.all()
    eligible_assessments = []

    for assessment in assessments:
        # Check years of experience
        experience_match = (
            assessment.experience_min <= candidate.years_of_experience <= assessment.experience_max
        )

        # Check degree (case-insensitive match, allowing for None in degree_required)
        degree_match = False
        if assessment.degree_required and candidate.degree:
            degree_match = assessment.degree_required.lower() == candidate.degree.lower()
        elif not assessment.degree_required:
            degree_match = True  # No degree required, so candidate is eligible

        if experience_match and degree_match:
            # Check if candidate is registered for this assessment
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

    return jsonify(eligible_assessments), 200

@candidate_api_bp.route('/register-assessment', methods=['POST'])
def register_assessment():
    data = request.get_json()
    candidate_id = data.get('candidate_id')
    job_id = data.get('job_id')

    if not candidate_id or not job_id:
        return jsonify({'error': 'Missing candidate_id or job_id'}), 400

    # Check if candidate exists
    candidate = Candidate.query.filter_by(user_id = candidate_id).first_or_404()

    # Check if job exists
    job = JobDescription.query.get_or_404(job_id)

    # Check if already registered
    existing_registration = AssessmentRegistration.query.filter_by(
        candidate_id=candidate.candidate_id,
        job_id=job_id
    ).first()
    if existing_registration:
        return jsonify({'error': 'Already registered for this assessment'}), 400

    # Create new registration
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
        return jsonify({'error': f'Failed to register: Invalid candidate_id or job_id ({str(e)})'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to register: {str(e)}'}), 500

    return jsonify({'message': 'Successfully registered for the assessment'}), 200


@candidate_api_bp.route('/start-assessment', methods=['POST'])
def start_assessment():
    data = request.get_json()
    user_id = data.get('user_id')
    job_id = data.get('job_id')

    candidate = Candidate.query.filter_by(user_id=user_id).first_or_404()
    candidate_id = candidate.candidate_id

    if not candidate_id or not job_id:
        return jsonify({'error': 'Missing candidate_id or job_id'}), 400

    # Create a new assessment attempt
    attempt = AssessmentAttempt(
        candidate_id=candidate_id,
        job_id=job_id,
        start_time=datetime.utcnow(),
        status='started'
    )
    db.session.add(attempt)
    db.session.commit()

    return jsonify({'attempt_id': attempt.attempt_id}), 200