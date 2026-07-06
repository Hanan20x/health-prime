from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import CurrentUser
from app.models import ActivityLog, Patient, Provider, VitalSign
from app.schemas import (
    ChartPoint,
    PatientVitalsContext,
    VitalCreate,
    VitalOut,
    VitalsChartBundle,
    VitalsHistoryRow,
)
from app.util import calc_age, patient_full_name

router = APIRouter(tags=["vitals"])


def _log_activity(db: Session, action: str, patient_name: str, provider_name: str) -> None:
    db.add(ActivityLog(action=action, patient_name=patient_name, provider_name=provider_name))


@router.post("/vitals", response_model=VitalOut, status_code=status.HTTP_201_CREATED)
def create_vital(body: VitalCreate, user: CurrentUser, db: Annotated[Session, Depends(get_db)]):
    p = db.query(Patient).filter(Patient.id == body.patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    v = VitalSign(
        patient_id=body.patient_id,
        provider_id=user.id,
        temperature_c=body.temperature_c,
        heart_rate=body.heart_rate,
        systolic_bp=body.systolic_bp,
        diastolic_bp=body.diastolic_bp,
        respiratory_rate=body.respiratory_rate,
        spo2=body.spo2,
        weight_kg=body.weight_kg,
        height_cm=body.height_cm,
        bmi=body.bmi,
        bsa=body.bsa,
        map_bp=body.map_bp,
        smoking_status=body.smoking_status,
        disability=body.disability,
        physical_activity=body.physical_activity,
        notes=body.notes,
    )
    db.add(v)
    db.commit()
    db.refresh(v)
    _log_activity(db, "Vital signs recorded", patient_full_name(p), user.full_name)
    db.commit()
    return v


@router.get("/vitals", response_model=list[VitalOut])
def list_vitals(
    _user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    patient_id: int = Query(..., alias="patientId"),
):
    rows = (
        db.query(VitalSign)
        .filter(VitalSign.patient_id == patient_id)
        .order_by(VitalSign.recorded_at.desc())
        .all()
    )
    return rows


@router.get("/patients/{patient_id}/vitals-context", response_model=PatientVitalsContext)
def vitals_context(patient_id: int, _user: CurrentUser, db: Annotated[Session, Depends(get_db)]):
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    last = (
        db.query(VitalSign)
        .filter(VitalSign.patient_id == patient_id)
        .order_by(VitalSign.recorded_at.desc())
        .first()
    )
    allergies: list[str] = []
    if p.allergies:
        allergies = [a.strip() for a in p.allergies.replace(";", ",").split(",") if a.strip()]
    doctor_name = None
    if p.attending_provider_id:
        prov = db.query(Provider).filter(Provider.id == p.attending_provider_id).first()
        if prov:
            doctor_name = prov.full_name
    bp_display = None
    bmi = None
    if last and last.systolic_bp and last.diastolic_bp:
        bp_display = f"{last.systolic_bp}/{last.diastolic_bp}"
    if last and last.weight_kg:
        # rough placeholder BMI without height
        bmi = f"{last.weight_kg:.1f} kg recorded"
    visit_time = None
    if last:
        visit_time = last.recorded_at.astimezone(timezone.utc).strftime("%I:%M %p — %b %d, %Y")
    return PatientVitalsContext(
        patient_id=p.id,
        full_name=patient_full_name(p),
        national_id=p.national_id,
        gender=p.gender,
        age=calc_age(p.dob),
        allergies_list=allergies,
        doctor_name=doctor_name,
        facility=p.facility_name,
        visit_time=visit_time,
        bmi=bmi,
        bp_display=bp_display,
        last_vitals=last,
    )


@router.get("/patients/{patient_id}/vitals/charts", response_model=VitalsChartBundle)
def vitals_charts(patient_id: int, _user: CurrentUser, db: Annotated[Session, Depends(get_db)]):
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    rows = (
        db.query(VitalSign)
        .filter(VitalSign.patient_id == patient_id)
        .order_by(VitalSign.recorded_at.asc())
        .limit(200)
        .all()
    )
    temp_pts, hr_pts, rr_pts, bp_pts = [], [], [], []
    for v in rows:
        label = v.recorded_at.strftime("%b %d, %H:%M")
        if v.temperature_c is not None:
            temp_pts.append(ChartPoint(date=label, value=float(v.temperature_c)))
        if v.heart_rate is not None:
            hr_pts.append(ChartPoint(date=label, value=float(v.heart_rate)))
        if v.respiratory_rate is not None:
            rr_pts.append(ChartPoint(date=label, value=float(v.respiratory_rate)))
        if v.systolic_bp is not None and v.diastolic_bp is not None:
            bp_pts.append(
                ChartPoint(date=label, systolic=v.systolic_bp, diastolic=v.diastolic_bp)
            )
    return VitalsChartBundle(
        temperature=temp_pts, 
        heart_rate=hr_pts, 
        respiratory_rate=rr_pts, 
        blood_pressure=bp_pts
    )


@router.get("/patients/{patient_id}/vitals/history", response_model=list[VitalsHistoryRow])
def vitals_history(patient_id: int, _user: CurrentUser, db: Annotated[Session, Depends(get_db)]):
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    rows = (
        db.query(VitalSign)
        .filter(VitalSign.patient_id == patient_id)
        .order_by(VitalSign.recorded_at.desc())
        .limit(100)
        .all()
    )
    out: list[VitalsHistoryRow] = []
    for v in rows:
        prov_name = "—"
        if v.provider_id:
            pr = db.query(Provider).filter(Provider.id == v.provider_id).first()
            if pr:
                prov_name = pr.full_name
        bp = "—"
        if v.systolic_bp and v.diastolic_bp:
            bp = f"{v.systolic_bp}/{v.diastolic_bp}"
        out.append(
            VitalsHistoryRow(
                date=v.recorded_at.strftime("%b %d, %Y"),
                time=v.recorded_at.strftime("%H:%M"),
                temp=f"{v.temperature_c}°C" if v.temperature_c is not None else "—",
                bp=bp,
                hr=str(v.heart_rate) if v.heart_rate is not None else "—",
                rr=str(v.respiratory_rate) if v.respiratory_rate is not None else "—",
                spo2=f"{v.spo2}%" if v.spo2 is not None else "—",
                weight=f"{v.weight_kg} kg" if v.weight_kg is not None else "—",
                height=f"{v.height_cm} cm" if v.height_cm is not None else "—",
                bmi=f"{v.bmi}" if v.bmi is not None else "—",
                recorded_by=prov_name,
            )
        )
    return out
