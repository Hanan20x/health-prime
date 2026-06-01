// Centralised translation strings
export type Lang = "en" | "ar";

export const t = {
  appTitle: { en: "Health Prime", ar: "مركز الرعاية الصحية الأولية بمحافظة الريث" },

  // Navigation
  dashboard: { en: "Dashboard", ar: "لوحة التحكم" },
  healthcareProviders: { en: "Healthcare Providers", ar: "مقدمو الرعاية الصحية" },
  patients: { en: "Patients", ar: "المرضى" },
  patientEMR: { en: "Patient EMR", ar: "السجل الطبي الإلكتروني" },
  recordVitals: { en: "Record Vitals", ar: "تسجيل العلامات الحيوية" },
  vitalCharts: { en: "Vital Charts", ar: "مخططات العلامات الحيوية" },
  logout: { en: "Logout", ar: "تسجيل الخروج" },
  myProfile: { en: "My Profile", ar: "ملفي الشخصي" },
  appointments: { en: "Appointments", ar: "المواعيد" },
  bookAppointment: { en: "Book Appointment", ar: "حجز موعد" },
  generateAISlot: { en: "Generate AI Optimized Slot", ar: "إنشاء موعد محسن بالذكاء الاصطناعي" },
  appointmentReason: { en: "Reason for appointment", ar: "سبب الموعد" },
  appointmentsList: { en: "Appointments List", ar: "قائمة المواعيد" },
  howAiWorks: { en: "How AI Agents Works", ar: "كيف تعمل وكلاء الذكاء الاصطناعي" },
  howAiWorksDesc: { en: "An overview of our AI-powered ecosystem", ar: "نظرة عامة على نظامنا المعتمد على الذكاء الاصطناعي" },
  staffSchedule: { en: "Healthcare Providers Schedule", ar: "جدول مقدمي الرعاية الصحية" },
  // Common
  save: { en: "Save", ar: "حفظ" },
  cancel: { en: "Cancel", ar: "إلغاء" },
  edit: { en: "Edit", ar: "تعديل" },
  delete: { en: "Delete", ar: "حذف" },
  view: { en: "View", ar: "عرض" },
  confirmDelete: { en: "Confirm Delete", ar: "تأكيد الحذف" },
  actions: { en: "Actions", ar: "الإجراءات" },
  search: { en: "Search", ar: "بحث" },
  addNew: { en: "Add New", ar: "إضافة جديد" },
  loading: { en: "Loading…", ar: "جار التحميل…" },
  noData: { en: "No data found", ar: "لا توجد بيانات" },
  status: { en: "Status", ar: "الحالة" },
  name: { en: "Name", ar: "الاسم" },
  role: { en: "Role", ar: "الدور" },
  specialty: { en: "Specialty", ar: "التخصص" },
  phone: { en: "Phone", ar: "الهاتف" },
  license: { en: "License #", ar: "رقم الترخيص" },
  allRoles: { en: "All Roles", ar: "جميع الأدوار" },
  allStatuses: { en: "All Statuses", ar: "جميع الحالات" },
  previous: { en: "Previous", ar: "السابق" },
  next: { en: "Next", ar: "التالي" },
  page: { en: "Page", ar: "الصفحة" },
  of: { en: "of", ar: "من" },
  saving: { en: "Saving…", ar: "جار الحفظ…" },
  requiredField: { en: "is missing.", ar: "مفقود." },
  completeFields: { en: "Please complete required fields:", ar: "يرجى إكمال الحقول المطلوبة:" },
  emailDomainError: { en: "Email must end with @healthprime.sa", ar: "يجب أن يكون البريد الإلكتروني بنطاق @healthprime.sa" },
  passwordTooShort: { en: "Password must be at least 8 characters long.", ar: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل." },

  // Roles & Specialties
  doctor: { en: "Doctor", ar: "طبيب" },
  nurse: { en: "Nurse", ar: "ممرض/ة" },
  admin: { en: "E-Health Admin", ar: "مدير النظام" },
  familyMedicine: { en: "Family Medicine", ar: "طب الأسرة" },
  internalMedicine: { en: "Internal Medicine", ar: "الطب الباطني" },
  pediatrics: { en: "Pediatrics", ar: "طب الأطفال" },
  emergency: { en: "Emergency", ar: "الطوارئ" },
  general: { en: "General", ar: "عام" },
  administration: { en: "Administration", ar: "إدارة" },
  it: { en: "IT", ar: "تقنية المعلومات" },

  // Gender & Status
  male: { en: "Male", ar: "ذكر" },
  female: { en: "Female", ar: "أنثى" },
  selectGender: { en: "Select gender", ar: "اختر الجنس" },
  selectRole: { en: "Select role", ar: "اختر الدور" },
  selectSpecialty: { en: "Select specialty", ar: "اختر التخصص" },
  registered: { en: "Registered", ar: "مسجل" },
  inProgress: { en: "In Progress", ar: "قيد المعالجة" },
  discharged: { en: "Discharged", ar: "خروج" },

  // Placeholders
  enterFullName: { en: "Enter full name", ar: "أدخل الاسم الكامل" },
  leaveBlank: { en: "Leave blank to keep unchanged", ar: "اتركه فارغاً لعدم التغيير" },
  setInitialPassword: { en: "Set initial password", ar: "كلمة المرور الأولية" },
  enterAddress: { en: "Enter address", ar: "أدخل العنوان" },
  enterDepartment: { en: "Enter department", ar: "أدخل القسم" },

  // Landing Page
  secureAccess: { en: "Secure Access", ar: "دخول آمن" },
  secureAccessDesc: { en: "Role-based access for admins, doctors, and nurses.", ar: "وصول مبني على الصلاحيات للمدراء والأطباء والممرضين." },
  medicalRecords: { en: "Medical Records", ar: "سجلات طبية" },
  medicalRecordsDesc: { en: "Electronic medical records and vital signs tracking.", ar: "سجلات طبية إلكترونية وتتبع العلامات الحيوية." },
  providerManagement: { en: "Healthcare Provider Management", ar: "إدارة مقدمي الرعاية" },
  providerManagementDesc: { en: "Manage healthcare providers and patient registrations.", ar: "إدارة تسجيل المرضى ومقدمي الرعاية الصحية." },
  ministryOfHealth: { en: "Ministry of Health — Kingdom of Saudi Arabia", ar: "وزارة الصحة — المملكة العربية السعودية" },
  officialPartner: { en: "Official partner for primary healthcare systems", ar: "شريك نظام الرعاية الصحية الأولية الرسمي" },
  welcomeTo: { en: "Welcome to", ar: "مرحباً بكم في" },
  unifiedPlatform: { en: "A unified platform for patient and staff management", ar: "واجهة موحدة لإدارة المرضى والموظفين" },
  secureSystem: { en: "A secure, efficient, and intelligent health information system", ar: "نظام معلومات صحي آمن وفعال وذكي" },

  // Patients list
  managePatientsDesc: { en: "Manage Patients Records and Registeration", ar: "إدارة سجلات وتسجيل المرضى" },
  addPatient: { en: "Add Patient", ar: "إضافة مريض" },
  editPatient: { en: "Edit Patient", ar: "تعديل بيانات المريض" },
  fullName: { en: "Full Name", ar: "الاسم الكامل" },
  nationalId: { en: "National ID", ar: "رقم الهوية" },
  gender: { en: "Gender", ar: "الجنس" },
  dateOfBirth: { en: "Date of Birth", ar: "تاريخ الميلاد" },
  searchPatientsPlaceholder: { en: "Search by name, National ID, or phone…", ar: "ابحث بالاسم أو رقم الهوية أو الهاتف…" },
  noPatients: { en: "No patients found", ar: "لا يوجد مرضى" },
  failedLoadPatients: { en: "Failed to load patients.", ar: "فشل تحميل المرضى." },
  deletePatientConfirm: { en: "Are you sure you want to delete this patient? This action cannot be undone.", ar: "هل أنت متأكد من حذف هذا المريض؟ لا يمكن التراجع عن هذا الإجراء." },
  patientDeleted: { en: "Patient deleted successfully.", ar: "تم حذف المريض بنجاح." },

  // Providers list
  manageProvidersDesc: { en: "Manage Healthcare Provider Records and Registeration", ar: "إدارة سجلات وتسجيل مزودي الرعاية الصحية" },
  addProvider: { en: "Add Healthcare Provider", ar: "إضافة مزود رعاية صحية" },
  editProvider: { en: "Edit Healthcare Provider", ar: "تعديل بيانات مزود الرعاية" },
  searchProvidersPlaceholder: { en: "Search by name…", ar: "ابحث بالاسم…" },
  noProviders: { en: "No healthcare providers found", ar: "لا يوجد مزودو رعاية صحية" },
  failedLoadProviders: { en: "Failed to load providers.", ar: "فشل تحميل مزودي الرعاية." },
  deleteProviderConfirm: { en: "Are you sure you want to delete this provider? This action cannot be undone.", ar: "هل أنت متأكد من حذف هذا المزود؟ لا يمكن التراجع عن هذا الإجراء." },
  providerDeleted: { en: "Healthcare provider deleted successfully.", ar: "تم حذف مزود الرعاية الصحية بنجاح." },
  deactivate: { en: "Deactivate", ar: "إلغاء التفعيل" },

  // Dashboard
  welcomeBack: { en: "Welcome back", ar: "مرحباً بعودتك" },
  quickActions: { en: "Quick Actions", ar: "الإجراءات السريعة" },
  recentActivity: { en: "Recent Activity", ar: "النشاط الأخير" },
  dashboardDescription: {
    en: "Here's an overview of activity at Alraith Primary Healthcare Center.",
    ar: "نظرة عامة على نشاط مركز الريث للرعاية الصحية الأولية.",
  },
  viewCharts: { en: "View Charts", ar: "عرض المخططات" },
  couldNotLoad: { en: "Could not load dashboard. Is the API running?", ar: "تعذّر تحميل لوحة التحكم. هل الخادم يعمل؟" },

  // Patient form
  addPatientTitle: { en: "Add Patient", ar: "إضافة مريض" },
  addPatientDescription: { en: "Register a new patient record.", ar: "تسجيل سجل مريض جديد." },
  personalInformation: { en: "Personal Information", ar: "المعلومات الشخصية" },
  firstName: { en: "First Name", ar: "الاسم الأول" },
  secondName: { en: "Second Name", ar: "الاسم الثاني" },
  thirdName: { en: "Third Name", ar: "الاسم الثالث" },
  familyName: { en: "Fourth Name (Family)", ar: "الاسم الرابع (العائلة)" },
  nationality: { en: "Nationality", ar: "الجنسية" },
  email: { en: "Email", ar: "البريد الإلكتروني" },
  bloodGroup: { en: "Blood Group", ar: "فصيلة الدم" },
  address: { en: "Address", ar: "العنوان" },
  buildingNo: { en: "Building No", ar: "رقم المبنى" },
  area: { en: "Area", ar: "المنطقة" },
  city: { en: "City", ar: "المدينة" },
  state: { en: "State", ar: "المحافظة" },
  country: { en: "Country", ar: "الدولة" },
  postcode: { en: "Postcode", ar: "الرمز البريدي" },
  additionalInformation: { en: "Additional Information", ar: "معلومات إضافية" },
  aliasNames: { en: "Alias Names", ar: "الأسماء المستعارة" },
  employer: { en: "Employer", ar: "جهة العمل" },
  disability: { en: "Disability", ar: "الإعاقة" },
  medicalInformation: { en: "Medical Information", ar: "المعلومات الطبية" },
  allergies: { en: "Allergies", ar: "الحساسية" },
  chronicConditions: { en: "Chronic Conditions", ar: "الأمراض المزمنة" },
  emergencyContact: { en: "Emergency Contact", ar: "جهة الاتصال في حالات الطوارئ" },
  contactName: { en: "Contact Name", ar: "اسم جهة الاتصال" },
  contactPhone: { en: "Contact Phone", ar: "هاتف جهة الاتصال" },
  savePatient: { en: "Save Patient", ar: "حفظ المريض" },
  successPatient: { en: "Patient registered successfully.", ar: "تم تسجيل المريض بنجاح." },
  successPatientEdit: { en: "Patient information updated successfully.", ar: "تم تحديث معلومات المريض بنجاح." },

  // Provider form
  addProviderTitle: { en: "Add Healthcare Provider", ar: "إضافة مزود رعاية صحية" },
  addProviderDescription: { en: "Register a new healthcare provider.", ar: "تسجيل مزود رعاية صحية جديد." },
  password: { en: "Password", ar: "كلمة المرور" },
  dateOfBirthShort: { en: "Date of Birth", ar: "تاريخ الميلاد" },
  professionalInformation: { en: "Professional Information", ar: "المعلومات المهنية" },
  licenseNumber: { en: "License Number", ar: "رقم الترخيص" },
  department: { en: "Department", ar: "القسم" },
  saveProvider: { en: "Save Healthcare Provider", ar: "حفظ مزود الرعاية" },
  successProvider: { en: "Healthcare provider registered successfully.", ar: "تم تسجيل مزود الرعاية الصحية بنجاح." },
  successProviderEdit: { en: "Healthcare provider updated successfully.", ar: "تم تحديث مزود الرعاية الصحية بنجاح." },

  // Profile
  profileTitle: { en: "My Profile", ar: "ملفي الشخصي" },
  profileDescription: { en: "View and manage your account information.", ar: "عرض وإدارة معلومات حسابك." },
  editingComingSoon: { en: "Profile editing coming soon", ar: "تعديل الملف الشخصي قريباً" },
  updateProfile: { en: "Update Profile", ar: "تحديث الملف الشخصي" },
  profileUpdated: { en: "Profile updated successfully.", ar: "تم تحديث الملف الشخصي بنجاح." },
  uploadPicture: { en: "Upload Picture", ar: "رفع صورة" },
  changePicture: { en: "Change Picture", ar: "تغيير الصورة" },
  removePicture: { en: "Remove Picture", ar: "حذف الصورة" },

  // Login
  signIn: { en: "Sign In", ar: "تسجيل الدخول" },
  enterCredentials: { en: "Enter your credentials to access the system", ar: "أدخل بياناتك للوصول إلى النظام" },
  emailAddress: { en: "Email Address", ar: "البريد الإلكتروني" },
  enterPassword: { en: "Enter your password", ar: "أدخل كلمة المرور" },
  loginFailed: { en: "Login failed", ar: "فشل تسجيل الدخول" },
  signingIn: { en: "Signing in…", ar: "جار تسجيل الدخول…" },
  signedInSuccess: { en: "Signed in successfully.", ar: "تم تسجيل الدخول بنجاح." },
  enterBothFields: { en: "Please enter both email and password.", ar: "يرجى إدخال البريد الإلكتروني وكلمة المرور." },
  enterOTP: { en: "Enter OTP code sent to your email", ar: "أدخل رمز التحقق المرسل لبريدك" },
  otpDemo: { en: "Use OTP 123456 as demo", ar: "استخدم الرمز 123456 للتجربة" },
  verifying: { en: "Verifying...", ar: "جاري التحقق..." },
  verifyOTP: { en: "Verify OTP", ar: "تحقق من الرمز" },

  // Patient details
  patientDetails: { en: "Patient Details", ar: "تفاصيل المريض" },
  openEMR: { en: "Open EMR", ar: "فتح السجل الطبي" },
  backToPatients: { en: "Back to patients", ar: "العودة للمرضى" },
  patientStatus: { en: "Patient Status:", ar: "حالة المريض:" },
  reportsDocuments: { en: "Reports & Documents", ar: "التقارير والوثائق" },
  patientDocuments: { en: "Patient Documents", ar: "وثائق المريض" },
  noDocuments: { en: "No documents uploaded", ar: "لم يتم رفع وثائق" },
  diagnosticReports: { en: "Diagnostic Reports", ar: "التقارير التشخيصية" },
  noReports: { en: "No reports available", ar: "لا تتوفر تقارير" },
  age: { en: "Age", ar: "العمر" },
  years: { en: "years", ar: "سنوات" },

  // Record Vitals
  patient: { en: "Patient", ar: "المريض" },
  selectPatient: { en: "Select Patient", ar: "اختر مريضاً" },
  observation: { en: "Observation", ar: "المراقبة" },
  tabularView: { en: "Tabular View", ar: "عرض جدولي" },
  charts: { en: "Charts", ar: "المخططات" },
  generalVitalSigns: { en: "General Vital Signs", ar: "العلامات الحيوية العامة" },
  temperature: { en: "Temperature (°C)", ar: "الحرارة (°م)" },
  pulseRate: { en: "Pulse Rate (bpm)", ar: "معدل النبض (ن/د)" },
  respiratoryRate: { en: "Respiratory Rate (/min)", ar: "معدل التنفس (م/د)" },
  spo2: { en: "SpO2 (%)", ar: "تشبع الأكسجين (%)" },
  systolicBP: { en: "Systolic BP (mmHg)", ar: "ضغط الدم الانقباضي (ملمز)" },
  diastolicBP: { en: "Diastolic BP (mmHg)", ar: "ضغط الدم الانبساطي (ملمز)" },
  systolic: { en: "Systolic", ar: "الانقباضي" },
  diastolic: { en: "Diastolic", ar: "الانبساطي" },
  weight: { en: "Weight (kg)", ar: "الوزن (كجم)" },
  height: { en: "Height (cm)", ar: "الطول (سم)" },
  notes: { en: "Notes", ar: "ملاحظات" },
  vitalsHistory: { en: "Vitals History — Tabular View", ar: "سجل العلامات الحيوية — عرض جدولي" },
  date: { en: "Date", ar: "التاريخ" },
  time: { en: "Time", ar: "الوقت" },
  temp: { en: "Temp", ar: "الحرارة" },
  bp: { en: "BP", ar: "ضغط الدم" },
  hr: { en: "HR", ar: "النبض" },
  rr: { en: "RR", ar: "التنفس" },
  noVitalsRecorded: { en: "No vitals recorded yet.", ar: "لم يتم تسجيل علامات حيوية بعد." },
  openVitalCharts: { en: "Open Vital Charts", ar: "فتح مخططات العلامات الحيوية" },
  saveVitals: { en: "Save", ar: "حفظ" },
  savedVitals: { en: "Vital signs saved successfully.", ar: "تم حفظ العلامات الحيوية بنجاح." },
  selectPatientError: { en: "Select a patient.", ar: "يرجى اختيار مريض." },
  
  // Vitals refined UI
  assessment: { en: "Assessment", ar: "التقييم" },
  history: { en: "History", ar: "السجل" },
  analytics: { en: "Analytics", ar: "التحليلات" },
  recentPatients: { en: "Recent Patients", ar: "المرضى مؤخراً" },
  physicalMetrics: { en: "Physical Metrics", ar: "المقاييس البدنية" },
  coreVitals: { en: "Core Vitals", ar: "العلامات الحيوية الأساسية" },
  medicalObservations: { en: "Medical Observations", ar: "الملاحظات الطبية" },
  enterFindings: { en: "Enter findings...", ar: "أدخل النتائج..." },
  saveRecord: { en: "Save Record", ar: "حفظ السجل" },
  discard: { en: "Discard", ar: "إلغاء" },
  calculations: { en: "Calculations", ar: "الحسابات" },
  bmiIndicator: { en: "BMI Indicator", ar: "مؤشر كتلة الجسم" },
  standardMAP: { en: "Standard MAP", ar: "متوسط الضغط الشرياني" },
  patientAlerts: { en: "Patient Alerts", ar: "تنبيهات المريض" },
  addAlert: { en: "Add alert...", ar: "إضافة تنبيه..." },
  medicalRegistry: { en: "Medical Registry", ar: "السجل الطبي" },
  searchRegistry: { en: "Search Registry...", ar: "البحث في السجل..." },
  medicalTime: { en: "Medical Time", ar: "الوقت الطبي" },
  attendingNurse: { en: "Attending Nurse", ar: "الممرضة المسؤولة" },
  noHistoryFound: { en: "No history found for this patient", ar: "لم يتم العثور على سجل لهذا المريض" },
  emrPortal: { en: "Electronic Medical Record Portal", ar: "بوابة السجل الطبي الإلكتروني" },

  // Dashboard stats
  activeStaff: { en: "Active Staff", ar: "الموظفون النشطون" },
  todaysVitals: { en: "Today's Vitals", ar: "العلامات الحيوية لليوم" },
  totalPatients: { en: "Total Patients", ar: "إجمالي المرضى" },
  totalHealthcareProviders: { en: "Total Healthcare Providers", ar: "إجمالي مقدمي الرعاية الصحية" },
  providersMarkedActive: { en: "Providers marked active", ar: "مقدمو الرعاية المفعلون" },
  recordedToday: { en: "Recorded today", ar: "مسجل اليوم" },
  allTimeRegistrations: { en: "All time registrations", ar: "جميع التسجيلات" },
  registeredInSystem: { en: "Registered in system", ar: "مسجلون في النظام" },
  vitalSignsRecorded: { en: "Vital signs recorded", ar: "تم تسجيل العلامات الحيوية" },
  patient: { en: "Patient", ar: "المريض" },
  by: { en: "By", ar: "بواسطة" },

  // Access
  accessDenied: { en: "Access Denied", ar: "الوصول مرفوض" },
  noPermission: {
    en: "You don't have permission to access this page.",
    ar: "ليس لديك صلاحية الوصول لهذه الصفحة.",
  },
  
  // Roles
  staff: { en: "Staff", ar: "موظف/ة" },

  // Activity Actions
  providerAdded: { en: "Healthcare provider added", ar: "تم إضافة مقدم رعاية" },
  providerUpdated: { en: "Healthcare provider updated", ar: "تم تحديث بيانات مقدم الرعاية" },
  providerDeleted: { en: "Healthcare provider deleted", ar: "تم حذف مقدم الرعاية" },
  vitalsRecorded: { en: "Vital signs recorded", ar: "تم تسجيل العلامات الحيوية" },
  patientRegistered: { en: "New patient registered", ar: "تم تسجيل مريض جديد" },
  patientUpdated: { en: "Patient updated", ar: "تم تحديث بيانات المريض" },
  by: { en: "by", ar: "بواسطة" },

  // EMR Sections
  chiefComplaints: { en: "Chief Complaints", ar: "الشكوى الرئيسية" },
  presentIllness: { en: "Present Illness", ar: "التاريخ المرضي الحالي" },
  pastMedicalHistory: { en: "Past Medical/Surgical History", ar: "التاريخ الطبي/الجراحي السابق" },
  gynaeHistory: { en: "Gynecological and Obstetrical History", ar: "تاريخ أمراض النساء والولادة" },
  familyHistory: { en: "Family History", ar: "التاريخ العائلي" },
  surgicalProcedure: { en: "Surgical / Medical Procedure", ar: "الإجراء الجراحي / الطبي" },
  medicationHistory: { en: "Medication History", ar: "تاريخ الأدوية" },
  socialHistory: { en: "Personal/Social History", ar: "التاريخ الشخصي والاجتماعي" },
  developmentalHistory: { en: "Developmental History", ar: "التاريخ التنموي" },
  physicalExamination: { en: "Physical Examination", ar: "الفحص البدني" },
  obHistory: { en: "OB History", ar: "تاريخ الولادة" },
  doctorNotes: { en: "Doctor Notes", ar: "ملاحظات الطبيب" },
  doctorRecommendation: { en: "Doctor Recommendation and Advice", ar: "توصية ونصيحة الطبيب" },
  planOfCare: { en: "Plan of Care", ar: "خطة الرعاية" },

  // EMR UI
  printHistory: { en: "Print History", ar: "طباعة السجل" },
  closeChart: { en: "Close Chart", ar: "إغلاق الملف" },
  safetyAlert: { en: "Safety Alert", ar: "تنبيه سلامة" },
  vitalsMonitoring: { en: "Vital Signs Monitoring", ar: "مراقبة العلامات الحيوية" },
  timestamp: { en: "Timestamp", ar: "الوقت" },
  newLogEntry: { en: "New Log Entry", ar: "إضافة سجل جديد" },
  signAndSave: { en: "Sign & Save", ar: "توقيع وحفظ" },
  clinicalHistory: { en: "Medical Consultation History", ar: "سجل الاستشارات الطبية" },
  undo: { en: "Undo", ar: "تراجع" },
  clearAll: { en: "Clear All", ar: "مسح الكل" },
  addBullet: { en: "Add Bullet", ar: "إضافة نقطة" },
  initiateDocumentation: { en: "Initiate documentation for", ar: "بدء التوثيق لـ" },
  noPatientSelected: { en: "No Patient Selected", ar: "لم يتم اختيار مريض" },
  browsePatientRecords: { en: "Browse Patient Records", ar: "تصفح سجلات المرضى" },
  emrAccessDesc: { en: "To view a Clinical Record, please go to the Patients list and select a specific individual.", ar: "لعرض السجل السريري، يرجى الانتقال إلى قائمة المرضى واختيار مريض محدد." },
  profileUpdated: { en: "Profile updated successfully", ar: "تم تحديث الملف الشخصي بنجاح" },
  proIdentityDesc: { en: "Keep your professional identity consistent across the platform.", ar: "حافظ على اتساق هويتك المهنية عبر المنصة." },
  failedUpdateProfile: { en: "Failed to update profile", ar: "فشل تحديث الملف الشخصي" },
  uploadPictureError: { en: "Failed to upload image", ar: "فشل تحميل الصورة" },
  recordNotFound: { en: "Record not found", ar: "السجل غير موجود" },
  aiDiagnosticAssistant: { en: "AI Diagnostic Assistant", ar: "مساعد التشخيص بالذكاء الاصطناعي" },
  initialDiagnosisPrompt: { en: "Initial Diagnosis Details", ar: "تفاصيل التشخيص الأولي" },
  initialDiagnosisPlaceholder: { en: "Enter primary symptoms, findings, and clinical notes to generate matching ICD-10 suggestions...", ar: "أدخل الأعراض الرئيسية والنتائج والملاحظات السريرية لإنشاء مقترحات الرموز الطبية ICD-10 المناسبة..." },
  generateSuggestions: { en: "Generate AI Diagnostic Suggestions", ar: "إنشاء مقترحات التشخيص بالذكاء الاصطناعي" },
  generatingSuggestions: { en: "Analyzing clinical notes...", ar: "جاري تحليل الملاحظات السريرية..." },
  suggestionsTitle: { en: "AI ICD-10 Diagnostic Suggestions", ar: "مقترحات الرموز الطبية ICD-10 بالذكاء الاصطناعي" },
  accuracyLevel: { en: "Accuracy Score", ar: "درجة الدقة" },
  howSuggestionMade: { en: "Medical Match Rationale", ar: "مبررات المطابقة الطبية" },
  medicalSource: { en: "Verified Medical Resource", ar: "المصدر الطبي المعتمد" },
  howAccuracyWorking: { en: "Confidence Score Explanation", ar: "تفسير درجة الثقة" },
  applyToPlan: { en: "Apply to Plan of Care", ar: "تطبيق على خطة الرعاية" },
  suggestionApplied: { en: "Diagnostic code successfully added to Plan of Care", ar: "تم إضافة الرمز التشخيصي بنجاح إلى خطة الرعاية" },
  highConfidence: { en: "High Confidence", ar: "ثقة عالية" },
  mediumConfidence: { en: "Medium Confidence", ar: "ثقة متوسطة" },
  lowConfidence: { en: "Low Confidence", ar: "ثقة منخفضة" },

  // EMR actions & toasts
  clinicalEntrySaved: { en: "Clinical entry saved successfully.", ar: "تم حفظ الإدخال السريري بنجاح." },
  failedSaveEntry: { en: "Failed to save entry.", ar: "فشل حفظ الإدخال." },
  failedDeleteRecord: { en: "Failed to delete record.", ar: "فشل حذف السجل." },
  failedUpdatePhoto: { en: "Failed to update photo.", ar: "فشل تحديث الصورة." },
  photoUpdated: { en: "Patient photo updated.", ar: "تم تحديث صورة المريض." },
  recordRemoved: { en: "Record removed successfully.", ar: "تم حذف السجل بنجاح." },
  clearAllDrafts: { en: "Clear All Drafts", ar: "مسح كل المسودات" },
  clearDraftsConfirm: { en: "This will clear the current draft text. Are you sure?", ar: "سيؤدي ذلك إلى مسح نص المسودة الحالي. هل أنت متأكد؟" },
  clearNow: { en: "Clear Now", ar: "امسح الآن" },
  keepTyping: { en: "Keep Typing", ar: "استمر في الكتابة" },
  deleteRecordConfirm: { en: "This will permanently delete this clinical record. This action cannot be undone.", ar: "سيؤدي ذلك إلى حذف هذا السجل السريري نهائياً. لا يمكن التراجع عن هذا الإجراء." },

  // Monitoring Units
  heightUnit: { en: "Height", ar: "الطول" },
  weightUnit: { en: "Weight", ar: "الوزن" },
  bmiUnit: { en: "BMI", ar: "كتلة الجسم" },
  bpUnit: { en: "BP", ar: "ضغط الدم" },
  hrUnit: { en: "HR", ar: "النبض" },
  spo2Unit: { en: "SpO2", ar: "الأكسجين" },

  // Orders
  lab: { en: "Lab", ar: "المختبر" },
  imaging: { en: "Imaging", ar: "الأشعة" },
  prescription: { en: "Prescription", ar: "الوصفة الطبية" },

  prescription: { en: "Prescription", ar: "الوصفة الطبية" },
  lastMeasure: { en: "Last", ar: "آخر قياس" },
  medicalRegistry: { en: "Medical Registry", ar: "السجل الطبي" },
  historicalObservations: { en: "Historical medical observations", ar: "الملاحظات الطبية التاريخية" },
  searchRegistry: { en: "Search Registry...", ar: "البحث في السجل..." },
  tprChart: { en: "TPR Chart", ar: "مخطط TPR" },
  bpTrends: { en: "Blood Pressure Trends", ar: "اتجاهات ضغط الدم" },
  physMetrics: { en: "Physical Metrics", ar: "المقاييس البدنية" },
  abuseScreening: { en: "Abuse Screening", ar: "فحص الإساءة" },
  mentalStatus: { en: "Mental Status", ar: "الحالة العقلية" },
  pupillaryResponse: { en: "Pupillary Response", ar: "استجابة الحدقة" },
  motorFunction: { en: "Motor Function", ar: "الوظيفة الحركية" },
  heartSounds: { en: "Heart Sounds", ar: "أصوات القلب" },
  capillaryRefill: { en: "Capillary Refill", ar: "امتلاء الشعيرات" },
  peripheralEdema: { en: "Peripheral Edema", ar: "وذمة محيطية" },
  lungSounds: { en: "Lung Sounds", ar: "أصوات الرئة" },
  coughType: { en: "Cough Type", ar: "نوع السعال" },
  oxygenSupport: { en: "Oxygen Support", ar: "دعم الأكسجين" },
  painIntensity: { en: "Pain Intensity Score", ar: "درجة شدة الألم" },
  dietType: { en: "Diet Type", ar: "نوع النظام الغذائي" },
  appetiteLevel: { en: "Appetite Level", ar: "مستوى الشهية" },
  swallowingDifficulty: { en: "Swallowing Difficulty", ar: "صعوبة البلع" },
  giSymptoms: { en: "GI Symptoms", ar: "أعراض الجهاز الهضمي" },
  weightChange: { en: "Recent Weight Change", ar: "تغير الوزن الأخير" },
  
  // Appointments
  dateTime: { en: "Date & Time", ar: "التاريخ والوقت" },
  appointmentDate: { en: "Appointment Date", ar: "تاريخ الموعد" },
  allAppointments: { en: "All Appointments", ar: "جميع المواعيد" },
  manualBookings: { en: "Staff Manual Bookings", ar: "الحجوزات اليدوية" },
  aiOptimizedSlots: { en: "AI Optimized Slots", ar: "المواعيد المحسنة" },
  manageAppointmentsDesc: { en: "Manage and Register Appointments", ar: "إدارة وتسجيل المواعيد" },
  selectPatient: { en: "Select Patient", ar: "اختر المريض" },
  selectProvider: { en: "Select Provider", ar: "اختر مزود الرعاية" },
  appointmentRegisteredSuccess: { en: "Appointment registered successfully", ar: "تم تسجيل الموعد بنجاح" },
  aiSlotSuccess: { en: "AI slot generated & registered successfully", ar: "تم إنشاء موعد الذكاء الاصطناعي بنجاح" },
  fillRequiredFields: { en: "Please fill all required fields", ar: "يرجى تعبئة جميع الحقول الإلزامية" },
  selectPatientAndReason: { en: "Please select a patient and reason", ar: "يرجى اختيار المريض وسبب الزيارة" },
  bookingDialogDesc: { en: "Select patient, provider, and time to schedule the appointment", ar: "قم باختيار المريض والمزود والوقت المناسب لجدولة الموعد" },
  aiAgentDesc: { en: "Our AI agent will analyze history to suggest an optimal slot.", ar: "سيقوم مساعد الذكاء الاصطناعي بتحليل التاريخ الطبي لاقتراح الموعد الأمثل." },
  describeSymptoms: { en: "Describe symptoms or reason for visit...", ar: "صف الأعراض أو سبب الزيارة..." },
  smartSlotSelection: { en: "Smart Slot Selection", ar: "اختيار موعد ذكي" },
  generateOptimizedSlot: { en: "Generate Optimized Slot", ar: "إنشاء موعد محسن" },
  aiOptimizationReport: { en: "AI Optimization Report", ar: "تقرير تحسين الذكاء الاصطناعي" },
  priorityLevel: { en: "AI Assigned Priority", ar: "الأولوية المحددة بالذكاء الاصطناعي" },
  priorityExplanation: { en: "AI Priority & Slot Explanation", ar: "شرح الأولوية والوقت بالذكاء الاصطناعي" },
  manualSlotsImpact: { en: "Status of Manual Slots", ar: "حالة المواعيد اليدوية" },
  appointmentDetails: { en: "Appointment Details", ar: "تفاصيل الموعد" },
  bookingType: { en: "Booking Type", ar: "نوع الحجز" },
  manualBookingNote: { en: "Manual Booking Note", ar: "ملاحظة الحجز اليدوي" },
  manualBookingDesc: { en: "Manual Slot: Scheduled directly by medical staff. Protected from AI rescheduling.", ar: "موعد يدوي: تم جدولته مباشرة بواسطة الكادر الطبي. محمي من إعادة الجدولة بالذكاء الاصطناعي." },
  urgent: { en: "Urgent", ar: "عاجل" },
  high: { en: "High", ar: "مرتفع" },
  routine: { en: "Routine", ar: "روتيني" },

  // Errors & Warnings
  failedLoadPatients: { en: "Failed to load patients", ar: "فشل تحميل قائمة المرضى" },
  failedLoadProviders: { en: "Failed to load providers", ar: "فشل تحميل قائمة مقدمي الرعاية" },

  // Relative Time Components
  ago: { en: "ago", ar: "منذ" },
  min: { en: "min", ar: "دقيقة" },
  mins: { en: "mins", ar: "دقيقة" },
  hr: { en: "hr", ar: "ساعة" },
  hrs: { en: "hrs", ar: "ساعة" },
  day: { en: "day", ar: "يوم" },
  days: { en: "days", ar: "يوم" },

  // Statuses
  active: { en: "Active", ar: "نشط" },
  inactive: { en: "Inactive", ar: "غير نشط" },
  pending: { en: "Pending", ar: "قيد الانتظار" },
  dischargedStatus: { en: "Discharged", ar: "مُخرَّج" },
  registeredStatus: { en: "Registered", ar: "مسجل" },
  inProgressStatus: { en: "In Progress", ar: "قيد المعالجة" },

  // Role names as values
  doctorRole: { en: "Doctor", ar: "طبيب" },
  nurseRole: { en: "Nurse", ar: "ممرض/ة" },
  adminRole: { en: "E-Health Admin", ar: "مدير النظام" },

  // Specialities
  familySpecialty: { en: "Family Medicine", ar: "طب الأسرة" },
  internalSpecialty: { en: "Internal Medicine", ar: "الطب الباطني" },
  pediatricsSpecialty: { en: "Pediatrics", ar: "طب الأطفال" },
  emergencySpecialty: { en: "Emergency", ar: "الطوارئ" },
  generalSpecialty: { en: "General", ar: "عام" },
  administrationSpecialty: { en: "Administration", ar: "إدارة" },
  itSpecialty: { en: "IT", ar: "تقنية المعلومات" },

  // Errors & Warnings
  accessDenied: { en: "Access Denied", ar: "تم رفض الوصول" },
  accessDeniedDesc: {
    en: "You don't have permission to access this page.",
    ar: "ليس لديك صلاحية الوصول لهذه الصفحة.",
  },
};

export function tx(key: keyof typeof t, lang: Lang): string {
  return t[key]?.[lang] ?? t[key]?.en ?? key;
}

export function txGender(gender: string | null | undefined, lang: Lang): string {
  if (!gender) return "—";
  const g = gender.toLowerCase();
  if (g === "male") return tx("male", lang);
  if (g === "female") return tx("female", lang);
  return g;
}

export function txStatus(status: string | null | undefined, lang: Lang): string {
  if (!status) return "—";
  const statusMap: Record<string, keyof typeof t> = {
    "Registered": "registeredStatus",
    "In Progress": "inProgressStatus",
    "Discharged": "dischargedStatus",
    "Active": "active",
    "Inactive": "inactive",
    "Pending": "pending",
  };
  const key = statusMap[status];
  return key ? tx(key, lang) : status;
}

export function txSpecialty(specialty: string | null | undefined, lang: Lang): string {
  if (!specialty) return "—";
  const specialtyMap: Record<string, keyof typeof t> = {
    "family": "familySpecialty",
    "internal": "internalSpecialty",
    "pediatrics": "pediatricsSpecialty",
    "emergency": "emergencySpecialty",
    "general": "generalSpecialty",
    "administration": "administrationSpecialty",
    "it": "itSpecialty",
  };
  const key = specialtyMap[specialty.toLowerCase()];
  return key ? tx(key, lang) : specialty;
}

export function txEmrSection(sectionKey: string, lang: Lang): string {
  const sectionMap: Record<string, keyof typeof t> = {
    "Chief Complaints": "chiefComplaints",
    "Present Illness": "presentIllness",
    "Past Medical/Surgical History": "pastMedicalHistory",
    "Gynecological and Obstetrical History": "gynaeHistory",
    "Family History": "familyHistory",
    "Surgical / Medical Procedure": "surgicalProcedure",
    "Medication History": "medicationHistory",
    "Personal/Social History": "socialHistory",
    "Developmental History": "developmentalHistory",
    "Physical Examination": "physicalExamination",
    "OB History": "obHistory",
    "Doctor Notes": "doctorNotes",
    "Doctor Recommendation and Advice": "doctorRecommendation",
    "Plan of Care": "planOfCare"
  };
  const key = sectionMap[sectionKey];
  return key ? tx(key, lang) : sectionKey;
}

export function txStatTitle(title: string, lang: Lang): string {
  const titleMap: Record<string, keyof typeof t> = {
    "Active Staff": "activeStaff",
    "Today's Vitals": "todaysVitals",
    "Total Patients": "totalPatients",
    "Total Healthcare Providers": "totalHealthcareProviders",
  };
  
  const key = titleMap[title];
  return key ? tx(key, lang) : title;
}

export function txStatDesc(description: string, lang: Lang): string {
  const descMap: Record<string, keyof typeof t> = {
    "Providers marked active": "providersMarkedActive",
    "Recorded today": "recordedToday",
    "All time registrations": "allTimeRegistrations",
    "Registered in system": "registeredInSystem",
  };
  
  const key = descMap[description];
  return key ? tx(key, lang) : description;
}

export function txRole(role: string, lang: Lang): string {
  const roleMap: Record<string, keyof typeof t> = {
    "E-Health Admin": "admin",
    "Doctor": "doctor",
    "Nurse": "nurse",
    "Staff": "staff",
  };
  
  const key = roleMap[role];
  return key ? tx(key, lang) : role;
}

export function txAction(action: string, lang: Lang): string {
  const actionMap: Record<string, keyof typeof t> = {
    "Healthcare provider added": "providerAdded",
    "Healthcare provider updated": "providerUpdated",
    "Healthcare provider deleted": "providerDeleted",
    "Vital signs recorded": "vitalsRecorded",
    "New patient registered": "patientRegistered",
    "Patient updated": "patientUpdated",
  };
  
  const key = actionMap[action];
  return key ? tx(key, lang) : action;
}

export function txRelativeTime(timeStr: string, lang: Lang): string {
  if (lang !== "ar") return timeStr;
  
  // Format from backend: "X mins ago", "X hrs ago", "X days ago"
  const parts = timeStr.trim().split(/\s+/);
  if (parts.length < 3) return timeStr;
  
  const val = parts[0];
  const unit = parts[1] as keyof typeof t;
  // parts[2] is "ago"
  
  const arUnit = t[unit]?.ar || unit;
  return `منذ ${val} ${arUnit}`;
}
