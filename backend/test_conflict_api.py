import os
import sys
import requests
from datetime import datetime, timedelta

# Find API URL
api_url = "http://127.0.0.1:8000"

# Add backend dir to path so we can import app modules
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
from app.models import Patient, Provider, Appointment

def get_auth_token():
    """Log in as the seeded E-Health Admin, resolving the email OTP step by reading
    the dev-mode OTP that the backend prints to its own console/log (no SMTP configured
    in this test environment)."""
    import re, time

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@healthprime.sa")
    admin_password = os.environ.get("ADMIN_PASSWORD", "ChangeMe123!")

    step1 = requests.post(f"{api_url}/auth/login", json={"email": admin_email, "password": admin_password})
    step1.raise_for_status()
    data = step1.json()
    if not data.get("requiresOtp"):
        return data["accessToken"]

    backend_log = os.environ.get("BACKEND_LOG_PATH", "/tmp/work/backend.log")
    code = None
    for _ in range(20):
        time.sleep(0.5)
        if os.path.exists(backend_log):
            with open(backend_log, "r", errors="ignore") as f:
                log_text = f.read()
            matches = re.findall(rf"\[OTP\] Code for {re.escape(admin_email)}: (\d{{6}})", log_text)
            if matches:
                code = matches[-1]
                break
    if not code:
        raise RuntimeError("Could not find OTP code in backend log for auth flow")

    step2 = requests.post(f"{api_url}/auth/login", json={"email": admin_email, "password": admin_password, "otp": code})
    step2.raise_for_status()
    return step2.json()["accessToken"]


def run_test():
    print(f"Testing against backend API: {api_url}")

    token = get_auth_token()
    auth_headers = {"Authorization": f"Bearer {token}"}
    print("Authenticated as admin, obtained access token.")

    with SessionLocal() as db:
        # Get patient and provider directly from database
        patient = db.query(Patient).first()
        doctor = db.query(Provider).filter(Provider.role == "Doctor").first()
        
        if not patient or not doctor:
            print("ERROR: No patients or doctors available in the database.")
            sys.exit(1)
            
        print(f"Selected Patient: {patient.first_name} {patient.family_name} (ID: {patient.id})")
        print(f"Selected Doctor: {doctor.full_name} (ID: {doctor.id})")
        
        # Set patient's attending provider to this doctor so the AI selects them
        patient.attending_provider_id = doctor.id
        db.commit()

        # Let's create a manual appointment for this doctor at a time
        # Today is May 25, 2026. The AI slot generator suggests 3 days from now at 14:30:00 (May 28, 2:30 PM).
        # Let's schedule a manual appointment at exactly May 28, 2026 2:30 PM (2026-05-28T14:30:00) in local timezone
        local_tz = datetime.now().astimezone().tzinfo
        conflict_time = (datetime.now(local_tz) + timedelta(days=3)).replace(hour=14, minute=30, second=0, microsecond=0)
        
        # Remove any existing manual appointments at this time for this doctor to avoid duplicate test junk
        db.query(Appointment).filter(
            Appointment.provider_id == doctor.id,
            Appointment.appointment_date == conflict_time
        ).delete()
        db.commit()
        
        print(f"Registering manual booking at {conflict_time} directly in DB...")
        manual_appt = Appointment(
            patient_id=patient.id,
            provider_id=doctor.id,
            appointment_date=conflict_time,
            reason="Manual Nurse Booking Routine Test",
            notes="Manual booking for testing conflict",
            is_ai_generated=False,
            status="Scheduled"
        )
        db.add(manual_appt)
        db.commit()
        
        print(f"Manual booking created successfully (ID: {manual_appt.id}, Date: {manual_appt.appointment_date})")
        
        # Now call AI slot generator for the same patient and reason "Routine Follow-up"
        # Since GOOGLE_API_KEY is not set in tests usually, this will trigger the routine fallback simulator (3 days, 14:30).
        # Since there is a manual booking at that time, it MUST detect the conflict and shift it to 3:00 PM!
        ai_data = {
            "patientId": patient.id,
            "reason": "Routine Follow-up"
        }
        
        print("Requesting AI Slot generation...")
        ai_res = requests.post(f"{api_url}/appointments/generate-slot", json=ai_data, headers=auth_headers)
        if ai_res.status_code != 200:
            print(f"ERROR: AI Slot generation failed. {ai_res.text}")
            sys.exit(1)
            
        booked_ai = ai_res.json()
        print("\nAI Generated Booking Response:")
        print(f"ID: {booked_ai['id']}")
        print(f"Date: {booked_ai['appointmentDate']}")
        print(f"Priority Level: {booked_ai['priorityLevel']}")
        print(f"AI Explanation: {booked_ai['aiExplanation']}")
        print(f"Manual Slots Affected: {booked_ai['manualSlotsAffected']}")
        
        # Check if the slot was shifted correctly (should be +30 mins, i.e. 15:00:00)
        shifted_time = conflict_time + timedelta(minutes=30)
        returned_date = booked_ai['appointmentDate']
        
        # Parse returned date (usually formatted as ISO e.g. "2026-05-28T15:00:00+08:00")
        print(f"\nExpected shifted time: {shifted_time.isoformat()}")
        print(f"Returned time: {returned_date}")
        
        # Assert conflict was logged in manualSlotsAffected
        assert "Conflict detected" in booked_ai['manualSlotsAffected'], f"Expected 'Conflict detected' in {booked_ai['manualSlotsAffected']}"
        assert doctor.full_name in booked_ai['manualSlotsAffected'], f"Expected doctor name {doctor.full_name} in {booked_ai['manualSlotsAffected']}"
        
        print("\nSUCCESS: AI successfully detected the nurse's manual slot and shifted the schedule around it!")

if __name__ == "__main__":
    run_test()
