from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import CurrentUser
from app.models import ActivityLog, Patient, Provider, VitalSign, Appointment
from app.schemas import ActivityItem, DashboardOut, StatBlock
from app.util import relative_time

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardOut)
def summary(_user: CurrentUser, db: Annotated[Session, Depends(get_db)]):
    now = datetime.now(timezone.utc)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)
    
    role = _user.role
    stats = []

    if role == "Doctor":
        # Today's appointments (assigned to this doctor)
        today_appts = db.query(func.count(Appointment.id)).filter(
            Appointment.provider_id == _user.id,
            Appointment.appointment_date >= start,
            Appointment.appointment_date < end,
            Appointment.status != "Cancelled"
        ).scalar() or 0

        # Distinct patients scheduled today with this doctor
        patients_today = db.query(func.count(func.distinct(Appointment.patient_id))).filter(
            Appointment.provider_id == _user.id,
            Appointment.appointment_date >= start,
            Appointment.appointment_date < end,
            Appointment.status != "Cancelled"
        ).scalar() or 0

        # Vitals recorded today facility-wide
        vitals_count = db.query(func.count(VitalSign.id)).filter(
            VitalSign.recorded_at >= start,
            VitalSign.recorded_at < end
        ).scalar() or 0

        # Urgent priority cases (all upcoming/active for this doctor)
        urgent_cases = db.query(func.count(Appointment.id)).filter(
            Appointment.provider_id == _user.id,
            Appointment.priority_level == "Urgent",
            Appointment.status != "Cancelled"
        ).scalar() or 0

        # Completion Rate (ratio of Completed/Confirmed vs total scheduled today)
        total_today = db.query(func.count(Appointment.id)).filter(
            Appointment.provider_id == _user.id,
            Appointment.appointment_date >= start,
            Appointment.appointment_date < end
        ).scalar() or 0
        
        attended_today = db.query(func.count(Appointment.id)).filter(
            Appointment.provider_id == _user.id,
            Appointment.appointment_date >= start,
            Appointment.appointment_date < end,
            Appointment.status.in_(["Confirmed", "Completed"])
        ).scalar() or 0

        completion_rate = "100%"
        if total_today > 0:
            completion_rate = f"{int((attended_today / total_today) * 100)}%"

        # AI Optimized Schedules
        total_slots = db.query(func.count(Appointment.id)).filter(
            Appointment.provider_id == _user.id,
            Appointment.status != "Cancelled"
        ).scalar() or 0
        ai_slots = db.query(func.count(Appointment.id)).filter(
            Appointment.provider_id == _user.id,
            Appointment.is_ai_generated == True,
            Appointment.status != "Cancelled"
        ).scalar() or 0
        ai_rate = "100%"
        if total_slots > 0:
            ai_rate = f"{int((ai_slots / total_slots) * 100)}%"

        stats = [
            StatBlock(title="Completion Rate", value=completion_rate, description="Appointments completed"),
            StatBlock(title="AI Optimized", value=ai_rate, description="Schedules optimized"),
            StatBlock(title="Urgent Cases", value=str(urgent_cases), description="Needs immediate attention"),
            StatBlock(title="Patients Today", value=str(patients_today), description="Distinct scheduled patients")
        ]

    elif role == "Nurse":
        # Total vitals recorded today
        vitals_count = db.query(func.count(VitalSign.id)).filter(
            VitalSign.recorded_at >= start,
            VitalSign.recorded_at < end
        ).scalar() or 0

        # Total appointments today
        today_appts = db.query(func.count(Appointment.id)).filter(
            Appointment.appointment_date >= start,
            Appointment.appointment_date < end,
            Appointment.status != "Cancelled"
        ).scalar() or 0

        # High Temp / Alert Alerts (temp > 38.0 or spo2 < 95 or HR > 100 recorded today)
        alerts_count = db.query(func.count(VitalSign.id)).filter(
            VitalSign.recorded_at >= start,
            VitalSign.recorded_at < end,
            (VitalSign.temperature_c > 38.0) | (VitalSign.spo2 < 95) | (VitalSign.heart_rate > 100)
        ).scalar() or 0

        stats = [
            StatBlock(title="Vitals Today", value=str(vitals_count), description="Recorded today"),
            StatBlock(title="Today's Bookings", value=str(today_appts), description="Total appointments"),
            StatBlock(title="Alert Cases", value=str(alerts_count), description="Abnormal vitals today")
        ]

    else: # E-Health Admin
        # Active providers
        active_providers = db.query(func.count(Provider.id)).filter(Provider.status == "Active").scalar() or 0
        total_providers = db.query(func.count(Provider.id)).scalar() or 0

        # Total patients
        total_pats = db.query(func.count(Patient.id)).scalar() or 0

        # Today's total bookings
        today_appts = db.query(func.count(Appointment.id)).filter(
            Appointment.appointment_date >= start,
            Appointment.appointment_date < end,
            Appointment.status != "Cancelled"
        ).scalar() or 0

        # AI-Resolved Conflicts (AI optimized bookings today)
        ai_resolved = db.query(func.count(Appointment.id)).filter(
            Appointment.appointment_date >= start,
            Appointment.appointment_date < end,
            Appointment.is_ai_generated == True,
            Appointment.status != "Cancelled"
        ).scalar() or 0

        # Shift Coverage
        coverage = f"{active_providers} / {total_providers}"

        # System Logs Today
        logs_today = db.query(func.count(ActivityLog.id)).filter(
            ActivityLog.created_at >= start,
            ActivityLog.created_at < end
        ).scalar() or 0

        stats = [
            StatBlock(title="Active Providers", value=str(active_providers), description=f"Out of {total_providers}"),
            StatBlock(title="Total Patients", value=str(total_pats), description="All time registrations"),
            StatBlock(title="Today's Bookings", value=str(today_appts), description="Facility-wide slots"),
            StatBlock(title="AI Resolved", value=str(ai_resolved), description="Conflicts bypassed"),
            StatBlock(title="Shift Coverage", value=coverage, description="Active medical staff"),
            StatBlock(title="System Logs", value=str(logs_today), description="Logged actions today")
        ]

    if role == "Doctor":
        logs = db.query(ActivityLog).filter(
            ActivityLog.provider_name.like(f"{_user.full_name}%"),
            ActivityLog.action.notin_(["Vital signs recorded", "New patient registered"])
        ).order_by(ActivityLog.created_at.desc()).limit(15).all()
    elif role == "Nurse":
        logs = db.query(ActivityLog).filter(ActivityLog.provider_name.like(f"{_user.full_name}%")).order_by(ActivityLog.created_at.desc()).limit(15).all()
    else:
        logs = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(15).all()
        
    activity = [
        ActivityItem(
            id=log.id,
            action=log.action,
            patient=log.patient_name,
            provider=log.provider_name,
            time=relative_time(log.created_at),
        )
        for log in logs
    ]
    return DashboardOut(stats=stats, activity=activity)
