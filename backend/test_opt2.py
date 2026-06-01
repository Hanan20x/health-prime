import os
from sqlalchemy.orm import Session
from app.database import engine
from app.routers.appointments import optimize_appointment_slot
from app.schemas import OptimizationRequest

req = OptimizationRequest(
  patient_id=1,
  appointment_date="2026-08-01",
  time_str="10:00",
  reason="Patient complains of severe chest pain and breathing difficulty",
  department="Chronic Diseases Clinic",
  visit_type="New Visit",
  priority_level="Routine"
)

with Session(engine) as db:
    try:
        res = optimize_appointment_slot(req, db)
        print(res)
    except Exception as e:
        import traceback
        traceback.print_exc()
