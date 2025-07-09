import os
from urllib.parse import quote
from dotenv import load_dotenv

load_dotenv()

class Config:
    @staticmethod
    def get_db_uri():
        db_user = os.getenv("DB_USER")
        db_password = os.getenv("DB_PASSWORD")
        db_host = os.getenv("DB_HOST", "localhost")
        db_port = os.getenv("DB_PORT", 5432)
        db_name = os.getenv("DB_NAME")

        # Debugging step: ensure values are loaded
        if not db_user or not db_password or not db_name:
            raise ValueError("Missing one or more required DB environment variables")

        encoded_user = quote(db_user)
        encoded_password = quote(db_password)

        return f"postgresql://{encoded_user}:{encoded_password}@{db_host}:{db_port}/{db_name}"

    SQLALCHEMY_DATABASE_URI = get_db_uri.__func__()
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    MAIL_SERVER = os.getenv('MAIL_SERVER')
    MAIL_PORT = int(os.getenv('MAIL_PORT'))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS') == 'True'
    MAIL_USE_SSL = os.getenv('MAIL_USE_SSL') == 'True'
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER')
