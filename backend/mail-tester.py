from flask import Flask
from flask_mail import Mail, Message
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
app.config.from_object('app.config.Config')
mail = Mail(app)

with app.app_context():
    msg = Message(
        subject="Test Email",
        recipients=["ashishbind97@apsit.edu.in"],
        body="Hello from Flask Mail!"
    )
    mail.send(msg)