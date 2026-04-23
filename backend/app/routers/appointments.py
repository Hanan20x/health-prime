from datetime import datetime, timedelta
import random

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import Appointment, Patient, Provider
from app.schemas import AppointmentCreate, AppointmentOut, AppointmentGenerateSpec, UserOut

router = APIRouter(prefix="/appointments", tags=["Appointments"])

@router.get("/", response_model=List[AppointmentOut])
def get_appointments(db: Session = Depends(get_db)):
    # Basic method to get all appointments
    stmt = select(Appointment)
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
            is_ai_generated=appt.is_ai_generated,
            patient_name=f"{pat.first_name} {pat.family_name}" if pat else "Unknown",
            provider_name=prov.full_name if prov else "Unknown"
        ))
    return out


@router.post("/", response_model=AppointmentOut)
def register_appointment(appt_in: AppointmentCreate, db: Session = Depends(get_db)):
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
        is_ai_generated=False,
        status="Scheduled"
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
        patient_name=f"{pat.first_name} {pat.family_name}",
        provider_name=prov.full_name
    )

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, END
import json
from pydantic import BaseModel, ConfigDict
import os

class AgentState(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    patient_id: int
    doctor_id: int | None = None
    reason: str
    clinical_history: str = ""
    proposed_date: str = ""
    messages: list = []
    final_slot: dict | None = None

def get_clinical_data(state: AgentState):
    # Dummy step to gather clinical text
    state.clinical_history = f"Patient needs appointment for: {state.reason}. History: Routine."
    return state

def suggest_slot(state: AgentState):
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro", temperature=0.7)
    prompt = f"""
    You are an AI medical scheduler. Based on the following reason, suggest an optimal appointment time and a provider type.
    Reason: {state.reason}
    Clinical history: {state.clinical_history}
    Output JSON ONLY in this format: {{"suggested_provider_role": "Doctor", "days_from_now": 2, "time": "10:00:00"}}
    """
    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        parsed = json.loads(response.content.strip("`json \n"))
        state.proposed_date = f"Days: {parsed.get('days_from_now')}, Time: {parsed.get('time')}"
        state.final_slot = parsed
    except Exception as e:
        # Fallback
        state.final_slot = {"suggested_provider_role": "Doctor", "days_from_now": 1, "time": "09:00:00"}
    return state

# Setup LangGraph globally
workflow = StateGraph(AgentState)
workflow.add_node("gather_data", get_clinical_data)
workflow.add_node("suggest", suggest_slot)
workflow.set_entry_point("gather_data")
workflow.add_edge("gather_data", "suggest")
workflow.add_edge("suggest", END)
health_agent = workflow.compile()


@router.post("/generate-slot", response_model=AppointmentOut)
def generate_ai_optimized_slot(spec: AppointmentGenerateSpec, db: Session = Depends(get_db)):
    pat = db.get(Patient, spec.patient_id)
    if not pat:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    if not os.environ.get("GOOGLE_API_KEY"):
        # Simulated logic if API key isn't present
        final_slot = {"suggested_provider_role": "Doctor", "days_from_now": 3, "time": "14:30:00"}
    else:
        # Run langgraph agent
        state = AgentState(patient_id=spec.patient_id, reason=spec.reason)
        result = health_agent.invoke(state)
        final_slot = result.get("final_slot", {"days_from_now": 1, "time": "10:00:00"})
    
    # Pick provider based on role (or randomly)
    provs = db.scalars(select(Provider)).all()
    if not provs:
        raise HTTPException(status_code=500, detail="No providers available")
        
    prov = provs[0] # Pick first one
    
    days_out = int(final_slot.get("days_from_now", 1))
    time_str = final_slot.get("time", "10:00:00")
    
    from datetime import datetime, timedelta
    date_obj = datetime.now() + timedelta(days=days_out)
    try:
        hour, minute, _ = map(int, time_str.split(':'))
        date_obj = date_obj.replace(hour=hour, minute=minute, second=0, microsecond=0)
    except:
        date_obj = date_obj.replace(hour=10, minute=0, second=0, microsecond=0)
        
    new_appt = Appointment(
        patient_id=spec.patient_id,
        provider_id=prov.id,
        appointment_date=date_obj,
        reason=spec.reason,
        notes="AI Generated Slot based on clinical data.",
        is_ai_generated=True,
        status="Scheduled"
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
        patient_name=f"{pat.first_name} {pat.family_name}",
        provider_name=prov.full_name
    )
