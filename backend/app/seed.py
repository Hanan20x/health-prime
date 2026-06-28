from __future__ import annotations

import os
from sqlalchemy.orm import Session

from app.models import Provider
from app.security import hash_password


def seed_if_empty(db: Session) -> None:
    """Create the initial E-Health Admin account if no providers exist yet."""
    if db.query(Provider).first():
        return

    admin_password = os.environ.get("ADMIN_PASSWORD", "ChangeMe123!")
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@healthprime.sa")

    admin = Provider(
        full_name="Admin User",
        email=admin_email,
        password_hash=hash_password(admin_password),
        phone="",
        gender="Male",
        role="E-Health Admin",
        specialty="Administration",
        license_number="ADM-00001",
        department="IT",
        status="Active",
    )
    db.add(admin)
    db.commit()

    print(f"\n[HealthPrime] Initial admin account created.")
    print(f"  Email   : {admin_email}")
    print(f"  Password: {admin_password}")
    print("  Please log in and change this password immediately.\n")
