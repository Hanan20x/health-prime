from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import CurrentUser
from app.models import ActivityLog, Patient, Provider, VitalSign
from app.schemas import ActivityItem, DashboardOut, StatBlock
from app.util import relative_time

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardOut)
def summary(_user: CurrentUser, db: Annotated[Session, Depends(get_db)]):
    total_providers = db.query(func.count(Provider.id)).scalar() or 0
    total_patients = db.query(func.count(Patient.id)).scalar() or 0
    now = datetime.now(timezone.utc)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)
    vitals_today = (
        db.query(func.count(VitalSign.id))
        .filter(VitalSign.recorded_at >= start, VitalSign.recorded_at < end)
        .scalar()
        or 0
    )
    active_staff = (
        db.query(func.count(Provider.id)).filter(Provider.status == "Active").scalar() or 0
    )

    stats = [
        StatBlock(
            title="Total Healthcare Providers",
            value=int(total_providers),
            description="Registered in system",
        ),
        StatBlock(
            title="Total Patients",
            value=int(total_patients),
            description="All time registrations",
        ),
        StatBlock(
            title="Today's Vitals",
            value=int(vitals_today),
            description="Recorded today",
        ),
        StatBlock(
            title="Active Staff",
            value=int(active_staff),
            description="Providers marked active",
        ),
    ]

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
