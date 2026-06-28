from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, computed_field, Field
from pydantic.alias_generators import to_camel


class APIModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
        from_attributes=True,
    )


# --- Auth ---
class Token(APIModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(APIModel):
    email: str
    full_name: str
    role: str
    avatar_url: str | None = None
    totp_enabled: bool = False


class UserUpdate(APIModel):
    full_name: str | None = None
    avatar_url: str | None = None


class AuthResponse(APIModel):
    access_token: str | None = None
    token_type: str = "bearer"
    user: UserOut | None = None
    requires_otp: bool = False
    otp_method: str | None = None  # "email" or "totp"


class LoginIn(APIModel):
    email: str = Field(pattern=r"^[a-zA-Z0-9_.+-]+@healthprime\.sa$")
    password: str = Field(min_length=8)
    otp: str | None = None


class TotpSetupOut(APIModel):
    secret: str
    qr_uri: str


class TotpEnableIn(APIModel):
    code: str


# --- Patients ---
class PatientListItem(APIModel):
    id: int
    national_id: str
    name: str
    gender: str
    dob: date
    phone: str
    status: str


class PatientDetail(APIModel):
    id: int
    first_name: str
    second_name: str | None = None
    third_name: str | None = None
    family_name: str
    national_id: str
    gender: str
    dob: date
    phone: str
    email: str | None = None
    blood_group: str | None = None
    nationality: str | None = None
    status: str
    building_no: str | None = None
    area: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postcode: str | None = None
    alias_names: str | None = None
    employer: str | None = None
    disability: str | None = None
    allergies: str | None = None
    chronic_conditions: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    attending_provider_id: int | None = None
    facility_name: str | None = None

    @computed_field
    @property
    def age(self) -> int:
        today = date.today()
        years = today.year - self.dob.year
        if (today.month, today.day) < (self.dob.month, self.dob.day):
            years -= 1
        return years


class PatientCreate(APIModel):
    first_name: str
    second_name: str | None = None
    third_name: str | None = None
    family_name: str
    national_id: str
    gender: str
    dob: date
    phone: str
    email: str | None = None
    blood_group: str | None = None
    nationality: str | None = None
    status: str = "Registered"
    building_no: str | None = None
    area: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postcode: str | None = None
    alias_names: str | None = None
    employer: str | None = None
    disability: str | None = None
    allergies: str | None = None
    chronic_conditions: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None


# --- Providers ---
class ProviderListItem(APIModel):
    id: int
    name: str
    role: str
    specialty: str
    phone: str | None = None
    license: str
    status: str


class ProviderCreate(APIModel):
    full_name: str
    email: str = Field(pattern=r"^[a-zA-Z0-9_.+-]+@healthprime\.sa$")
    password: str = Field(default="", min_length=8)
    phone: str | None = None
    gender: str | None = None
    dob: date | None = None
    address: str | None = None
    role: str
    specialty: str
    license_number: str
    department: str | None = None
    status: str = "Active"


class ProviderDetail(APIModel):
    id: int
    full_name: str
    email: str
    phone: str | None = None
    gender: str | None = None
    dob: str | None = None
    address: str | None = None
    role: str
    specialty: str
    license_number: str
    department: str | None = None
    status: str


# --- Vitals ---
class VitalCreate(APIModel):
    patient_id: int
    temperature_c: float | None = None
    heart_rate: int | None = None
    systolic_bp: int | None = None
    diastolic_bp: int | None = None
    respiratory_rate: int | None = None
    spo2: int | None = None
    weight_kg: float | None = None
    height_cm: float | None = None
    bmi: float | None = None
    bsa: float | None = None
    map_bp: float | None = None
    smoking_status: str | None = None
    disability: str | None = None
    physical_activity: str | None = None
    notes: str | None = None


class VitalOut(APIModel):
    id: int
    patient_id: int
    recorded_at: datetime
    temperature_c: float | None = None
    heart_rate: int | None = None
    systolic_bp: int | None = None
    diastolic_bp: int | None = None
    respiratory_rate: int | None = None
    spo2: int | None = None
    weight_kg: float | None = None
    height_cm: float | None = None
    bmi: float | None = None
    bsa: float | None = None
    map_bp: float | None = None
    smoking_status: str | None = None
    disability: str | None = None
    physical_activity: str | None = None
    notes: str | None = None


class PatientVitalsContext(APIModel):
    patient_id: int
    full_name: str
    national_id: str
    gender: str
    age: int
    allergies_list: list[str]
    doctor_name: str | None = None
    facility: str | None = None
    visit_time: str | None = None
    bmi: str | None = None
    bp_display: str | None = None
    last_vitals: VitalOut | None = None


class ChartPoint(APIModel):
    date: str
    value: float | None = None
    systolic: int | None = None
    diastolic: int | None = None


class VitalsChartBundle(APIModel):
    temperature: list[ChartPoint]
    heart_rate: list[ChartPoint]
    respiratory_rate: list[ChartPoint]
    blood_pressure: list[ChartPoint]


class VitalsHistoryRow(APIModel):
    date: str
    time: str
    temp: str
    bp: str
    hr: str
    rr: str
    spo2: str
    weight: str
    height: str | None = None
    bmi: str | None = None
    recorded_by: str


# --- EMR ---
class EmrSectionOut(APIModel):
    id: int
    key: str
    title: str
    content: str
    date: str


class EmrSectionUpdate(APIModel):
    content: str


class ClinicalOrderOut(APIModel):
    id: int
    type: str
    description: str
    status: str
    date: str


class EmrVitalsSnapshot(APIModel):
    temp: str
    hr: str
    bp: str
    spo2: str
    rr: str


class EmrPatientBanner(APIModel):
    name: str
    national_id: str
    gender: str
    dob: str
    age: int
    doctor: str | None = None
    facility: str | None = None
    visit_time: str | None = None
    allergies: list[str]
    avatar_url: str | None = None
    vitals: EmrVitalsSnapshot


class EmrPageOut(APIModel):
    patient: EmrPatientBanner
    sections: list[EmrSectionOut]
    orders: list[ClinicalOrderOut]
    vitals_history: list[VitalsHistoryRow]


# --- Dashboard ---
class StatBlock(APIModel):
    title: str
    value: int
    description: str


class ActivityItem(APIModel):
    id: int
    action: str
    patient: str
    provider: str
    time: str


class DashboardOut(APIModel):
    stats: list[StatBlock]
    activity: list[ActivityItem]


# --- Appointments ---
class AppointmentCreate(APIModel):
    patient_id: int
    provider_id: int
    appointment_date: datetime
    reason: str
    notes: str | None = None
    department: str | None = None
    visit_type: str | None = None
    priority_level: str | None = None
    is_ai_generated: bool | None = False
    ai_explanation: str | None = None
    manual_slots_affected: str | None = None
    optimization_diffs: str | None = None
    status: str | None = "Scheduled"


class AppointmentOut(APIModel):
    id: int
    patient_id: int
    provider_id: int
    appointment_date: datetime
    reason: str
    status: str
    notes: str | None = None
    is_ai_generated: bool
    priority_level: str | None = None
    department: str | None = None
    visit_type: str | None = None
    ai_explanation: str | None = None
    manual_slots_affected: str | None = None
    optimization_diffs: str | None = None
    
    # Nested fields for UI convenience
    patient_name: str | None = None
    provider_name: str | None = None


class AppointmentGenerateSpec(APIModel):
    patient_id: int
    role: str
    specialty: str
    license_number: str
    department: str | None = None
    status: str


# --- Vitals ---
class VitalCreate(APIModel):
    patient_id: int
    temperature_c: float | None = None
    heart_rate: int | None = None
    systolic_bp: int | None = None
    diastolic_bp: int | None = None
    respiratory_rate: int | None = None
    spo2: int | None = None
    weight_kg: float | None = None
    height_cm: float | None = None
    bmi: float | None = None
    bsa: float | None = None
    map_bp: float | None = None
    smoking_status: str | None = None
    disability: str | None = None
    physical_activity: str | None = None
    notes: str | None = None


class VitalOut(APIModel):
    id: int
    patient_id: int
    recorded_at: datetime
    temperature_c: float | None = None
    heart_rate: int | None = None
    systolic_bp: int | None = None
    diastolic_bp: int | None = None
    respiratory_rate: int | None = None
    spo2: int | None = None
    weight_kg: float | None = None
    height_cm: float | None = None
    bmi: float | None = None
    bsa: float | None = None
    map_bp: float | None = None
    smoking_status: str | None = None
    disability: str | None = None
    physical_activity: str | None = None
    notes: str | None = None


class PatientVitalsContext(APIModel):
    patient_id: int
    full_name: str
    national_id: str
    gender: str
    age: int
    allergies_list: list[str]
    doctor_name: str | None = None
    facility: str | None = None
    visit_time: str | None = None
    bmi: str | None = None
    bp_display: str | None = None
    last_vitals: VitalOut | None = None


class ChartPoint(APIModel):
    date: str
    value: float | None = None
    systolic: int | None = None
    diastolic: int | None = None


class VitalsChartBundle(APIModel):
    temperature: list[ChartPoint]
    heart_rate: list[ChartPoint]
    respiratory_rate: list[ChartPoint]
    blood_pressure: list[ChartPoint]


class VitalsHistoryRow(APIModel):
    date: str
    time: str
    temp: str
    bp: str
    hr: str
    rr: str
    spo2: str
    weight: str
    height: str | None = None
    bmi: str | None = None
    recorded_by: str


class DiagnosisCreate(APIModel):
    icd_code: str
    icd_title: str
    notes: str | None = None
    is_ai_generated: bool = False
    status: str = "Active"

class DiagnosisUpdate(APIModel):
    status: str | None = None
    notes: str | None = None

class DiagnosisOut(APIModel):
    id: int
    patient_id: int
    icd_code: str
    icd_title: str
    notes: str | None = None
    is_ai_generated: bool
    status: str
    diagnosed_at: datetime


# --- EMR ---
class EmrSectionOut(APIModel):
    id: int
    key: str
    title: str
    content: str
    date: str


class EmrSectionUpdate(APIModel):
    content: str


class ClinicalOrderOut(APIModel):
    id: int
    type: str
    description: str
    status: str
    date: str


class EmrVitalsSnapshot(APIModel):
    temp: str
    hr: str
    bp: str
    spo2: str
    rr: str


class EmrPatientBanner(APIModel):
    name: str
    national_id: str
    gender: str
    dob: str
    age: int
    doctor: str | None = None
    facility: str | None = None
    visit_time: str | None = None
    allergies: list[str]
    avatar_url: str | None = None
    vitals: EmrVitalsSnapshot


class EmrPageOut(APIModel):
    patient: EmrPatientBanner
    sections: list[EmrSectionOut]
    orders: list[ClinicalOrderOut]
    vitals_history: list[VitalsHistoryRow]
    diagnoses: list[DiagnosisOut]


# --- Dashboard ---
class StatBlock(APIModel):
    title: str
    value: str
    description: str


class ActivityItem(APIModel):
    id: int
    action: str
    patient: str
    provider: str
    time: str


class DashboardOut(APIModel):
    stats: list[StatBlock]
    activity: list[ActivityItem]


# --- Appointments ---
class AppointmentCreate(APIModel):
    patient_id: int
    provider_id: int
    appointment_date: datetime
    reason: str
    notes: str | None = None
    department: str | None = None
    visit_type: str | None = None
    priority_level: str | None = None
    is_ai_generated: bool | None = False
    ai_explanation: str | None = None
    manual_slots_affected: str | None = None
    optimization_diffs: str | None = None
    status: str | None = "Scheduled"
    is_ai_generated: bool | None = None
    ai_explanation: str | None = None
    manual_slots_affected: str | None = None
    optimization_diffs: str | None = None
    status: str | None = None



class AppointmentOut(APIModel):
    id: int
    patient_id: int
    provider_id: int
    appointment_date: datetime
    reason: str
    status: str
    notes: str | None = None
    is_ai_generated: bool
    priority_level: str | None = None
    department: str | None = None
    visit_type: str | None = None
    ai_explanation: str | None = None
    manual_slots_affected: str | None = None
    optimization_diffs: str | None = None
    
    # Nested fields for UI convenience
    patient_name: str | None = None
    provider_name: str | None = None


class AppointmentGenerateSpec(APIModel):
    patient_id: int
    reason: str
    appointment_id: int | None = None
    preferred_date_range: list[datetime] | None = None


# --- AI Optimization ---
class OptimizationRequest(APIModel):
    patient_id: int
    provider_id: int | None = None
    appointment_date: str | None = None
    time_str: str | None = None
    reason: str
    department: str | None = None
    visit_type: str | None = None
    priority_level: str | None = None
    utc_datetime: str | None = None

class OptimizationDiffField(APIModel):
    field: str
    staff_entry: str | None = None
    ai_suggestion: str | None = None
    flag: bool = False
    reasoning: str | None = None

class OptimizationReview(APIModel):
    diffs: list[OptimizationDiffField]
    validation_errors: list[str] | None = None
    ai_skipped: bool = False
    ai_explanation: str | None = None

class AIAgentFlag(APIModel):
    type: str
    severity: str
    current: str | None = None
    suggested: str | None = None
    explanation: str

class AIAgentResponse(APIModel):
    visit_type: str | None = None
    emergency_route: bool = False
    final_priority: str | None = None
    priority_action: str | None = None
    recommended_provider: str | None = None
    provider_action: str | None = None
    flags: list[AIAgentFlag] = Field(default_factory=list)
    nurse_summary: str | None = None


class AppointmentStatusUpdate(APIModel):
    status: str

