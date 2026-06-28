import random
import smtplib
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings

# In-memory store: email -> (otp_code, expires_at)
_otp_store: dict[str, tuple[str, float]] = {}

OTP_TTL_SECONDS = 300  # 5 minutes


def generate_otp(email: str) -> str:
    code = f"{random.randint(0, 999999):06d}"
    _otp_store[email.lower()] = (code, time.time() + OTP_TTL_SECONDS)
    return code


def verify_otp(email: str, code: str) -> bool:
    entry = _otp_store.get(email.lower())
    if not entry:
        return False
    stored_code, expires_at = entry
    if time.time() > expires_at:
        del _otp_store[email.lower()]
        return False
    if stored_code != code:
        return False
    del _otp_store[email.lower()]
    return True


def send_otp_email(to_email: str, code: str, full_name: str) -> None:
    if not settings.smtp_user or not settings.smtp_password:
        # Dev fallback: print to console
        print(f"\n[OTP] Code for {to_email}: {code}\n")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Your HealthPrime Login Code"
    msg["From"] = settings.smtp_from
    msg["To"] = to_email

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px">
      <h2 style="color:#16a34a;margin-bottom:4px">HealthPrime</h2>
      <p style="color:#6b7280;font-size:14px">Alraith Primary Healthcare Center</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
      <p>Hello <strong>{full_name}</strong>,</p>
      <p>Your one-time login code is:</p>
      <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#16a34a;text-align:center;padding:16px 0">
        {code}
      </div>
      <p style="color:#6b7280;font-size:13px">This code expires in 5 minutes. Do not share it with anyone.</p>
    </div>
    """

    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.smtp_user, settings.smtp_password)
        server.sendmail(settings.smtp_from, to_email, msg.as_string())
