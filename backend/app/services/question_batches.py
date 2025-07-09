import wikipediaapi
import numpy as np
import time
import os
import re
import threading
import functools
import hashlib
from flask import current_app
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
from google.api_core.exceptions import TooManyRequests
from app import db
from app.models.skill import Skill
from app.models.mcq import MCQ

# Cross-platform timeout implementation with Flask context
class TimeoutError(Exception):
    pass

def timeout_with_context(seconds):
    """Cross-platform timeout decorator that preserves Flask application context"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Capture the current Flask app context
            app = current_app._get_current_object()
            result = [None]
            exception = [None]
            
            def target():
                # Push the app context in the new thread
                with app.app_context():
                    try:
                        result[0] = func(*args, **kwargs)
                    except Exception as e:
                        exception[0] = e
            
            thread = threading.Thread(target=target)
            thread.daemon = True
            thread.start()
            thread.join(seconds)
            
            if thread.is_alive():
                # Thread is still running, which means timeout occurred
                raise TimeoutError(f'Function call timed out after {seconds} seconds')
            
            if exception[0]:
                raise exception[0]
            
            return result[0]
        return wrapper
    return decorator

# Configure Gemini AI API
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY environment variable not set")
genai.configure(api_key=api_key)
generation_config = {
    "temperature": 0.2,
    "max_output_tokens": 2048
}
model_gemini = genai.GenerativeModel(
    model_name="gemini-1.5-flash", generation_config=generation_config
)
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
wiki = wikipediaapi.Wikipedia(
    user_agent="MandviAIQuiz/1.0 (contact: mandvishukla20@gmail.com)", language='en'
)

def divide_experience_range(jd_range):
    start, end = map(float, jd_range.split("-"))
    interval = (end - start) / 3
    return {
        "good": (start, start + interval),
        "better": (start + interval, start + 2 * interval),
        "perfect": (start + 2 * interval, end)
    }

def expand_skills_with_gemini(skill):
    prompt = f"List 5 key subtopics under {skill} that are relevant for a technical interview. Only list the subskills."
    try:
        chat_session = model_gemini.start_chat(history=[{"role": "user", "parts": [prompt]}])
        response = chat_session.send_message(prompt)
    except TooManyRequests:
        print(f"⛔️ Gemini quota exceeded while expanding skill: {skill}")
        return []
    if response and isinstance(response.text, str):
        subtopics = [line.strip("- ").strip() for line in response.text.split("\n") if line.strip()][:5]
        return subtopics
    return []

def fetch_wikipedia_content(topic):
    page = wiki.page(topic)
    return page.summary if page.exists() else None

def generate_questions_prompt(skill, subskills, difficulty_band, job_description=""):
    difficulty_descriptor = {
        "good": "easy and theory-based, suitable for beginners. Can be data structures and algorithms based question",
        "better": "moderate difficulty, mixing theory and practical concepts can be dsa based or practical based question",
        "perfect": "challenging, practical, and suitable for advanced learners, should mostly be a code snippet to test practical skills"
    }[difficulty_band]
    description_context = f"The job description is: {job_description}" if job_description else "There is no specific job description provided."
    prompt = f"""
    {description_context}
    Generate 20 unique and diverse multiple-choice questions (MCQs) on the skill '{skill}' and its subskills: {", ".join(subskills)}.
    The questions should be {difficulty_descriptor}. It should also include a few code snippets where applicable.
    Guidelines:
    1. Each question must be different in wording and concept.
    2. Cover a broad range of topics from the subskills provided.
   algas
    3. Do NOT repeat similar ideas or phrasing.
    4. Each MCQ must have exactly four options labeled (A), (B), (C), (D).
    5. Include the correct answer at the end in the format: "Correct Answer: (B)"
    6. Format each question exactly like this:
    "Question text\n\n(A) Option A\n(B) Option B\n(C) Option C\n(D) Option D\n\nCorrect Answer: (B)"
    7. Return the questions as a list of strings, separated by commas, enclosed in square brackets, e.g., ["question1...", "question2..."].
    Return ONLY the list of 20 formatted MCQs. No extra text, no explanations, no code block markers (like ```json or ```python).
    """
    return prompt.strip()

def generate_single_question_prompt(skill, subskills, difficulty_band, job_description=""):
    difficulty_descriptor = {
        "good": "easy and theory-based, suitable for beginners. Can be data structures and algorithms based question",
        "better": "moderate difficulty, mixing theory and practical concepts can be dsa based or practical based question",
        "perfect": "challenging, practical, and suitable for advanced learners, should mostly be a code snippet to test practical skills"
    }[difficulty_band]
    description_context = f"The job description is: {job_description}" if job_description else "There is no specific job description provided."
    prompt = f"""
    {description_context}
    Generate a single multiple-choice question (MCQ) on the skill '{skill}' and its subskills: {", ".join(subskills)}.
    The question should be {difficulty_descriptor}. Include a code snippet if applicable.
    Guidelines:
    1. The question must be unique and concise.
    2. Cover a topic from the skill or subskills provided.
    3. The MCQ must have exactly four options labeled (A), (B), (C), (D).
    4. Include the correct answer in the format: "Correct Answer: (B)"
    5. Format the question exactly like this:
    "Question text\n\n(A) Option A\n(B) Option B\n(C) Option C\n(D) Option D\n\nCorrect Answer: (B)"
    Return ONLY the formatted MCQ as a string. No extra text, no code block markers.
    """
    return prompt.strip()

def parse_question(question_text):
    lines = [line.strip() for line in question_text.strip().split("\n") if line.strip()]
    if len(lines) != 6:
        print(f"Invalid question format (wrong number of lines, got {len(lines)}): {question_text}")
        return None
    question = lines[0]
    option_a = re.sub(r'^\(A\)\s*', '', lines[1])
    option_b = re.sub(r'^\(B\)\s*', '', lines[2])
    option_c = re.sub(r'^\(C\)\s*', '', lines[3])
    option_d = re.sub(r'^\(D\)\s*', '', lines[4])
    correct_answer_line = lines[5]
    match = re.match(r'Correct Answer:\s*\(([A-D])\)\s*$', correct_answer_line)
    if not match:
        print(f"Invalid correct answer format in line: '{correct_answer_line}'")
        return None
    correct_answer = match.group(1)
    return {
        "question": question,
        "option_a": option_a,
        "option_b": option_b,
        "option_c": option_c,
        "option_d": option_d,
        "correct_answer": correct_answer
    }

def parse_response(raw_text):
    raw_text = raw_text.strip()
    raw_text = re.sub(r'^```(json|python)\s*\n', '', raw_text, flags=re.MULTILINE)
    raw_text = re.sub(r'\n```$', '', raw_text, flags=re.MULTILINE)
    raw_text = raw_text.strip()
    
    if raw_text.startswith("[") and raw_text.endswith("]"):
        content = raw_text[1:-1].strip()
        if not content:
            return []
        questions = []
        current_question = []
        inside_quote = False
        current_line = ""
        
        for char in content:
            if char == '"':
                inside_quote = not inside_quote
                current_line += char
            elif char == ',' and not inside_quote:
                if current_line:
                    current_question.append(current_line.strip('"'))
                    question_text = "\n".join(current_question)
                    questions.append(question_text)
                    current_question = []
                    current_line = ""
            else:
                current_line += char
                if char == "\n":
                    current_question.append(current_line.strip())
                    current_line = ""
        
        if current_line:
            current_question.append(current_line.strip('"'))
            question_text = "\n".join(current_question)
            questions.append(question_text)
        return questions
    else:
        return [raw_text] if raw_text else []

@timeout_with_context(5)
def generate_single_question_with_timeout(skill_name, difficulty_band, job_id, job_description="", used_question_ids=None):
    """Generate a single question with timeout - internal function"""
    skill = Skill.query.filter_by(name=skill_name).first()
    if not skill:
        print(f"⚠️ Skill {skill_name} not found in database.")
        return None
    
    skill_id = skill.skill_id
    subskills = expand_skills_with_gemini(skill_name)
    prompt = generate_single_question_prompt(skill_name, subskills, difficulty_band, job_description)
    
    chat = model_gemini.start_chat(history=[{"role": "user", "parts": [prompt]}])
    response = chat.send_message(prompt)
    
    if response and isinstance(response.text, str):
        questions = parse_response(response.text)
        if not questions:
            print(f"⚠️ No valid question generated for {skill_name} ({difficulty_band})")
            return None
        
        parsed = parse_question(questions[0])
        if not parsed:
            print(f"⚠️ Invalid question format for {skill_name} ({difficulty_band})")
            return None
        
        mcq = MCQ(
            job_id=job_id,
            skill_id=skill_id,
            question=parsed["question"],
            option_a=parsed["option_a"],
            option_b=parsed["option_b"],
            option_c=parsed["option_c"],
            option_d=parsed["option_d"],
            correct_answer=parsed["correct_answer"],
            difficulty_band=difficulty_band
        )
        db.session.add(mcq)
        db.session.commit()
        
        print(f"✅ Saved real-time question for {skill_name} ({difficulty_band}) to MCQ table")
        return {
            "mcq_id": mcq.mcq_id,
            "question": parsed["question"],
            "option_a": parsed["option_a"],
            "option_b": parsed["option_b"],
            "option_c": parsed["option_c"],
            "option_d": parsed["option_d"],
            "correct_answer": parsed["correct_answer"]
        }
    return None

def get_prestored_question(skill_name, difficulty_band, job_id, used_question_ids=None):
    print("used_question_ids:", used_question_ids)
    try:
        skill = Skill.query.filter_by(name=skill_name).first()
        if not skill:
            print(f"⚠️ Skill {skill_name} not found in database.")
            return None
        
        query = MCQ.query.filter_by(
            job_id=job_id,
            skill_id=skill.skill_id,
            difficulty_band=difficulty_band
        )
        
        if used_question_ids:
            query = query.filter(~MCQ.mcq_id.in_(used_question_ids))
        
        existing_mcq = query.first()
        
        if existing_mcq:
            print(f"📦 Using pre-stored question for {skill_name} ({difficulty_band}) - ID: {existing_mcq.mcq_id}")
            return {
                "mcq_id": existing_mcq.mcq_id,
                "question": existing_mcq.question,
                "option_a": existing_mcq.option_a,
                "option_b": existing_mcq.option_b,
                "option_c": existing_mcq.option_c,
                "option_d": existing_mcq.option_d,
                "correct_answer": existing_mcq.correct_answer
            }
        else:
            print(f"⚠️ No unused pre-stored questions found for {skill_name} ({difficulty_band})")
            return None
    except Exception as e:
        print(f"⚠️ Error fetching pre-stored question: {e}")
        return None

def generate_single_question(skill_name, difficulty_band, job_id, job_description="", used_question_ids=None):
    print("used_question_ids in generate:", used_question_ids)
    """
    Main function that tries real-time generation with fallback to pre-stored questions
    
    Args:
        skill_name: Name of the skill
        difficulty_band: Difficulty level (good/better/perfect)
        job_id: Job ID
        job_description: Job description (optional)
        used_question_ids: List of already used question IDs to avoid duplicates
    """
    if used_question_ids is None:
        used_question_ids = []
    
    max_attempts = 3
    for attempt in range(max_attempts):
        try:
            # Try to generate question in real-time with timeout
            result = generate_single_question_with_timeout(skill_name, difficulty_band, job_id, job_description)
            if result:
                # Compute a hash of the question content to check for duplicates
                question_content = f"{result['question']}{result['option_a']}{result['option_b']}{result['option_c']}{result['option_d']}"
                question_hash = hashlib.md5(question_content.encode()).hexdigest()
                
                # Check if this question (or its hash) has been used
                used_hashes = [hashlib.md5(str(q).encode()).hexdigest() for q in used_question_ids if isinstance(q, dict)]
                if result["mcq_id"] in used_question_ids or question_hash in used_hashes:
                    print(f"⚠️ Duplicate question detected (mcq_id: {result['mcq_id']}, hash: {question_hash}). Retrying...")
                    continue
                return result
        except TimeoutError:
            print(f"⏰ Real-time generation timed out for {skill_name} ({difficulty_band}). Falling back to pre-stored questions.")
            break
        except Exception as e:
            print(f"⚠️ Error in real-time generation for {skill_name} ({difficulty_band}): {e}")
            print("🔄 Falling back to pre-stored questions.")
            break
    
    # Fallback to pre-stored questions
    return get_prestored_question(skill_name, difficulty_band, job_id, used_question_ids)

def prepare_question_batches(skills_with_priorities, jd_experience_range, job_id, job_description=""):
    band_ranges = divide_experience_range(jd_experience_range)
    knowledge_base = {}
    question_bank = {"good": {}, "better": {}, "perfect": {}}
    total_questions_saved = 0
    
    for skill_data in skills_with_priorities:
        skill_name = skill_data["name"]
        print(f"\n📌 Processing Skill: {skill_name} (Priority: {skill_data['priority']})")
        skill = Skill.query.filter_by(name=skill_name).first()
        if not skill:
            print(f"⚠️ Skill {skill_name} not found in database. Skipping...")
            continue
        skill_id = skill.skill_id
        subskills = expand_skills_with_gemini(skill_name)
        all_topics = [skill_name] + subskills
        for topic in all_topics:
            if topic not in knowledge_base:
                content = fetch_wikipedia_content(topic)
                if content:
                    embedding = embedding_model.encode(content)
                    knowledge_base[topic] = {
                        "content": content,
                        "embedding": np.array(embedding)
                    }
        
        for band in ["good", "better", "perfect"]:
            key = f"{skill_name}"
            if key not in question_bank[band]:
                question_bank[band][key] = []
            
            prompt = generate_questions_prompt(skill_name, subskills, band, job_description)
            try:
                chat = model_gemini.start_chat(history=[{"role": "user", "parts": [prompt]}])
                response = chat.send_message(prompt)
                
                if response and isinstance(response.text, str):
                    raw_text = response.text.strip()
                    questions = parse_response(raw_text)
                    print(f"✅ [{band.upper()}] {skill_name}: {len(questions)} questions generated")
                    
                    for q in questions:
                        parsed = parse_question(q)
                        if not parsed:
                            print(f"⚠️ Invalid question format for {skill_name} in {band} band: {q}")
                            continue
                        
                        try:
                            mcq = MCQ(
                                job_id=job_id,
                                skill_id=skill_id,
                                question=parsed["question"],
                                option_a=parsed["option_a"],
                                option_b=parsed["option_b"],
                                option_c=parsed["option_c"],
                                option_d=parsed["option_d"],
                                correct_answer=parsed["correct_answer"],
                                difficulty_band=band
                            )
                            db.session.add(mcq)
                            total_questions_saved += 1
                            print(f"Added MCQ: {parsed['question']} (Band: {band}, Correct Answer: {parsed['correct_answer']})")
                        except Exception as e:
                            print(f"⚠️ Error adding MCQ to session for {skill_name} in {band} band: {e}")
                            print(f"MCQ data: {parsed}")
            
            except TooManyRequests:
                print("⛔️ Gemini quota exceeded. Retrying in 10 seconds...")
                time.sleep(10)
            except Exception as e:
                print(f"⚠️ Error generating batch for {skill_name} in {band} band: {e}")
            
            time.sleep(1.5)
    
    try:
        db.session.commit()
        print(f"✅ {total_questions_saved} questions saved to the database.")
    except Exception as e:
        db.session.rollback()
        print(f"⚠️ Error saving questions to database: {e}")
    
    print("\n✅ Question generation completed!")