from google.cloud import storage
from datetime import timedelta
import os

GCS_BUCKET = "gen-ai-quiz"  # your bucket name

def upload_to_gcs(file_obj, destination_path, content_type, make_public=True):
    client = storage.Client()
    bucket = client.bucket(GCS_BUCKET)
    blob = bucket.blob(destination_path)
    blob.upload_from_file(file_obj, content_type=content_type)

    if make_public:
        blob.make_public()

    return blob.public_url
