from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import CurrentUser
from app.models import ActivityLog, Provider
from app.schemas import ProviderCreate, ProviderListItem, ProviderDetail
from app.security import hash_password

router = APIRouter(prefix="/providers", tags=["providers"])


def _log_activity(db: Session, action: str, patient_name: str, provider_name: str) -> None:
    db.add(ActivityLog(action=action, patient_name=patient_name, provider_name=provider_name))


@router.get("", response_model=list[ProviderListItem])
def list_providers(
    _user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    q: str | None = Query(None),
    role: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
):
    query = db.query(Provider)
    if q:
        term = f"%{q.strip()}%"
        query = query.filter(or_(Provider.full_name.ilike(term), Provider.email.ilike(term)))
    if role and role != "all":
        query = query.filter(Provider.role == role)
    if status_filter and status_filter != "all":
        query = query.filter(Provider.status == status_filter)
    rows = query.order_by(Provider.id.desc()).all()
    return [
        ProviderListItem(
            id=r.id,
            name=r.full_name,
            role=r.role,
            specialty=r.specialty,
            phone=r.phone,
            license=r.license_number,
            status=r.status,
        )
        for r in rows
    ]


@router.get("/{provider_id}", response_model=ProviderDetail)
def get_provider(provider_id: int, _user: CurrentUser, db: Annotated[Session, Depends(get_db)]):
    p = db.query(Provider).filter(Provider.id == provider_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Provider not found")
    return ProviderDetail(
        id=p.id,
        full_name=p.full_name,
        email=p.email,
        phone=p.phone,
        gender=p.gender,
        dob=str(p.dob) if p.dob else None,
        address=p.address,
        role=p.role,
        specialty=p.specialty,
        license_number=p.license_number,
        department=p.department,
        status=p.status,
    )


@router.post("", status_code=status.HTTP_201_CREATED)
def create_provider(body: ProviderCreate, user: CurrentUser, db: Annotated[Session, Depends(get_db)]):
    if user.role != "E-Health Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can add providers")
    email = body.email.strip().lower()
    if db.query(Provider).filter(Provider.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    p = Provider(
        full_name=body.full_name.strip(),
        email=email,
        password_hash=hash_password(body.password),
        phone=body.phone,
        gender=body.gender,
        dob=body.dob,
        address=body.address,
        role=body.role,
        specialty=body.specialty,
        license_number=body.license_number.strip(),
        department=body.department,
        status=body.status,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    _log_activity(db, "Healthcare provider added", "—", user.full_name)
    db.commit()
    return {"id": p.id}


@router.put("/{provider_id}", status_code=status.HTTP_200_OK)
def update_provider(
    provider_id: int,
    body: ProviderCreate,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    if user.role != "E-Health Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can edit providers")
    p = db.query(Provider).filter(Provider.id == provider_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Provider not found")
    email = body.email.strip().lower()
    # Check email uniqueness excluding self
    existing = db.query(Provider).filter(Provider.email == email, Provider.id != provider_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already in use")
    p.full_name = body.full_name.strip()
    p.email = email
    if body.password:
        p.password_hash = hash_password(body.password)
    p.phone = body.phone
    p.gender = body.gender
    p.dob = body.dob
    p.address = body.address
    p.role = body.role
    p.specialty = body.specialty
    p.license_number = body.license_number.strip()
    p.department = body.department
    p.status = body.status
    db.commit()
    db.refresh(p)
    _log_activity(db, "Healthcare provider updated", "—", user.full_name)
    db.commit()
    return {"id": p.id}


@router.patch("/{provider_id}/deactivate", status_code=status.HTTP_200_OK)
def deactivate_provider(
    provider_id: int,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    if user.role != "E-Health Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can deactivate providers")
    p = db.query(Provider).filter(Provider.id == provider_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Provider not found")
    p.status = "Inactive"
    db.commit()
    _log_activity(db, "Healthcare provider deactivated", "—", user.full_name)
    db.commit()
    return {"id": p.id, "status": "Inactive"}


@router.delete("/{provider_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_provider(
    provider_id: int,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
):
    if user.role != "E-Health Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can delete providers")
    p = db.query(Provider).filter(Provider.id == provider_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Provider not found")
    if p.id == user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    _log_activity(db, "Healthcare provider deleted", "—", user.full_name)
    db.delete(p)
    db.commit()
