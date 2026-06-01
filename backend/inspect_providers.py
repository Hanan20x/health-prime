import os
import sys
from sqlalchemy import select

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
from app.models import Provider, Appointment

with SessionLocal() as db:
    providers = db.scalars(select(Provider)).all()
    print("PROVIDERS:")
    for p in providers:
        print(f"ID: {p.id}, Name: {p.full_name}, Specialty: {p.specialty}")
        
    appts = db.scalars(select(Appointment)).all()
    print("\nAPPOINTMENTS:")
    for a in appts:
        print(f"ID: {a.id}, Provider ID: {a.provider_id}, Date: {a.appointment_date}, AI: {a.is_ai_generated}")
