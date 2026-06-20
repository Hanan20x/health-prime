from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import CurrentUser
from app.models import ActivityLog, Patient, PatientDiagnosis, Appointment
from app.schemas import PatientCreate, PatientDetail, PatientListItem, DiagnosisCreate, DiagnosisOut
from app.util import patient_full_name

router = APIRouter(prefix="/patients", tags=["patients"])


def _log_activity(db: Session, action: str, patient_name: str, provider_name: str) -> None:
    db.add(ActivityLog(action=action, patient_name=patient_name, provider_name=provider_name))


@router.get("", response_model=list[PatientListItem])
def list_patients(
    _user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    q: str | None = Query(None, description="Search name, national id, phone"),
):
    query = db.query(Patient)
    if q:
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Patient.national_id.ilike(term),
                Patient.phone.ilike(term),
                Patient.first_name.ilike(term),
                Patient.family_name.ilike(term),
                Patient.second_name.ilike(term),
                Patient.third_name.ilike(term),
            )
        )
    rows = query.order_by(Patient.id.desc()).all()
    return [
        PatientListItem(
            id=p.id,
            national_id=p.national_id,
            name=patient_full_name(p),
            gender=p.gender,
            dob=p.dob,
            phone=p.phone,
            status=p.status,
        )
        for p in rows
    ]


@router.post("", response_model=PatientDetail, status_code=status.HTTP_201_CREATED)
def create_patient(body: PatientCreate, user: CurrentUser, db: Annotated[Session, Depends(get_db)]):
    if user.role not in ("E-Health Admin", "Doctor"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorised")
    exists = db.query(Patient).filter(Patient.national_id == body.national_id.strip()).first()
    if exists:
        raise HTTPException(status_code=400, detail="National ID already registered")
    p = Patient(
        first_name=body.first_name.strip(),
        second_name=body.second_name.strip() if body.second_name else None,
        third_name=body.third_name.strip() if body.third_name else None,
        family_name=body.family_name.strip(),
        national_id=body.national_id.strip(),
        gender=body.gender,
        dob=body.dob,
        phone=body.phone.strip(),
        email=body.email.strip() if body.email else None,
        blood_group=body.blood_group,
        nationality=body.nationality,
        status=body.status,
        building_no=body.building_no,
        area=body.area,
        city=body.city,
        state=body.state,
        country=body.country,
        postcode=body.postcode,
        alias_names=body.alias_names,
        employer=body.employer,
        disability=body.disability,
        allergies=body.allergies,
        chronic_conditions=body.chronic_conditions,
        emergency_contact_name=body.emergency_contact_name,
        emergency_contact_phone=body.emergency_contact_phone,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    _log_activity(
        db,
        "New patient registered",
        patient_full_name(p),
        user.full_name,
    )
    db.commit()
    return p


@router.get("/{patient_id}", response_model=PatientDetail)
def get_patient(patient_id: int, _user: CurrentUser, db: Annotated[Session, Depends(get_db)]):
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    return p


@router.put("/{patient_id}", response_model=PatientDetail)
def update_patient(
    patient_id: int,
    body: PatientCreate,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    if user.role not in ("E-Health Admin", "Doctor"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorised")
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    # Check national ID uniqueness (exclude self)
    existing = (
        db.query(Patient)
        .filter(Patient.national_id == body.national_id.strip(), Patient.id != patient_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="National ID already registered to another patient")
    p.first_name = body.first_name.strip()
    p.second_name = body.second_name.strip() if body.second_name else None
    p.third_name = body.third_name.strip() if body.third_name else None
    p.family_name = body.family_name.strip()
    p.national_id = body.national_id.strip()
    p.gender = body.gender
    p.dob = body.dob
    p.phone = body.phone.strip()
    p.email = body.email.strip() if body.email else None
    p.blood_group = body.blood_group
    p.nationality = body.nationality
    p.status = body.status
    p.building_no = body.building_no
    p.area = body.area
    p.city = body.city
    p.state = body.state
    p.country = body.country
    p.postcode = body.postcode
    p.alias_names = body.alias_names
    p.employer = body.employer
    p.disability = body.disability
    p.allergies = body.allergies
    p.chronic_conditions = body.chronic_conditions
    p.emergency_contact_name = body.emergency_contact_name
    p.emergency_contact_phone = body.emergency_contact_phone
    db.commit()
    db.refresh(p)
    _log_activity(db, "Patient record updated", patient_full_name(p), user.full_name)
    db.commit()
    return p


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(
    patient_id: int,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    if user.role != "E-Health Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can delete patients")
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    _log_activity(db, "Patient record deleted", patient_full_name(p), user.full_name)
    db.delete(p)
    db.commit()

@router.post("/{patient_id}/diagnoses", response_model=DiagnosisOut)
def create_diagnosis(patient_id: int, body: DiagnosisCreate, user: CurrentUser, db: Annotated[Session, Depends(get_db)]):
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    active_appt = db.query(Appointment).filter(
        Appointment.patient_id == patient_id,
        func.date(Appointment.appointment_time) == date.today(),
        Appointment.status.in_(["Scheduled", "Waiting"])
    ).first()
    
    if not active_appt:
        raise HTTPException(status_code=400, detail="Patient must have an active appointment today (Scheduled or Waiting) to receive a diagnosis.")

    d = PatientDiagnosis(
        patient_id=patient_id,
        icd_code=body.icd_code,
        icd_title=body.icd_title,
        notes=body.notes,
        is_ai_generated=body.is_ai_generated,
        status=body.status
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    action_text = "AI Diagnosis generated" if body.is_ai_generated else "Diagnosis added"
    _log_activity(db, action_text, patient_full_name(p), f"{body.icd_code} · {active_appt.status}")
    db.commit()
    
    # Also update appointment status to Completed
    active_appt.status = "Completed"
    db.commit()
    
    return d
