from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models import ActivityLog, ClinicalOrder, EmrSection, Patient, Provider, VitalSign
from app.security import hash_password


def seed_if_empty(db: Session) -> None:
    if db.query(Provider).first():
        return

    admin = Provider(
        full_name="Admin User",
        email="admin@healthprime.sa",
        password_hash=hash_password("admin123"),
        phone="+966 50 000 0001",
        gender="Male",
        role="E-Health Admin",
        specialty="Administration",
        license_number="ADM-00001",
        department="IT",
        status="Active",
    )
    dr_khalid = Provider(
        full_name="Dr. Khalid Al-Rashid",
        email="khalid.rashid@healthprime.sa",
        password_hash=hash_password("doctor123"),
        phone="+966 50 123 4567",
        gender="Male",
        role="Doctor",
        specialty="Family Medicine",
        license_number="SM-20456",
        department="Family Medicine",
        status="Active",
    )
    nurse_hala = Provider(
        full_name="Nurse Hala Al-Otaibi",
        email="hala.ot@healthprime.sa",
        password_hash=hash_password("nurse123"),
        phone="+966 54 345 6789",
        gender="Female",
        role="Nurse",
        specialty="General",
        license_number="NR-10234",
        department="Nursing",
        status="Active",
    )
    db.add_all([admin, dr_khalid, nurse_hala])
    db.commit()
    db.refresh(admin)
    db.refresh(dr_khalid)
    db.refresh(nurse_hala)

    p1 = Patient(
        first_name="Ahmed",
        second_name="Mohammed",
        third_name="Ibrahim",
        family_name="Al-Rashid",
        national_id="1098765432",
        gender="Male",
        dob=date(1985, 3, 12),
        phone="+966 50 111 2233",
        email="ahmed.rashid@example.com",
        blood_group="A+",
        nationality="Saudi",
        status="Registered",
        building_no="45",
        area="Al Olaya",
        city="Riyadh",
        state="Riyadh Region",
        country="Saudi Arabia",
        postcode="11564",
        alias_names="Abu Mohammed",
        employer="Saudi Aramco",
        disability="None",
        allergies="Penicillin",
        chronic_conditions="Hypertension, Type 2 Diabetes",
        attending_provider_id=dr_khalid.id,
        facility_name="Alraith Primary Healthcare Center",
    )
    p2 = Patient(
        first_name="Sara",
        second_name=None,
        third_name=None,
        family_name="Al-Otaibi",
        national_id="1087654321",
        gender="Female",
        dob=date(1990, 7, 22),
        phone="+966 55 222 3344",
        status="In Progress",
        city="Riyadh",
        country="Saudi Arabia",
    )
    db.add_all([p1, p2])
    db.commit()
    db.refresh(p1)

    for key, title, content in [
        (
            "cc",
            "Chief Complaints",
            "Patient reports persistent headache for 3 days, mild fever.",
        ),
        (
            "pi",
            "Present Illness",
            "Headache started 3 days ago, gradual onset, bilateral, throbbing. Associated with mild fever.",
        ),
        (
            "pmh",
            "Past Medical History",
            "Hypertension (diagnosed 2018), Type 2 Diabetes (diagnosed 2020).",
        ),
        (
            "fh",
            "Family History",
            "Father: Hypertension, Diabetes. Mother: Hypothyroidism.",
        ),
        (
            "mh",
            "Medication History",
            "Amlodipine 5mg OD, Metformin 500mg BD.",
        ),
        ("proc", "Procedures", "No procedures performed during this visit."),
    ]:
        db.add(EmrSection(patient_id=p1.id, section_key=key, title=title, content=content))

    today = date.today()
    for otype, desc, stat, d in [
        ("Lab", "CBC with Differential", "Pending", today),
        ("Lab", "HbA1c", "Pending", today),
        ("Imaging", "Chest X-Ray PA", "Completed", today - timedelta(days=3)),
        ("Medication", "Paracetamol 500mg PRN", "Active", today),
    ]:
        db.add(
            ClinicalOrder(
                patient_id=p1.id,
                order_type=otype,
                description=desc,
                status=stat,
                order_date=d,
            )
        )

    now = datetime.now(timezone.utc)
    vitals_rows = [
        VitalSign(
            patient_id=p1.id,
            provider_id=dr_khalid.id,
            recorded_at=now - timedelta(hours=2),
            temperature_c=36.8,
            heart_rate=72,
            systolic_bp=120,
            diastolic_bp=80,
            respiratory_rate=16,
            spo2=98,
            weight_kg=72.0,
        ),
        VitalSign(
            patient_id=p1.id,
            provider_id=nurse_hala.id,
            recorded_at=now - timedelta(days=1),
            temperature_c=37.0,
            heart_rate=68,
            systolic_bp=118,
            diastolic_bp=76,
            respiratory_rate=15,
            spo2=99,
            weight_kg=72.0,
        ),
    ]
    db.add_all(vitals_rows)

    db.add(
        ActivityLog(
            action="Vital signs recorded",
            patient_name="Ahmed Mohammed Al-Rashid",
            provider_name="Dr. Khalid Al-Rashid",
        )
    )
    db.add(
        ActivityLog(
            action="New patient registered",
            patient_name="Sara Al-Otaibi",
            provider_name="Nurse Hala Al-Otaibi",
        )
    )
    db.add(
        ActivityLog(
            action="Healthcare provider added",
            patient_name="—",
            provider_name="Admin User",
        )
    )

    db.commit()
