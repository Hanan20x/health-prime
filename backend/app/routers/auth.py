import pyotp
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

_email_executor = ThreadPoolExecutor(max_workers=2)

from app.database import get_db
from app.deps import CurrentUser
from app.models import Provider
from app.otp import generate_otp, send_otp_email, verify_otp
from app.schemas import AuthResponse, LoginIn, TotpEnableIn, TotpSetupOut, UserOut, UserUpdate
from app.security import create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=AuthResponse)
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.query(Provider).filter(Provider.email == body.email.strip().lower()).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not body.otp:
        # Step 1: credentials valid — determine OTP method
        if user.totp_enabled and user.totp_secret:
            # User has authenticator app set up — no email needed
            return AuthResponse(requires_otp=True, otp_method="totp")
        else:
            # Send email OTP
            code = generate_otp(user.email)
            _email_executor.submit(send_otp_email, user.email, code, user.full_name)
            return AuthResponse(requires_otp=True, otp_method="email")

    # Step 2: verify OTP
    if user.totp_enabled and user.totp_secret:
        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(body.otp, valid_window=1):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authenticator code")
    else:
        if not verify_otp(user.email, body.otp):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired OTP code")

    token = create_access_token(user.email)
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut(
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            avatar_url=user.avatar_url,
            totp_enabled=user.totp_enabled,
        ),
    )


@router.get("/totp/setup", response_model=TotpSetupOut)
def totp_setup(user: CurrentUser, db: Session = Depends(get_db)):
    """Generate a new TOTP secret and return the QR URI for the authenticator app."""
    db_user = db.query(Provider).filter(Provider.id == user.id).first()
    secret = pyotp.random_base32()
    db_user.totp_secret = secret
    db_user.totp_enabled = False  # not enabled until verified
    db.commit()
    qr_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=user.email, issuer_name="HealthPrime"
    )
    return TotpSetupOut(secret=secret, qr_uri=qr_uri)


@router.post("/totp/enable")
def totp_enable(body: TotpEnableIn, user: CurrentUser, db: Session = Depends(get_db)):
    """Verify the first code from the authenticator app and mark TOTP as enabled."""
    db_user = db.query(Provider).filter(Provider.id == user.id).first()
    if not db_user.totp_secret:
        raise HTTPException(status_code=400, detail="Run setup first")
    totp = pyotp.TOTP(db_user.totp_secret)
    if not totp.verify(body.code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid code — try again")
    db_user.totp_enabled = True
    db.commit()
    return {"message": "Authenticator app enabled"}


@router.post("/totp/disable")
def totp_disable(user: CurrentUser, db: Session = Depends(get_db)):
    """Disable TOTP and revert to email OTP."""
    db_user = db.query(Provider).filter(Provider.id == user.id).first()
    db_user.totp_secret = None
    db_user.totp_enabled = False
    db.commit()
    return {"message": "Authenticator app disabled"}


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser):
    return UserOut(
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        avatar_url=user.avatar_url,
        totp_enabled=user.totp_enabled,
    )


@router.put("/me", response_model=UserOut)
def update_me(body: UserUpdate, user: CurrentUser, db: Session = Depends(get_db)):
    db_user = db.query(Provider).filter(Provider.id == user.id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if body.full_name is not None:
        db_user.full_name = body.full_name
    if body.avatar_url is not None:
        db_user.avatar_url = body.avatar_url if body.avatar_url else None
    db.commit()
    db.refresh(db_user)
    return UserOut(
        email=db_user.email,
        full_name=db_user.full_name,
        role=db_user.role,
        avatar_url=db_user.avatar_url,
        totp_enabled=db_user.totp_enabled,
    )
