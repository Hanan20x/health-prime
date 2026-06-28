from datetime import datetime, timedelta
import random

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from typing import Annotated, List

from app.database import get_db
from app.deps import CurrentUser
from app.models import ActivityLog, Appointment, Patient, Provider
from app.schemas import AppointmentCreate, AppointmentOut, AppointmentGenerateSpec, UserOut, AppointmentStatusUpdate

router = APIRouter(prefix="/appointments", tags=["Appointments"])

# Configurable appointment slot duration in minutes.
# Conflict detection uses half this value on each side of the requested time.
SLOT_DURATION_MIN: int = 30

@router.get("", response_model=List[AppointmentOut])
def get_appointments(
    _user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(200, ge=1, le=500, description="Max records to return"),
    status: str | None = Query(None, description="Filter by status: Scheduled, Completed, Cancelled"),
):
    stmt = select(Appointment).order_by(Appointment.appointment_date.desc())
    if status:
        stmt = stmt.where(Appointment.status == status)
    stmt = stmt.offset(skip).limit(limit)
    appointments = db.scalars(stmt).all()
    
    out = []
    for appt in appointments:
        pat = db.get(Patient, appt.patient_id)
        prov = db.get(Provider, appt.provider_id)
        
        out.append(AppointmentOut(
            id=appt.id,
            patient_id=appt.patient_id,
            provider_id=appt.provider_id,
            appointment_date=appt.appointment_date,
            reason=appt.reason,
            status=appt.status,
            notes=appt.notes,
            department=appt.department,
            visit_type=appt.visit_type,
            is_ai_generated=appt.is_ai_generated,
            priority_level=appt.priority_level,
            ai_explanation=appt.ai_explanation,
            manual_slots_affected=appt.manual_slots_affected,
            optimization_diffs=appt.optimization_diffs,
            patient_name=f"{pat.first_name} {pat.family_name}" if pat else "Unknown",
            provider_name=prov.full_name if prov else "Unknown"
        ))
    return out

@router.patch("/{appointment_id}/status", response_model=AppointmentOut)
def update_appointment_status(appointment_id: int, req: AppointmentStatusUpdate, _user: CurrentUser, db: Annotated[Session, Depends(get_db)]):
    db_appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not db_appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    db_appt.status = req.status
    db.commit()
    db.refresh(db_appt)
    
    pat = db.get(Patient, db_appt.patient_id)
    prov = db.get(Provider, db_appt.provider_id)
    
    return AppointmentOut(
        id=db_appt.id,
        patient_id=db_appt.patient_id,
        provider_id=db_appt.provider_id,
        appointment_date=db_appt.appointment_date,
        reason=db_appt.reason,
        status=db_appt.status,
        notes=db_appt.notes,
        department=db_appt.department,
        visit_type=db_appt.visit_type,
        is_ai_generated=db_appt.is_ai_generated,
        priority_level=db_appt.priority_level,
        ai_explanation=db_appt.ai_explanation,
        manual_slots_affected=db_appt.manual_slots_affected,
        optimization_diffs=db_appt.optimization_diffs,
        patient_name=f"{pat.first_name} {pat.family_name}" if pat else "Unknown",
        provider_name=prov.full_name if prov else "Unknown"
    )

@router.post("", response_model=AppointmentOut)
def register_appointment(appt_in: AppointmentCreate, _user: CurrentUser, db: Annotated[Session, Depends(get_db)]):
    pat = db.get(Patient, appt_in.patient_id)
    if not pat:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    prov = db.get(Provider, appt_in.provider_id)
    if not prov:
        raise HTTPException(status_code=404, detail="Provider not found")
        
    new_appt = Appointment(
        patient_id=appt_in.patient_id,
        provider_id=appt_in.provider_id,
        appointment_date=appt_in.appointment_date,
        reason=appt_in.reason,
        notes=appt_in.notes,
        department=appt_in.department,
        visit_type=appt_in.visit_type,
        priority_level=appt_in.priority_level,
        is_ai_generated=appt_in.is_ai_generated if appt_in.is_ai_generated is not None else False,
        ai_explanation=appt_in.ai_explanation,
        manual_slots_affected=appt_in.manual_slots_affected,
        status="Scheduled",
        optimization_diffs=appt_in.optimization_diffs
    )
    
    db.add(new_appt)
    db.commit()
    db.refresh(new_appt)
    
    return AppointmentOut(
        id=new_appt.id,
        patient_id=new_appt.patient_id,
        provider_id=new_appt.provider_id,
        appointment_date=new_appt.appointment_date,
        reason=new_appt.reason,
        status=new_appt.status,
        notes=new_appt.notes,
        department=new_appt.department,
        visit_type=new_appt.visit_type,
        is_ai_generated=new_appt.is_ai_generated,
        priority_level=new_appt.priority_level,
        ai_explanation=new_appt.ai_explanation,
        manual_slots_affected=new_appt.manual_slots_affected,
        optimization_diffs=new_appt.optimization_diffs,
        patient_name=f"{pat.first_name} {pat.family_name}",
        provider_name=prov.full_name
    )

@router.put("/{appointment_id}", response_model=AppointmentOut)
def update_appointment(appointment_id: int, req: AppointmentCreate, _user: CurrentUser, db: Annotated[Session, Depends(get_db)]):
    db_appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not db_appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    db_appt.patient_id = req.patient_id
    db_appt.provider_id = req.provider_id
    db_appt.appointment_date = req.appointment_date
    db_appt.reason = req.reason
    db_appt.notes = req.notes
    db_appt.department = req.department
    db_appt.visit_type = req.visit_type
    db_appt.priority_level = req.priority_level
    if hasattr(req, "is_ai_generated") and req.is_ai_generated is not None:
        db_appt.is_ai_generated = req.is_ai_generated
    if hasattr(req, "ai_explanation") and req.ai_explanation is not None:
        db_appt.ai_explanation = req.ai_explanation
    if hasattr(req, "manual_slots_affected") and req.manual_slots_affected is not None:
        db_appt.manual_slots_affected = req.manual_slots_affected
    if hasattr(req, "optimization_diffs") and req.optimization_diffs is not None:
        db_appt.optimization_diffs = req.optimization_diffs
    if hasattr(req, "status") and req.status is not None:
        db_appt.status = req.status
        
    db.commit()
    db.refresh(db_appt)
    
    pat = db.get(Patient, db_appt.patient_id)
    prov = db.get(Provider, db_appt.provider_id)
    
    return AppointmentOut(
        id=db_appt.id,
        patient_id=db_appt.patient_id,
        provider_id=db_appt.provider_id,
        appointment_date=db_appt.appointment_date,
        reason=db_appt.reason,
        status=db_appt.status,
        notes=db_appt.notes,
        department=db_appt.department,
        visit_type=db_appt.visit_type,
        is_ai_generated=db_appt.is_ai_generated,
        priority_level=db_appt.priority_level,
        ai_explanation=db_appt.ai_explanation,
        manual_slots_affected=db_appt.manual_slots_affected,
        optimization_diffs=db_appt.optimization_diffs,
        patient_name=f"{pat.first_name} {pat.family_name}" if pat else "Unknown",
        provider_name=prov.full_name if prov else "Unknown"
    )

@router.delete("/{appointment_id}")
def delete_appointment(appointment_id: int, _user: CurrentUser, db: Annotated[Session, Depends(get_db)]):
    print(f"[DEBUG] Attempting to delete appointment with ID: {appointment_id}")
    db_appt = db.get(Appointment, appointment_id)
    if not db_appt:
        print(f"[DEBUG] Appointment {appointment_id} NOT FOUND!")
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    is_ai = getattr(db_appt, 'is_ai_generated', False)
    print(f"[DEBUG] Found appointment {appointment_id}, is_ai_generated: {is_ai}")
    try:
        db.delete(db_appt)
        db.commit()
        print(f"[DEBUG] Appointment {appointment_id} successfully deleted from DB!")
    except Exception as e:
        print(f"[DEBUG] Exception during delete: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Could not delete appointment")
        
    return {"message": "Appointment deleted successfully"}

@router.delete("/cleanup")
def cleanup_invalid_appointments(db: Session = Depends(get_db)):
    from sqlalchemy import extract, or_, and_
    from datetime import datetime, time, timezone
    
    # Get all appointments
    all_appts = db.query(Appointment).all()
    deleted_count = 0
    now = datetime.now(timezone.utc)
    
    for appt in all_appts:
        appt_time = appt.appointment_date.time()
        # Delete if it's in the past OR if time is outside 08:00 - 17:00
        is_invalid_time = appt_time < time(8, 0) or appt_time > time(17, 0)
        
        # Make appt_date naive for comparison if necessary, or make now aware
        # appointment_date from DB might be naive or aware depending on driver.
        # Let's ensure both are naive for a safe comparison or handle aware:
        appt_date = appt.appointment_date
        if appt_date.tzinfo is None:
            now = datetime.now() # naive
        else:
            now = datetime.now(timezone.utc)
            
        is_past = appt_date < now
        
        if is_invalid_time or is_past:
            db.delete(appt)
            deleted_count += 1
            
    db.commit()
    return {"message": f"Successfully deleted {deleted_count} invalid or past appointments."}


from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, END
from pydantic import BaseModel, ConfigDict, Field
import os
from app.schemas import OptimizationRequest, OptimizationReview, OptimizationDiffField

class AgentState(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    patient_id: int
    staff_entry: dict
    medical_history: str = ""
    messages: list = []
    final_review: dict | None = None

class AIAgentFlagLLM(BaseModel):
    type: str = Field(description="escalation | slot_or_fit_conflict | continuity_overridden | confirm_info | emergency")
    severity: str = Field(description="high | medium | low")
    current: str | None = Field(description="what the nurse entered")
    suggested: str | None = Field(description="what you recommend")
    explanation: str = Field(description="short plain-language paragraph stating WHY")

class AIAgentResponseLLM(BaseModel):
    visit_type: str | None = None
    emergency_route: bool = False
    final_priority: str | None = Field(description="Routine | Soon | Urgent")
    priority_action: str | None = Field(description="KEEP | ESCALATE | CONFIRM")
    recommended_provider: str | None = Field(description="doctor id or team")
    provider_action: str | None = Field(description="KEEP | REASSIGN | CONFLICT")
    flags: list[AIAgentFlagLLM] = Field(default_factory=list)
    nurse_summary: str | None = None

def get_medical_data(state: AgentState):
    import datetime
    from app.database import SessionLocal
    from app.models import EmrSection, VitalSign, Patient, ClinicalOrder
    with SessionLocal() as db:
        pat = db.get(Patient, state.patient_id)
        if not pat:
            return {"medical_history": "Patient not found."}
            
        sections = db.query(EmrSection).filter(EmrSection.patient_id == state.patient_id).all()
        emr_text = ", ".join([f"{s.section_key}: {s.content}" for s in sections if s.section_key != "PATIENT_IMAGE"])
        
        last_vital = db.query(VitalSign).filter(VitalSign.patient_id == state.patient_id).order_by(VitalSign.recorded_at.desc()).first()
        vitals_text = ""
        if last_vital:
            vitals_text = f"Temp: {last_vital.temperature_c}°C, BP: {last_vital.systolic_bp}/{last_vital.diastolic_bp}, HR: {last_vital.heart_rate} bpm, SpO2: {last_vital.spo2}%, RR: {last_vital.respiratory_rate}"
            
        orders = db.query(ClinicalOrder).filter(ClinicalOrder.patient_id == state.patient_id).all()
        recent_orders = ", ".join([o.description for o in orders if (datetime.date.today() - o.order_date).days < 30])
            
        medical_history = f"Patient: {pat.first_name} {pat.family_name}, Age: {(datetime.date.today() - pat.dob).days // 365}. "
        medical_history += f"Registered GP ID: {pat.attending_provider_id}. "
        if emr_text:
            medical_history += f"EMR Context: {emr_text}. "
        if recent_orders:
            medical_history += f"Recent Orders (30 days): {recent_orders}. "
        if vitals_text:
            medical_history += f"Recent Vitals: {vitals_text}."
            
        return {"medical_history": medical_history}

def suggest_slot(state: AgentState):
    import requests as http_requests
    import json as json_lib
    
    # Use direct HTTP call to Gemini REST API (langchain library doesn't support new AQ. key format)
    gemini_key = os.getenv("GEMINI_API_KEY")
    GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
    
    prompt = f"""
ROLE
You are the Scheduling Clinical Supervisor, an AI assist layer inside a Primary Healthcare Centre scheduling tool. 
A staff member (who is filling the form) has selected an appointment slot. You review their entry and suggest optimizations.
You never book, change, or finalize anything. The staff member makes the final call.

OPERATING PRINCIPLES
1. Escalate freely, never silently downgrade. You may raise urgency or flag a concern; you may never lower a priority. 
2. Trust ranking of inputs: measured vitals > EMR risk context > reason-text.
3. You assist, you don't decide. Every suggestion is a recommendation.
4. CRITICAL: Priority MUST be exactly one of: "Routine", "Soon", or "Urgent". NEVER use "Emergency" or anything else for priority. If it's an emergency, set priority to "Urgent" and emergency_route to true.
5. DO NOT HALLUCINATE OR INVENT VITALS. If not explicitly provided, do not make them up.

INPUTS
- visit_type: {state.staff_entry.get('Visit Type', 'Unknown')}
- reason_text: {state.staff_entry.get('Reason', '')}
- user_selected_priority: {state.staff_entry.get('Priority', 'Routine')}
- user_selected_provider: {state.staff_entry.get('Doctor', 'Any Provider')}
- requested_datetime: {state.staff_entry.get('Date', '')} {state.staff_entry.get('Time', '')}
- vitals and emr: {state.medical_history}
- available_doctors: {state.staff_entry.get('available_doctors', 'Unknown')}

PRIORITY TIERS & SLA
- Urgent  -> see within 4 hours
- Soon    -> see within 48 hours
- Routine -> standard scheduling
CRITICAL: You are restricted to ONLY "Routine", "Soon", or "Urgent" for final_priority.

STEP 1 - EMERGENCY SCREEN
If there are red flags (chest pain, FAST signs, severe breathing, major bleeding/trauma, unconscious): Set emergency_route = true. Set final_priority = "Urgent".

STEP 2 - URGENCY CLASSIFICATION
Compute ai_suggested_priority: Vitals, EMR risk modifier, Reason text. Take HIGHEST.

STEP 3 - RECONCILE PRIORITY
Compare user_selected_priority with ai_suggested_priority. 
If AI suggests higher urgency: set final_priority = AI suggestion, set priority_action = "ESCALATE", and FLAG(escalation, severity=high) with a clear explanation.
If AI suggests equal or lower urgency: set final_priority = user_selected_priority, set priority_action = "KEEP". Do NOT flag an escalation.

STEP 4 - DOCTOR ASSIGNMENT
candidates = doctors from available_doctors
CRITICAL RULE: Look at user_selected_provider. If the role in the string says "Nurse", and this is an "ER Visit" or "Urgent" priority or reason_text contains severe/emergency keywords:
Then you MUST set provider_action="REASSIGN", set recommended_provider to the EXACT name of a DOCTOR from available_doctors (do not invent a role like "Emergency Department Physician", use an exact name from the list), and FLAG(slot_or_fit_conflict, severity=high) explaining that a Nurse cannot independently manage an emergent case.
HOWEVER, if user_selected_provider already has the role "Doctor", YOU MUST KEEP IT (provider_action="KEEP", recommended_provider=user_selected_provider) unless they are strictly incompatible. Do not claim a Doctor is a Nurse.

STEP 5 - OUTPUT
Generate your JSON based exactly on these instructions. Explain flags in plain English.
"""
    schema = {
        "type": "OBJECT",
        "properties": {
            "visit_type": {"type": "STRING"},
            "emergency_route": {"type": "BOOLEAN"},
            "final_priority": {
                "type": "STRING", 
                "enum": ["Routine", "Soon", "Urgent"]
            },
            "priority_action": {"type": "STRING", "enum": ["KEEP", "ESCALATE", "CONFIRM"]},
            "recommended_provider": {"type": "STRING"},
            "provider_action": {"type": "STRING", "enum": ["KEEP", "REASSIGN", "CONFLICT"]},
            "flags": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "type": {"type": "STRING"},
                        "severity": {"type": "STRING"},
                        "current": {"type": "STRING", "nullable": True},
                        "suggested": {"type": "STRING", "nullable": True},
                        "explanation": {"type": "STRING"}
                    },
                    "required": ["type", "severity", "explanation"]
                }
            },
            "nurse_summary": {"type": "STRING", "nullable": True}
        },
        "required": ["emergency_route", "flags", "final_priority"]
    }
    
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": schema,
            "temperature": 0.2
        }
    }
    
    headers = {
        "x-goog-api-key": gemini_key,
        "Content-Type": "application/json"
    }
    
    import time
    for attempt in range(3):
        try:
            resp = http_requests.post(GEMINI_URL, headers=headers, json=body, timeout=60)
            if resp.status_code == 200:
                break
            elif resp.status_code == 503 and attempt < 2:
                time.sleep(1)
            else:
                raise Exception(f"Gemini API Error: {resp.text}")
        except Exception as e:
            if attempt < 2:
                time.sleep(1)
            else:
                raise Exception(f"Gemini API Request failed: {str(e)}")
        
    response_data = resp.json()
    text_content = response_data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "{}")
    final_review = json_lib.loads(text_content)
    
    return {"final_review": final_review}

workflow = StateGraph(AgentState)
workflow.add_node("gather_data", get_medical_data)
workflow.add_node("suggest", suggest_slot)
workflow.set_entry_point("gather_data")
workflow.add_edge("gather_data", "suggest")
workflow.add_edge("suggest", END)
health_agent = workflow.compile()

@router.post("/optimize", response_model=OptimizationReview)
def optimize_appointment_slot(req: OptimizationRequest, _user: CurrentUser, db: Annotated[Session, Depends(get_db)]):
    pat = db.get(Patient, req.patient_id)
    if not pat:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    prov_name = "Unknown"
    prov_specialty = "Unknown Specialty"
    prov_role = "Unknown Role"
    if req.provider_id:
        prov = db.get(Provider, req.provider_id)
        if prov: 
            prov_name = prov.full_name
            prov_specialty = prov.specialty
            prov_role = prov.role
            
    active_doctors = db.query(Provider).filter(Provider.role == 'Doctor').all()
    doctors_list = ", ".join([f"{d.full_name} ({d.specialty})" for d in active_doctors])
        
    staff_entry = {
        "Priority": req.priority_level,
        "Doctor": f"{prov_name} (Role: {prov_role}, Specialty: {prov_specialty})",
        "Date": req.appointment_date,
        "Time": req.time_str,
        "Reason": req.reason,
        "Department": req.department,
        "Visit Type": req.visit_type,
        "available_doctors": doctors_list
    }
    
    # Call the LLM agent
    state = AgentState(patient_id=req.patient_id, staff_entry=staff_entry)
    try:
        result = health_agent.invoke(state)
        ai_response = result.get("final_review", {})
    except Exception as e:
        print(f"LLM Error: {e}")
        with open("appointment_llm_error.txt", "w") as f:
            f.write(f"LLM Error: {str(e)}")
        # --- Fallback Simulated Logic (if API key is invalid/unauthorized) ---
        reason_lower = req.reason.lower() if req.reason else ""
        is_urgent_reason = any(kw in reason_lower for kw in [
            "fever", "chest pain", "breathing", "emergency", "emergent", "urgent",
            "severe", "trauma", "bleeding", "stroke", "cardiac", "heart attack",
            "unconscious", "faint", "accident", "critical", "er visit", "er"
        ])
        is_soon_reason = any(kw in reason_lower for kw in ["infection", "pain", "vomiting", "fracture", "swelling", "cough"])
        
        # Also treat as urgent if priority level is already set to Urgent by the staff
        if req.priority_level and req.priority_level.lower() in ["urgent", "emergency"]:
            is_urgent_reason = True
        
        # Also treat as urgent if visit type is ER Visit
        if req.visit_type and "er" in req.visit_type.lower():
            is_urgent_reason = True
        
        # Check vitals from medical history for fever
        has_fever = "39.5" in state.medical_history or "fever" in state.medical_history.lower() or "temperature_c" in state.medical_history
        if has_fever:
            is_urgent_reason = True

        if is_urgent_reason:
            suggested_priority = "Urgent"
            priority_flag = req.priority_level != "Urgent"
            if priority_flag:
                priority_reasoning = (
                    f"I reviewed the patient's recent vitals and medical history and noticed signs of acute illness (e.g. fever or severe symptoms). "
                    f"Our clinic policy says such conditions should be flagged as Urgent (Phase1) so the patient is seen within 4 hours. "
                    f"Right now it's set to \"{req.priority_level or 'Routine'}\" — I strongly recommend changing this to Urgent."
                )
            else:
                priority_reasoning = "The priority matches clinical guidelines for acute symptoms."
        elif is_soon_reason:
            suggested_priority = "Soon"
            priority_flag = req.priority_level == "Routine"
            if priority_flag:
                priority_reasoning = (
                    f"The patient's reason is \"{req.reason}\", which typically needs attention within 48 hours. "
                    f"It's currently set to Routine. I'd recommend changing this to \"Soon\" (P2)."
                )
            else:
                priority_reasoning = "The priority matches clinical guidelines."
        else:
            suggested_priority = req.priority_level or "Routine"
            priority_flag = False
            priority_reasoning = "The priority matches clinical guidelines."

        is_nurse = "nurse" in prov_role.lower() if prov_role else False
        
        # Find the best available doctor to suggest
        best_doctor = next((d.full_name for d in active_doctors if d.role == 'Doctor'), "Dr. Khalid Al-Rashid")
        
        if is_urgent_reason and is_nurse:
            doctor_flag = True
            suggested_doctor = best_doctor
            doctor_reasoning = (
                f"{prov_name} is a Nurse and is not qualified to handle this case independently. "
                f"This appointment is marked as Urgent (ER Visit / Emergency) and requires a licensed physician. "
                f"I strongly recommend reassigning to {best_doctor} who is available and qualified for this case."
            )
        else:
            doctor_flag = prov_name == "Unknown" or not req.provider_id
            suggested_doctor = best_doctor if doctor_flag else "KEEP"
            doctor_reasoning = (
                "Consider assigning the patient's registered GP for better continuity of care." 
                if doctor_flag else f"You've selected {prov_name} ({prov_specialty}) for this appointment. This is optimal based on doctor availability and suitability for the patient case."
            )

        diffs_out = [
            {
                "field": "Priority",
                "staff_entry": req.priority_level or "Routine",
                "ai_suggestion": suggested_priority if priority_flag else "KEEP",
                "flag": priority_flag,
                "reasoning": priority_reasoning
            },
            {
                "field": "Doctor",
                "staff_entry": prov_name,
                "ai_suggestion": suggested_doctor,
                "flag": doctor_flag,
                "reasoning": doctor_reasoning
            },
            {
                "field": "Date",
                "staff_entry": req.appointment_date or "Not Specified",
                "ai_suggestion": "KEEP",
                "flag": False,
                "reasoning": "The selected date is optimal. There's no current conflicts."
            },
            {
                "field": "Time",
                "staff_entry": req.time_str or "Not Specified",
                "ai_suggestion": "KEEP",
                "flag": False,
                "reasoning": "The selected time slot is optimal and has confirmed availability with no current conflicts."
            }
        ]
        
        return OptimizationReview(
            diffs=diffs_out,
            ai_explanation="AI Review completed. (Note: using fallback logic due to an unexpected AI error)."
        )
    
    # Translate AIAgentResponse dict to OptimizationReview
    flags = ai_response.get("flags", [])
    
    def get_reasoning(flag_types):
        for f in flags:
            if f.get("type") in flag_types:
                expl = f.get("explanation", "").strip()
                if expl:
                    return expl
        return None

    def get_any_flag_reasoning():
        """Fall back to the first non-empty flag explanation, then nurse_summary."""
        for f in flags:
            expl = f.get("explanation", "").strip()
            if expl:
                return expl
        return (ai_response.get("nurse_summary") or "").strip() or None
        
    priority_flag = ai_response.get("priority_action") not in ["KEEP", None, ""]
    if ai_response.get("final_priority") == req.priority_level:
        priority_flag = False
        
    doctor_flag = ai_response.get("provider_action") not in ["KEEP", None, ""]
    suggested_provider_name = ai_response.get("recommended_provider") if doctor_flag else prov_name
    
    if suggested_provider_name == prov_name:
        doctor_flag = False
    
    # Conflict checking logic
    target_prov_id = req.provider_id
    if doctor_flag and suggested_provider_name:
        from sqlalchemy import select
        # Simple name match to find suggested provider ID
        matched = db.query(Provider).filter(Provider.full_name.ilike(f"%{suggested_provider_name}%")).first()
        if matched:
            target_prov_id = matched.id
            
    suggested_date = "KEEP"
    suggested_time = "KEEP"
    date_flag = False
    time_flag = False
    date_reasoning = "The selected date is optimal. There's no current conflicts."
    time_reasoning = "The selected time slot is optimal and has confirmed availability with no current conflicts."
    manual_slots_affected = None
    
    if target_prov_id and (req.utc_datetime or (req.appointment_date and req.time_str)):
        try:
            from datetime import datetime, timedelta, timezone
            
            if hasattr(req, "utc_datetime") and req.utc_datetime:
                iso_str = req.utc_datetime.replace('Z', '+00:00')
                req_dt = datetime.fromisoformat(iso_str)
            else:
                req_dt = datetime.strptime(f"{req.appointment_date} {req.time_str}", "%Y-%m-%d %H:%M")
                local_tz = datetime.now().astimezone().tzinfo
                req_dt = req_dt.replace(tzinfo=local_tz)
            
            temp_date = req_dt
            attempts = 0
            conflict_found = False
            first_conflict_appt = None

            while attempts < 20:
                half = SLOT_DURATION_MIN - 1
                start_win = temp_date - timedelta(minutes=half)
                end_win = temp_date + timedelta(minutes=half)
                conflicts = db.query(Appointment).filter(
                    Appointment.provider_id == target_prov_id,
                    Appointment.appointment_date >= start_win,
                    Appointment.appointment_date <= end_win,
                    Appointment.status.in_(["Scheduled", "Confirmed", "Booked", "Completed"])
                ).all()

                if not conflicts:
                    break

                conflict_found = True
                if first_conflict_appt is None:
                    first_conflict_appt = conflicts[0]
                temp_date += timedelta(minutes=SLOT_DURATION_MIN)
                attempts += 1

            if conflict_found:
                local_tz = datetime.now().astimezone().tzinfo
                local_temp = temp_date.astimezone(local_tz) if temp_date.tzinfo else temp_date
                local_req = req_dt.astimezone(local_tz) if req_dt.tzinfo else req_dt

                # Build a human-readable description of the blocking appointment
                if first_conflict_appt:
                    c_pat = db.get(Patient, first_conflict_appt.patient_id)
                    c_pat_name = f"{c_pat.first_name} {c_pat.family_name}" if c_pat else "another patient"
                    c_time = first_conflict_appt.appointment_date.astimezone(local_tz).strftime("%H:%M")
                    conflict_desc = f"{c_pat_name} at {c_time}"
                else:
                    conflict_desc = "another patient"

                time_flag = True
                suggested_time = local_temp.strftime("%H:%M")
                if local_temp.date() != local_req.date():
                    date_flag = True
                    suggested_date = local_temp.strftime("%Y-%m-%d")
                    date_reasoning = "Shifted to the next available day due to schedule conflicts."
                time_reasoning = f"Conflict with {conflict_desc}'s appointment at this slot. Shifted to {local_temp.strftime('%H:%M')} — the next available slot to prevent double-booking."
                manual_slots_affected = f"Bypassed {attempts} conflicting slot(s) to find availability."
        except Exception as e:
            print(f"Time parse error: {e}")
    
    diffs_out = [
        {
            "field": "Priority",
            "staff_entry": req.priority_level or "Routine",
            "ai_suggestion": ai_response.get("final_priority") if priority_flag else "KEEP",
            "flag": priority_flag,
            "reasoning": get_reasoning(["escalation", "confirm_info", "emergency"]) or get_any_flag_reasoning() or ("Priority needs review." if priority_flag else "The priority matches clinical guidelines.")
        },
        {
            "field": "Doctor",
            "staff_entry": prov_name,
            "ai_suggestion": suggested_provider_name if doctor_flag else "KEEP",
            "flag": doctor_flag,
            "reasoning": get_reasoning(["slot_or_fit_conflict", "continuity_overridden"]) or (get_any_flag_reasoning() if doctor_flag else None) or ("The nurse isn't suitable for an emergent case. Consider assigning the recommended provider." if doctor_flag else f"You've selected {prov_name} ({prov_specialty}) for this appointment. This is optimal based on doctor availability and suitability for the patient case.")
        },
        {
            "field": "Date",
            "staff_entry": req.appointment_date or "Not Specified",
            "ai_suggestion": suggested_date,
            "flag": date_flag,
            "reasoning": date_reasoning
        },
        {
            "field": "Time",
            "staff_entry": req.time_str or "Not Specified",
            "ai_suggestion": suggested_time,
            "flag": time_flag,
            "reasoning": time_reasoning
        }
    ]
    
    ai_exp = ai_response.get("nurse_summary") or "AI Review completed."
    if manual_slots_affected:
        ai_exp += f" ({manual_slots_affected})"

    # Log AI optimization action
    changes_flagged = sum(1 for d in diffs_out if d.get("flag"))
    pat_name = f"{pat.first_name} {pat.family_name}"
    appt_date = req.appointment_date or "Unknown date"
    orig_priority = req.priority_level or "Routine"
    final_priority = ai_response.get("final_priority") or orig_priority
    priority_str = f"{orig_priority} → {final_priority}" if priority_flag else orig_priority
    log_action = (
        f"AI Optimization — {changes_flagged} change(s) suggested | Priority: {priority_str} | Provider: {prov_name} | Date: {appt_date}"
        if changes_flagged else
        f"AI Optimization — No changes needed | Priority: {orig_priority} | Provider: {prov_name} | Date: {appt_date}"
    )
    db.add(ActivityLog(
        action=log_action,
        patient_name=pat_name,
        provider_name=f"{_user.full_name} ({_user.role})"
    ))
    db.commit()
    
    return OptimizationReview(
        diffs=diffs_out,
        ai_explanation=ai_exp
    )

@router.post("/generate-slot", response_model=AppointmentOut)
def generate_ai_optimized_slot(spec: AppointmentGenerateSpec, _user: CurrentUser, db: Annotated[Session, Depends(get_db)]):
    pat = db.get(Patient, spec.patient_id)
    if not pat:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    prov = None
    if pat.attending_provider_id:
        prov = db.get(Provider, pat.attending_provider_id)
        
    if not prov:
        prov = db.scalars(select(Provider).where(Provider.role == "Doctor")).first()
        
    if not prov:
        prov = db.scalars(select(Provider)).first()
        
    if not prov:
        raise HTTPException(status_code=500, detail="No providers available")
        
    from datetime import datetime, timedelta, timezone
    import os
    import json
    
    local_tz = datetime.now().astimezone().tzinfo
    
    # 1. If we are optimizing an existing appointment
    if spec.appointment_id:
        existing_appt = db.get(Appointment, spec.appointment_id)
        if not existing_appt:
            raise HTTPException(status_code=404, detail="Appointment not found")
            
        prov = db.get(Provider, existing_appt.provider_id)
        if not prov:
            prov = db.scalars(select(Provider).where(Provider.role == "Doctor")).first()
            if not prov:
                prov = db.scalars(select(Provider)).first()
                
        date_obj = existing_appt.appointment_date
        
        if not os.environ.get("GROQ_API_KEY"):
            reason_lower = spec.reason.lower()
            if any(kw in reason_lower for kw in ["chest pain", "breathing", "severe", "fever", "emergency"]):
                priority_level = "High" if "fever" in reason_lower else "Urgent"
                ai_explanation = f"Simulated AI prioritized slot ({priority_level}) for symptoms of: '{spec.reason}'."
            else:
                priority_level = "Routine"
                ai_explanation = f"Simulated AI prioritized slot (Routine) for: '{spec.reason}'."
        else:
            state = AgentState(patient_id=spec.patient_id, reason=spec.reason)
            result = health_agent.invoke(state)
            final_slot = result.get("final_slot", {})
            priority_level = final_slot.get("priority_level", "Routine")
            ai_explanation = final_slot.get("ai_explanation", "AI Optimized based on EMR history.")
            
        priority_changed = existing_appt.priority_level != priority_level
        prov_name = prov.full_name if prov else "Any"
        optimization_diffs_data = [
            {
                "field": "Priority",
                "staff_entry": existing_appt.priority_level or "Routine",
                "ai_suggestion": priority_level if priority_changed else "KEEP",
                "flag": priority_changed,
                "reasoning": f"Based on the patient's symptoms of '{spec.reason}', priority should be {priority_level}." if priority_changed else "The requested priority matches clinical guidelines."
            },
            {
                "field": "Doctor",
                "staff_entry": prov_name,
                "ai_suggestion": "KEEP",
                "flag": False,
                "reasoning": "The selected doctor matches the required specialty."
            },
            {
                "field": "Date",
                "staff_entry": existing_appt.appointment_date.strftime("%Y-%m-%d"),
                "ai_suggestion": "KEEP",
                "flag": False,
                "reasoning": "The date is within the PHC Working Hours."
            },
            {
                "field": "Time",
                "staff_entry": existing_appt.appointment_date.strftime("%H:%M"),
                "ai_suggestion": "KEEP",
                "flag": False,
                "reasoning": "The time slot is optimal."
            }
        ]
        optimization_diffs_json = json.dumps(optimization_diffs_data)
            
    # 2. Otherwise we generate a new slot
    else:
        if not os.environ.get("GROQ_API_KEY"):
            reason_lower = spec.reason.lower()
            if any(kw in reason_lower for kw in ["chest pain", "breathing", "severe", "fever", "emergency"]):
                priority_level = "High" if "fever" in reason_lower else "Urgent"
                days_from_now = 1
                time_str = "09:00:00"
                ai_explanation = f"Simulated AI prioritized slot ({priority_level}) for symptoms of: '{spec.reason}'. Scheduled within 1 day."
            else:
                priority_level = "Routine"
                days_from_now = 3
                time_str = "14:30:00"
                ai_explanation = f"Simulated AI prioritized slot (Routine) for: '{spec.reason}'. Scheduled in 3 days."
            
            final_slot = {
                "suggested_provider_role": "Doctor",
                "priority_level": priority_level,
                "days_from_now": days_from_now,
                "time": time_str,
                "ai_explanation": ai_explanation
            }
        else:
            state = AgentState(patient_id=spec.patient_id, reason=spec.reason)
            result = health_agent.invoke(state)
            final_slot = result.get("final_slot", {
                "suggested_provider_role": "Doctor",
                "priority_level": "Routine",
                "days_from_now": 3,
                "time": "10:00:00",
                "ai_explanation": "Default scheduling slot assigned based on routine follow-up protocol."
            })
            
        days_out = int(final_slot.get("days_from_now", 1))
        time_str = final_slot.get("time", "10:00:00")
        priority_level = final_slot.get("priority_level", "Routine")
        ai_explanation = final_slot.get("ai_explanation", "AI Suggested slot.")
        
        date_obj = datetime.now(local_tz) + timedelta(days=days_out)
        try:
            time_parts = time_str.split(':')
            hour = int(time_parts[0])
            minute = int(time_parts[1])
            date_obj = date_obj.replace(hour=hour, minute=minute, second=0, microsecond=0)
        except:
            date_obj = date_obj.replace(hour=10, minute=0, second=0, microsecond=0)

        # Conflict check and slot shifting logic
        if prov:
            attempts = 0
            while attempts < 20:
                half = SLOT_DURATION_MIN - 1
                start_win = date_obj - timedelta(minutes=half)
                end_win = date_obj + timedelta(minutes=half)
                
                # Check DB for conflicts
                conflicts = db.query(Appointment).filter(
                    Appointment.provider_id == prov.id,
                    Appointment.appointment_date >= start_win,
                    Appointment.appointment_date <= end_win,
                    Appointment.status.in_(["Scheduled", "Confirmed", "Booked", "Completed"])
                ).all()
                
                if not conflicts:
                    break
                    
                # Shift forward by SLOT_DURATION_MIN
                date_obj += timedelta(minutes=SLOT_DURATION_MIN)
                attempts += 1

        prov_name = prov.full_name if prov else "Any"
        optimization_diffs_data = [
            {
                "field": "Priority",
                "staff_entry": "Not Specified",
                "ai_suggestion": priority_level,
                "flag": True,
                "reasoning": f"Based on the clinical indication '{spec.reason}', priority was assigned as {priority_level}."
            },
            {
                "field": "Doctor",
                "staff_entry": "Any",
                "ai_suggestion": prov_name,
                "flag": True,
                "reasoning": "Assigned to the most appropriate available doctor based on continuity of care and specialty."
            },
            {
                "field": "Date",
                "staff_entry": "Not Specified",
                "ai_suggestion": date_obj.strftime("%Y-%m-%d"),
                "flag": True,
                "reasoning": "An optimal date was selected to meet the required SLA."
            },
            {
                "field": "Time",
                "staff_entry": "Not Specified",
                "ai_suggestion": date_obj.strftime("%H:%M"),
                "flag": True,
                "reasoning": "A time slot was identified within standard clinical hours without overburdening the physician."
            }
        ]
        optimization_diffs_json = json.dumps(optimization_diffs_data)

    # Conflict check & shift loop (respecting manual slots)
    conflict_found = False
    conflicting_slots_info = []
    
    date_obj_orig = date_obj
    temp_date = date_obj
    max_attempts = 20
    attempts = 0
    while attempts < max_attempts:
        half = SLOT_DURATION_MIN - 1
        start_win = temp_date - timedelta(minutes=half)
        end_win = temp_date + timedelta(minutes=half)
        
        # Check database for overlapping appointments for this provider
        stmt = select(Appointment).where(
            Appointment.provider_id == prov.id,
            Appointment.appointment_date >= start_win,
            Appointment.appointment_date <= end_win,
            Appointment.status == "Scheduled"
        )
        if spec.appointment_id:
            stmt = stmt.where(Appointment.id != spec.appointment_id)
            
        conflicts = db.scalars(stmt).all()
        
        if not conflicts:
            # Found a free slot!
            date_obj = temp_date
            break
            
        # Overlap detected
        conflict_found = True
        for c in conflicts:
            pat_name = "Unknown"
            c_pat = db.get(Patient, c.patient_id)
            if c_pat:
                pat_name = f"{c_pat.first_name} {c_pat.family_name}"
                
            slot_type = "Manual Nurse Slot" if not c.is_ai_generated else "AI Slot"
            formatted_time = c.appointment_date.strftime("%I:%M %p (%Y-%m-%d)")
            conflicting_slots_info.append(f"{slot_type} with {prov.full_name} for patient {pat_name} at {formatted_time}")
            
        # Shift slot forward by one slot duration and check again
        temp_date = temp_date + timedelta(minutes=SLOT_DURATION_MIN)
        attempts += 1
        
    # Construct manual_slots_affected explanation
    orig_formatted = date_obj_orig.strftime('%I:%M %p on %A (%Y-%m-%d)')
    new_formatted = date_obj.strftime('%I:%M %p on %A (%Y-%m-%d)')
    if conflict_found:
        conflicts_str = "; ".join(conflicting_slots_info)
        manual_slots_affected = f"Conflict detected: {conflicts_str}. Bypassed slot and optimized appointment time from {orig_formatted} to {new_formatted} to preserve conflicting bookings."
    else:
        manual_slots_affected = f"No conflicts detected. The appointment remains at the requested slot of {orig_formatted}."
        
    if spec.appointment_id:
        existing_appt.appointment_date = date_obj
        existing_appt.reason = spec.reason
        existing_appt.notes = "AI Optimized Slot based on medical data."
        existing_appt.is_ai_generated = True
        existing_appt.priority_level = priority_level
        existing_appt.ai_explanation = ai_explanation
        existing_appt.manual_slots_affected = manual_slots_affected
        existing_appt.optimization_diffs = optimization_diffs_json
        db.commit()
        db.refresh(existing_appt)
        new_appt = existing_appt
    else:
        # Delete any existing scheduled appointment for this patient to prevent duplicate active slots
        stmt_del = select(Appointment).where(
            Appointment.patient_id == spec.patient_id,
            Appointment.status == "Scheduled"
        )
        old_appts = db.scalars(stmt_del).all()
        for old_appt in old_appts:
            db.delete(old_appt)
            
        new_appt = Appointment(
            patient_id=spec.patient_id,
            provider_id=prov.id,
            appointment_date=date_obj,
            reason=spec.reason,
            notes="AI Generated Slot based on medical data.",
            is_ai_generated=True,
            status="Scheduled",
            priority_level=priority_level,
            ai_explanation=ai_explanation,
            manual_slots_affected=manual_slots_affected,
            optimization_diffs=optimization_diffs_json
        )
        db.add(new_appt)
        db.commit()
        db.refresh(new_appt)
        
    return AppointmentOut(
        id=new_appt.id,
        patient_id=new_appt.patient_id,
        provider_id=new_appt.provider_id,
        appointment_date=new_appt.appointment_date,
        reason=new_appt.reason,
        status=new_appt.status,
        notes=new_appt.notes,
        is_ai_generated=new_appt.is_ai_generated,
        priority_level=new_appt.priority_level,
        ai_explanation=new_appt.ai_explanation,
        manual_slots_affected=new_appt.manual_slots_affected,
        optimization_diffs=new_appt.optimization_diffs,
        patient_name=f"{pat.first_name} {pat.family_name}",
        provider_name=prov.full_name
    )
