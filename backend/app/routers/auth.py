from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import CurrentUser
from app.models import Provider
from app.schemas import AuthResponse, LoginIn, UserOut, UserUpdate
from app.security import create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=AuthResponse)
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.query(Provider).filter(Provider.email == body.email.strip().lower()).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
        
    if not body.otp:
        return AuthResponse(requires_otp=True)
        
    if body.otp != "123456":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid OTP code")
        
    token = create_access_token(user.email)
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut(
            email=user.email, 
            full_name=user.full_name, 
            role=user.role, 
            avatar_url=user.avatar_url
        ),
    )


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser):
    return UserOut(
        email=user.email, 
        full_name=user.full_name, 
        role=user.role, 
        avatar_url=user.avatar_url
    )


@router.put("/me", response_model=UserOut)
def update_me(body: UserUpdate, user: CurrentUser, db: Session = Depends(get_db)):
    db_user = db.query(Provider).filter(Provider.id == user.id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if body.full_name is not None:
        db_user.full_name = body.full_name
    if body.avatar_url is not None:
        # If body.avatar_url is an empty string or null, we treat it as removing the picture
        db_user.avatar_url = body.avatar_url if body.avatar_url else None
        
    db.commit()
    db.refresh(db_user)
    return UserOut(
        email=db_user.email, 
        full_name=db_user.full_name, 
        role=db_user.role, 
        avatar_url=db_user.avatar_url
    )
