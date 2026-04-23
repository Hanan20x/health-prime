from __future__ import annotations

from datetime import date, datetime, timezone

from app.models import Patient


def calc_age(dob: date) -> int:
    today = datetime.now(timezone.utc).date()
    years = today.year - dob.year
    if (today.month, today.day) < (dob.month, dob.day):
        years -= 1
    return years


def patient_full_name(p: Patient) -> str:
    parts = [p.first_name, p.second_name, p.third_name, p.family_name]
    return " ".join(x.strip() for x in parts if x)


def relative_time(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    delta = now - dt
    secs = int(delta.total_seconds())
    if secs < 60:
        return "just now"
    if secs < 3600:
        m = secs // 60
        return f"{m} min ago" if m == 1 else f"{m} mins ago"
    if secs < 86400:
        h = secs // 3600
        return f"{h} hr ago" if h == 1 else f"{h} hrs ago"
    d = secs // 86400
    return f"{d} day ago" if d == 1 else f"{d} days ago"
