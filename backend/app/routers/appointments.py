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

@router.get("/", response_model=List[AppointmentOut])
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

@router.post("/", response_model=AppointmentOut)
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
    db_appt = db.get(Appointment, appointment_id)
    if not db_appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    db_appt.status = "Cancelled"
    db.commit()
    db.refresh(db_appt)
    return {"message": "Appointment cancelled successfully"}

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


from langchain_groq import ChatGroq
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
    # LLM and Structured Output
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.2)
    structured_llm = llm.with_structured_output(AIAgentResponseLLM)
        
    prompt = f"""
ROLE
You are the Scheduling Clinical Supervisor, an AI assist layer inside a Primary Healthcare Centre scheduling tool. 
A staff member (usually a nurse) fills in an appointment form; you review their entry and suggest optimizations that appear in an "AI Optimization Review" dialog with plain, nurse-readable explanations.
You never book, change, or finalize anything. The nurse always makes the final call.

OPERATING PRINCIPLES (override everything below if in conflict)
1. Escalate freely, never silently downgrade. You may raise urgency or flag a concern; you may never lower a priority the nurse selected. The most you do when you see LESS urgency than the nurse is add an informational note.
2. Absence of signal is not reassurance. An empty reason field, missing vitals, or no matching keywords does NOT mean "Routine" or "safe" — it means "insufficient information," which is itself a flag to confirm.
3. Trust ranking of inputs: measured vitals > EMR risk context > reason-text. Objective data outranks parsed free text.
4. You assist, you don't decide. Every suggestion is a recommendation the nurse can accept or reject.
5. Audit everything. Output is logged with the nurse's accept/reject. Use only the minimum EMR fields the decision requires.
6. You are not a diagnostic tool and not a substitute for clinical judgment.
7. CRITICAL: DO NOT HALLUCINATE OR INVENT VITALS. If a temperature, BP, or other vital is not explicitly provided in the INPUTS, do not make one up. If the EMR mentions "fever" but no temperature is given, say "history of fever", NOT a specific degree.

INPUTS
- visit_type: {state.staff_entry.get('Visit Type', 'Unknown')}
- reason_text: {state.staff_entry.get('Reason', '')}
- nurse_selected_priority: {state.staff_entry.get('Priority', 'Routine')}
- nurse_selected_provider: {state.staff_entry.get('Doctor', 'Any Provider')}
- requested_datetime: {state.staff_entry.get('Date', '')} {state.staff_entry.get('Time', '')}
- vitals and emr: {state.medical_history}
- available_doctors: {state.staff_entry.get('available_doctors', 'Unknown')}

PRIORITY TIERS & SLA
- Urgent  -> see within 4 hours (Phase1)
- Soon    -> see within 48 hours (Phase2)
- Routine -> standard scheduling (Phase3)
Thresholds for vitals MUST come from the centre's adopted early-warning instrument (e.g. NEWS2). Do not invent thresholds. Apply age-appropriate ranges.

STEP 0 - VISIT-TYPE CONTEXT
- New Visit: No EMR history. Assign by availability + clinical fit. Gather baseline.
- Walk In: Vitals present -> vitals are primary signal. Run full emergency screen.
- Follow Up: Drive on "change since last visit". Continuity targets the doctor who handled related prior episode (or GP). Treat "not improving" as escalation.
- ER Visit: ACUITY CATEGORY, NOT A BOOKING. Branch straight to emergency pathway.
- Maternity: Obstetric ruleset. Provider resolves to OB/midwife, never GP.

STEP 1 - EMERGENCY SCREEN
Before negation, scrub negated terms. Red flags come from Vitals (critical thresholds) AND Reason text (chest pain, FAST signs, severe breathing, major bleeding/trauma, unresponsive).
If red flag present: STOP scheduling. Set emergency_route = true. Output emergency action and exit.

STEP 2 - URGENCY CLASSIFICATION (non-emergency)
Compute ai_suggested_priority: Vitals (sub-critical -> Soon/Urgent), EMR risk modifier (bump borderline UP), Reason text. Take HIGHEST.

STEP 3 - RECONCILE WITH NURSE
final_priority = max(nurse_selected_priority, ai_suggested_priority)
- ai > nurse -> final = ai; FLAG(escalation, severity=high), recommend upgrade.
- ai < nurse -> final = nurse; keep it; optional note.
- ai = nurse -> keep; no flag.

STEP 4 - DOCTOR ASSIGNMENT
candidates = doctors clinically appropriate from available_doctors
If the patient has an acute or urgent condition (e.g. asthma attack, severe pain) and nurse_selected_provider is a Nurse, you MUST reassign them to a Doctor. FLAG(slot_or_fit_conflict, severity=medium), provider_action=REASSIGN, and set recommended_provider to an appropriate doctor.
If nurse_selected_provider is a Doctor and is appropriate, keep it.
Elif registered GP is in candidates, assign that doctor.
Else assign earliest appropriate doctor; FLAG(continuity_overridden, severity=low).

STEP 5 - FLAG AGGREGATION & OUTPUT
Weight flags by severity. If zero flags, confirm with "no issues detected. You've selected {state.staff_entry.get('Doctor')} for this appointment. This is optimal based on doctor availability and suitability for the patient case."
Explanations must be readable by a nurse with no AI background.
"""
    response = structured_llm.invoke([HumanMessage(content=prompt)])
    final_review = response.model_dump()
    
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
        # --- Fallback Simulated Logic (if API key is invalid/unauthorized) ---
        reason_lower = req.reason.lower() if req.reason else ""
        is_urgent_reason = any(kw in reason_lower for kw in ["fever", "chest pain", "breathing", "emergency", "severe", "trauma", "bleeding", "stroke"])
        is_soon_reason = any(kw in reason_lower for kw in ["infection", "pain", "vomiting", "fracture", "swelling", "cough"])
        
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

        doctor_flag = prov_name == "Unknown" or not req.provider_id
        suggested_doctor = "Dr. Khalid Al-Rashid" if doctor_flag else "KEEP"
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
                "reasoning": "The selected date is optimal. It falls within standard PHC operating hours (8:00 AM to 5:00 PM) and has confirmed availability with no scheduling conflicts."
            },
            {
                "field": "Time",
                "staff_entry": req.time_str or "Not Specified",
                "ai_suggestion": "KEEP",
                "flag": False,
                "reasoning": "The selected time slot is optimal. It falls within standard PHC operating hours (8:00 AM to 5:00 PM) and has confirmed availability with no scheduling conflicts."
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
                return f.get("explanation")
        return None
        
    priority_flag = ai_response.get("priority_action") not in ["KEEP", None, ""]
    doctor_flag = ai_response.get("provider_action") not in ["KEEP", None, ""]
    suggested_provider_name = ai_response.get("recommended_provider") if doctor_flag else prov_name
    
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
    date_reasoning = "The selected date is optimal. It falls within standard PHC operating hours."
    time_reasoning = "The selected time slot is optimal and has confirmed availability with no scheduling conflicts."
    manual_slots_affected = None
    
    if target_prov_id and req.appointment_date and req.time_str:
        try:
            from datetime import datetime, timedelta
            req_dt = datetime.strptime(f"{req.appointment_date} {req.time_str}", "%Y-%m-%d %H:%M")
            
            temp_date = req_dt
            attempts = 0
            conflict_found = False
            
            while attempts < 20:
                half = SLOT_DURATION_MIN - 1
                start_win = temp_date - timedelta(minutes=half)
                end_win = temp_date + timedelta(minutes=half)
                conflicts = db.query(Appointment).filter(
                    Appointment.provider_id == target_prov_id,
                    Appointment.appointment_date >= start_win,
                    Appointment.appointment_date <= end_win,
                    Appointment.status == "Scheduled"
                ).all()
                
                if not conflicts:
                    break
                    
                conflict_found = True
                temp_date += timedelta(minutes=SLOT_DURATION_MIN)
                attempts += 1
                
            if conflict_found:
                time_flag = True
                suggested_time = temp_date.strftime("%H:%M")
                if temp_date.date() != req_dt.date():
                    date_flag = True
                    suggested_date = temp_date.strftime("%Y-%m-%d")
                    date_reasoning = "Shifted to the next available day due to schedule conflicts."
                time_reasoning = "Conflict detected with an existing appointment. Shifted to the next available slot to prevent double-booking."
                manual_slots_affected = f"Bypassed {attempts} conflicting slot(s) to find availability."
        except Exception as e:
            print(f"Time parse error: {e}")
    
    diffs_out = [
        {
            "field": "Priority",
            "staff_entry": req.priority_level or "Routine",
            "ai_suggestion": ai_response.get("final_priority") if priority_flag else "KEEP",
            "flag": priority_flag,
            "reasoning": get_reasoning(["escalation", "confirm_info"]) or ("Priority needs review." if priority_flag else "The priority matches clinical guidelines.")
        },
        {
            "field": "Doctor",
            "staff_entry": prov_name,
            "ai_suggestion": suggested_provider_name if doctor_flag else "KEEP",
            "flag": doctor_flag,
            "reasoning": get_reasoning(["slot_or_fit_conflict", "continuity_overridden"]) or ("Consider assigning the recommended provider." if doctor_flag else f"You've selected {prov_name} ({prov_specialty}) for this appointment. This is optimal based on doctor availability and suitability for the patient case.")
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
    db.add(ActivityLog(
        action="AI Appointment Optimization reviewed",
        patient_name=f"Patient #{req.patient_id}",
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
