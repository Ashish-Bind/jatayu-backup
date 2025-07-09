from deepface import DeepFace
import os

# ----------- Step 1: Validate Profile Image -----------
# profile_image = "app/static/uploads/snapshots/person1.jpg"  # path to profile image

# Set the root directory (adjust if your script is not directly in backend/)
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..','static/uploads'))

print(PROJECT_ROOT)


img1_path = f"profile_pics/6_test.jpg"
img2_path = "snapshots/attempt64_20250704T171300.jpg"
snapshot_path = os.path.normpath(os.path.join(PROJECT_ROOT,img2_path))
candidate_image_path = os.path.normpath(os.path.join(PROJECT_ROOT,img1_path))  # path to profile image

print(f"📸 Comparing {candidate_image_path} with {snapshot_path}...")

try:
    faces = DeepFace.extract_faces(img_path=candidate_image_path, enforce_detection=True)
    if len(faces) > 0:
        print("✅ Human face detected in profile image.")
    else:
        print("❌ No human face detected.")
        exit()
except Exception as e:
    print("❌ Error: No valid human face in profile image.")
    exit()

# ----------- Step 2: Verify Webcam Snapshot -----------
webcam_image = "./Ashish Bind Photo.png"  # path to webcam image

try:
    result = DeepFace.verify(img1_path=snapshot_path, img2_path=snapshot_path, model_name="SFace", enforce_detection=True)
    
    if result['verified']:
        print("✅ Faces match. Same person.")
    else:
        print("❌ Faces do NOT match.")
    
    print(f"Distance: {result['distance']:.4f} | Threshold: {result['threshold']:.4f}")
except Exception as e:
    print("❌ Face verification failed. Details:", str(e))
