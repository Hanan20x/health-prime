export interface UserOut {
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  accessToken?: string | null;
  tokenType: string;
  user?: { email: string; fullName: string; role: string; avatarUrl?: string } | null;
  requiresOtp?: boolean;
}

export interface PatientListItem {
  id: number;
  nationalId: string;
  name: string;
  gender: string;
  dob: string;
  phone: string;
  status: string;
}

export interface PatientDetail {
  id: number;
  firstName: string;
  secondName?: string | null;
  thirdName?: string | null;
  familyName: string;
  nationalId: string;
  gender: string;
  dob: string;
  phone: string;
  email?: string | null;
  bloodGroup?: string | null;
  nationality?: string | null;
  status: string;
  buildingNo?: string | null;
  area?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postcode?: string | null;
  aliasNames?: string | null;
  employer?: string | null;
  disability?: string | null;
  allergies?: string | null;
  chronicConditions?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  age: number;
}

export interface ProviderListItem {
  id: number;
  name: string;
  role: string;
  specialty: string;
  phone?: string | null;
  license: string;
  status: string;
}

export interface ProviderDetail {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  gender?: string | null;
  dob?: string | null;
  address?: string | null;
  role: string;
  specialty: string;
  licenseNumber: string;
  department?: string | null;
  status: string;
}

export interface DashboardSummary {
  stats: { title: string; value: string | number; description: string }[];
  activity: { id: number; action: string; patient: string; provider: string; time: string }[];
}

export interface VitalOut {
  id: number;
  patientId: number;
  recordedAt: string;
  temperatureC?: number | null;
  heartRate?: number | null;
  systolicBp?: number | null;
  diastolicBp?: number | null;
  respiratoryRate?: number | null;
  spo2?: number | null;
  weightKg?: number | null;
  notes?: string | null;
}

export interface PatientVitalsContext {
  patientId: number;
  fullName: string;
  nationalId: string;
  gender: string;
  age: number;
  allergiesList: string[];
  doctorName?: string | null;
  facility?: string | null;
  visitTime?: string | null;
  bmi?: string | null;
  bpDisplay?: string | null;
}

export interface VitalsChartBundle {
  temperature: { date: string; value?: number | null }[];
  heartRate: { date: string; value?: number | null }[];
  respiratoryRate: { date: string; value?: number | null }[];
  bloodPressure: { date: string; systolic?: number | null; diastolic?: number | null }[];
}

export interface VitalsHistoryRow {
  date: string;
  time: string;
  temp: string;
  bp: string;
  hr: string;
  rr: string;
  spo2: string;
  weight: string;
  height: string;
  bmi: string;
  recordedBy: string;
}

export interface Diagnosis {
  id: number;
  patientId: number;
  icdCode: string;
  icdTitle: string;
  notes?: string | null;
  isAiGenerated: boolean;
  status: string;
  diagnosedAt: string;
}

export interface EmrPage {
  patient: {
    name: string;
    nationalId: string;
    gender: string;
    dob: string;
    age: number;
    doctor?: string | null;
    facility?: string | null;
    visitTime?: string | null;
    allergies: string[];
    avatarUrl?: string | null;
    vitals: { temp: string; hr: string; bp: string; spo2: string; rr: string };
  };
  sections: { id: string; title: string; content: string }[];
  orders: { id: number; type: string; description: string; status: string; date: string }[];
  vitalsHistory: VitalsHistoryRow[];
  diagnoses: Diagnosis[];
}
