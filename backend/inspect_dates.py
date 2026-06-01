import os
import sys
from sqlalchemy import select

# Add backend dir to path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_dir)

# Manually load .env from backend folder
env_path = os.path.join(backend_dir, ".env")
if os.path.exists(env_path):
    with open(env_path, "r") as f:
        for line in f:
            if "=" in line and not line.startswith("#"):
                key, val = line.strip().split("=", 1)
                os.environ[key] = val

from app.database import SessionLocal
from app.models import Appointment

with SessionLocal() as db:
    appts = db.scalars(select(Appointment)).all()
    for app in appts:
        print(f"ID: {app.id}, Date: {app.appointment_date}, Type: {type(app.appointment_date)}, TZ: {app.appointment_date.tzinfo}, AI: {app.is_ai_generated}")
