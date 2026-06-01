import os
import sys
from datetime import datetime, timedelta, timezone
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
    # Let's find one of the conflicting appointments at May 28, 2026 2:30 PM Malaysian Time
    # Malaysia is UTC+8, so 2:30 PM Malaysia = 14:30:00+08:00
    local_tz = datetime.now().astimezone().tzinfo
    print(f"System local timezone: {local_tz}")
    
    # 1. Naive Datetime approach
    naive_date = datetime(2026, 5, 28, 14, 30)
    start_naive = naive_date - timedelta(minutes=29)
    end_naive = naive_date + timedelta(minutes=29)
    
    stmt_naive = select(Appointment).where(
        Appointment.appointment_date >= start_naive,
        Appointment.appointment_date <= end_naive
    )
    res_naive = db.scalars(stmt_naive).all()
    print(f"Using NAIVE datetimes ({start_naive} to {end_naive}):")
    print(f"Found {len(res_naive)} overlapping appointments.")
    for r in res_naive:
        print(f" - ID: {r.id}, Date in DB: {r.appointment_date}")
        
    # 2. Timezone-aware local approach
    aware_date = datetime(2026, 5, 28, 14, 30, tzinfo=local_tz)
    start_aware = aware_date - timedelta(minutes=29)
    end_aware = aware_date + timedelta(minutes=29)
    
    stmt_aware = select(Appointment).where(
        Appointment.appointment_date >= start_aware,
        Appointment.appointment_date <= end_aware
    )
    res_aware = db.scalars(stmt_aware).all()
    print(f"\nUsing TIMEZONE-AWARE datetimes ({start_aware} to {end_aware}):")
    print(f"Found {len(res_aware)} overlapping appointments.")
    for r in res_aware:
        print(f" - ID: {r.id}, Date in DB: {r.appointment_date}")
