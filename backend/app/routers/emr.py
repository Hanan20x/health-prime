from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import CurrentUser
from app.models import ClinicalOrder, EmrSection, EmrSectionHistory, Patient, Provider, VitalSign, PatientDiagnosis
from app.schemas import ClinicalOrderOut, EmrPageOut, EmrPatientBanner, EmrSectionOut, EmrVitalsSnapshot, VitalsHistoryRow, EmrSectionUpdate, DiagnosisOut
from app.util import calc_age, patient_full_name

router = APIRouter(tags=["emr"])

@router.get("/patients/{patient_id}/emr", response_model=EmrPageOut)
def get_emr(patient_id: int, _user: CurrentUser, db: Annotated[Session, Depends(get_db)]):
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    last = db.query(VitalSign).filter(VitalSign.patient_id == patient_id).order_by(VitalSign.recorded_at.desc()).first()
    
    allergies: list[str] = []
    if p.allergies:
        allergies = [a.strip() for a in p.allergies.replace(";", ",").split(",") if a.strip()]
        
    doctor_name = None
    if p.attending_provider_id:
        prov = db.query(Provider).filter(Provider.id == p.attending_provider_id).first()
        if prov:
            doctor_name = prov.full_name
            
    visit_time = None
    if last:
        visit_time = last.recorded_at.strftime("%I:%M %p — %b %d, %Y")
        
    vit_snap = EmrVitalsSnapshot(
        temp=f"{last.temperature_c}°C" if last and last.temperature_c is not None else "—",
        hr=f"{last.heart_rate} bpm" if last and last.heart_rate is not None else "—",
        bp=(f"{last.systolic_bp}/{last.diastolic_bp}" if last and last.systolic_bp and last.diastolic_bp else "—"),
        spo2=f"{last.spo2}%" if last and last.spo2 is not None else "—",
        rr=f"{last.respiratory_rate}/min" if last and last.respiratory_rate is not None else "—",
    )
    
    banner = EmrPatientBanner(
        name=patient_full_name(p),
        national_id=p.national_id,
        gender=p.gender,
        dob=p.dob.isoformat(),
        age=calc_age(p.dob),
        doctor=doctor_name,
        facility=p.facility_name or "Alraith Primary Healthcare Center",
        visit_time=visit_time,
        allergies=allergies,
        avatar_url=None,
        vitals=vit_snap,
    )
    
    # Safe storage hack: look for a special EMR record containing the image
    img_record = db.query(EmrSection).filter(EmrSection.patient_id == patient_id, EmrSection.section_key == "PATIENT_IMAGE").first()
    if img_record:
        banner.avatar_url = img_record.content

    sections_db = db.query(EmrSection).filter(EmrSection.patient_id == patient_id, EmrSection.section_key != "PATIENT_IMAGE").order_by(EmrSection.id.desc()).all()
    section_out = [
        EmrSectionOut(
            id=s.id,
            key=s.section_key,
            title=s.title,
            content=s.content,
            date=s.created_at.strftime("%I:%M %p — %b %d, %Y") if hasattr(s, "created_at") and s.created_at else "Recent Log"
        )
        for s in sections_db
    ]
    
    orders_db = db.query(ClinicalOrder).filter(ClinicalOrder.patient_id == patient_id).order_by(ClinicalOrder.id).all()
    order_out = [
        ClinicalOrderOut(
            id=o.id,
            type=o.order_type,
            description=o.description,
            status=o.status,
            date=o.order_date.strftime("%b %d, %Y"),
        )
        for o in orders_db
    ]
    
    vrows = db.query(VitalSign).filter(VitalSign.patient_id == patient_id).order_by(VitalSign.recorded_at.desc()).limit(20).all()
    hist: list[VitalsHistoryRow] = []
    for v in vrows:
        prov_name = "—"
        if v.provider_id:
            pr = db.query(Provider).filter(Provider.id == v.provider_id).first()
            if pr: prov_name = pr.full_name
        bp = "—"
        if v.systolic_bp and v.diastolic_bp:
            bp = f"{v.systolic_bp}/{v.diastolic_bp}"
        hist.append(
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
    
    # Diagnoses
    diagnoses_records = db.query(PatientDiagnosis).filter(PatientDiagnosis.patient_id == patient_id).order_by(PatientDiagnosis.id.desc()).all()
    diagnoses_out = [
        DiagnosisOut(
            id=d.id,
            patient_id=d.patient_id,
            icd_code=d.icd_code,
            icd_title=d.icd_title,
            notes=d.notes,
            is_ai_generated=d.is_ai_generated,
            status=d.status,
            diagnosed_at=d.diagnosed_at
        ) for d in diagnoses_records
    ]
    
    return EmrPageOut(patient=banner, sections=section_out, orders=order_out, vitals_history=hist, diagnoses=diagnoses_out)

@router.post("/patients/{patient_id}/emr/{section_key:path}", response_model=EmrSectionOut)
def add_emr_entry(
    patient_id: int,
    section_key: str,
    update: EmrSectionUpdate,
    _user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    title_map = {
        "Chief Complaints": "Chief Complaints",
        "Present Illness": "Present Illness",
        "Past Medical/Surgical History": "Past Medical/Surgical History",
        "Gynecological and Obstetrical History": "Gynecological and Obstetrical History",
        "Family History": "Family History",
        "Surgical / Medical Procedure": "Surgical / Medical Procedure",
        "Medication History": "Medication History",
        "Personal/Social History": "Personal/Social History",
        "Developmental History": "Developmental History",
        "Physical Examination": "Physical Examination",
        "OB History": "OB History",
        "Doctor Notes": "Doctor Notes",
        "Doctor Recommendation and Advice": "Doctor Recommendation and Advice",
        "Plan of Care": "Plan of Care"
    }
    
    if section_key == "PATIENT_IMAGE":
        section = db.query(EmrSection).filter(EmrSection.patient_id == patient_id, EmrSection.section_key == "PATIENT_IMAGE").first()
        if section:
            # Save history before overwriting
            if section.content:
                db.add(EmrSectionHistory(
                    emr_section_id=section.id,
                    patient_id=patient_id,
                    section_key=section.section_key,
                    old_content=section.content,
                    edited_by=_user.full_name
                ))
            section.content = update.content
            db.commit()
            db.refresh(section)
            return EmrSectionOut(id=section.id, key=section.section_key, title=section.title, content="[IMAGE_DATA]", date="Recent")

    section = EmrSection(
        patient_id=patient_id,
        section_key=section_key,
        title=title_map.get(section_key, section_key),
        content=update.content,
    )
    db.add(section)
    db.commit()
    db.refresh(section)
    return EmrSectionOut(
        id=section.id,
        key=section.section_key,
        title=section.title,
        content=section.content,
        date=section.created_at.strftime("%I:%M %p — %b %d, %Y") if hasattr(section, "created_at") and section.created_at else "Entry Logged"
    )

@router.delete("/emr/records/{record_id}")
def delete_emr_record(
    record_id: int,
    _user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    section = db.query(EmrSection).filter(EmrSection.id == record_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Record not found")
    
    db.delete(section)
    db.commit()
    return {"detail": "Record deleted"}


@router.delete("/patients/{patient_id}/photo")
def delete_patient_photo(
    patient_id: int,
    _user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    db.query(EmrSection).filter(
        EmrSection.patient_id == patient_id, 
        EmrSection.section_key == "PATIENT_IMAGE"
    ).delete()
    db.commit()
    return {"detail": "Photo removed"}
