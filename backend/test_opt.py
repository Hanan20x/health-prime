import requests

payload = {
  "patient_id": 1,
  "appointment_date": "2026-08-01",
  "time_str": "10:00",
  "reason": "Patient complains of severe chest pain and breathing difficulty",
  "department": "Chronic Diseases Clinic",
  "visit_type": "New Visit",
  "priority_level": "Routine"
}

try:
    r = requests.post("http://127.0.0.1:8000/appointments/optimize", json=payload)
    print(r.status_code)
    print(r.json())
except Exception as e:
    print(e)
