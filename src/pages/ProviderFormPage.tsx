import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { AccessDenied } from "@/components/shared/AccessDenied";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/api/client";
import { useLang } from "@/hooks/useLang";
import { useAuth } from "@/hooks/useAuth";
import { tx } from "@/lib/i18n";

const ROLE_MAP: Record<string, string> = {
  doctor: "Doctor",
  nurse: "Nurse",
  admin: "E-Health Admin",
};

const ROLE_REVERSE: Record<string, string> = {
  Doctor: "doctor",
  Nurse: "nurse",
  "E-Health Admin": "admin",
};

const SPECIALTY_MAP: Record<string, string> = {
  family: "Family Medicine",
  pediatrics: "Pediatrics",
  internal: "Internal Medicine",
  emergency: "Emergency",
  general: "General",
  administration: "Administration",
  it: "IT",
};

const SPECIALTY_REVERSE: Record<string, string> = {
  "Family Medicine": "family",
  Pediatrics: "pediatrics",
  "Internal Medicine": "internal",
  Emergency: "emergency",
  General: "general",
  Administration: "administration",
  IT: "it",
};

const DOCTOR_SPECIALTIES = ["family", "pediatrics", "internal", "emergency", "general"];
const NURSE_SPECIALTIES = ["general", "emergency", "pediatrics"];
const ADMIN_SPECIALTIES = ["administration", "it"];

interface ProviderDetailData {
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

export default function ProviderFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const qc = useQueryClient();
  const { lang } = useLang();
  const { canManageProviders } = useAuth();

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [license, setLicense] = useState("");
  const [department, setDepartment] = useState("");

  // Load existing data in edit mode
  const { data: existing } = useQuery({
    queryKey: ["provider", id],
    queryFn: () => apiFetch<ProviderDetailData>(`/providers/${id}`),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setFullName(existing.fullName ?? "");
      setEmail(existing.email ?? "");
      setPhone(existing.phone ?? "");
      setGender(existing.gender === "Male" ? "male" : existing.gender === "Female" ? "female" : "");
      setDob(existing.dob ?? "");
      setAddress(existing.address ?? "");
      setRole(ROLE_REVERSE[existing.role] || existing.role.toLowerCase());
      setSpecialty(SPECIALTY_REVERSE[existing.specialty] || existing.specialty.toLowerCase());
      setLicense(existing.licenseNumber ?? "");
      setDepartment(existing.department ?? "");
    }
  }, [existing]);

  // Adjust specialty when role changes
  useEffect(() => {
    if (role === "doctor" && !DOCTOR_SPECIALTIES.includes(specialty)) setSpecialty("");
    if (role === "nurse" && !NURSE_SPECIALTIES.includes(specialty)) setSpecialty("");
    if (role === "admin" && !ADMIN_SPECIALTIES.includes(specialty)) setSpecialty("");
  }, [role]);

  const save = useMutation({
    mutationFn: async () => {
      const missingEn = [];
      const missingAr = [];
      if (!fullName.trim()) { missingEn.push("Name"); missingAr.push("الاسم"); }
      if (!email.trim()) { missingEn.push("Email"); missingAr.push("البريد الإلكتروني"); }
      if (!isEdit && !password) { missingEn.push("Password"); missingAr.push("كلمة المرور"); }
      if (!role) { missingEn.push("Role"); missingAr.push("الدور"); }
      if (!specialty) { missingEn.push("Specialty"); missingAr.push("التخصص"); }
      if (!license.trim()) { missingEn.push("License Number"); missingAr.push("ترخيص العمل"); }

      if (missingEn.length > 0) {
        if (missingEn.length === 1) {
          throw new Error(lang === "ar" ? `${missingAr[0]} ${tx("requiredField", lang)}` : `${missingEn[0]} ${tx("requiredField", lang)}`);
        }
        throw new Error(`${tx("completeFields", lang)} ${lang === "ar" ? missingAr.join("، ") : missingEn.join(", ")}.`);
      }
      const emailRegex = /^[a-zA-Z0-9_.+-]+@healthprime\.sa$/i;
      if (!emailRegex.test(email.trim())) {
        throw new Error(tx("emailDomainError", lang));
      }
      if (!isEdit || password) {
        if (password.length < 8) {
          throw new Error(tx("passwordTooShort", lang));
        }
      }
      const body = {
        fullName: fullName.trim(),
        email: email.trim(),
        password: password || "",
        phone: phone.trim() || null,
        gender: gender ? (gender === "male" ? "Male" : "Female") : null,
        dob: dob || null,
        address: address.trim() || null,
        role: ROLE_MAP[role] ?? role,
        specialty: SPECIALTY_MAP[specialty] ?? specialty,
        licenseNumber: license.trim(),
        department: department.trim() || null,
        status: "Active",
      };
      if (isEdit) {
        return apiFetch<{ id: number }>(`/providers/${id}`, { method: "PUT", body: JSON.stringify(body) });
      }
      return apiFetch<{ id: number }>("/providers", { method: "POST", body: JSON.stringify(body) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["providers"] });
      setFeedback({ type: "success", message: isEdit ? tx("successProviderEdit", lang) : tx("successProvider", lang) });
      setTimeout(() => navigate("/providers"), 800);
    },
    onError: (e: Error) => setFeedback({ type: "error", message: e.message || "Save failed." }),
  });

  if (!canManageProviders) return <AccessDenied />;

  const fieldClass = "space-y-1.5";
  const sectionClass = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4";

  return (
    <DashboardLayout>
      <PageHeader
        title={isEdit ? tx("editProvider", lang) : tx("addProviderTitle", lang)}
        description={tx("addProviderDescription", lang)}
      />

      <div className="w-full max-w-5xl">
        {feedback && (
          <div
            className={`mb-5 flex items-center gap-2 text-sm px-4 py-3 rounded-md ${
              feedback.type === "success"
                ? "text-primary bg-primary/10"
                : "text-destructive bg-destructive/10"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {feedback.message}
          </div>
        )}

        <div className="bg-card rounded-lg border border-border p-6 space-y-8">
          {/* Personal Information */}
          <section>
            <h3 className="text-sm font-semibold mb-5 pb-2 border-b border-border">
                {tx("personalInformation", lang)}
            </h3>
            <div className={sectionClass}>
              <div className={fieldClass}>
                <Label>{tx("name", lang)} *</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={tx("enterFullName", lang)} />
              </div>
              <div className={fieldClass}>
                <Label>{tx("email", lang)} *</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@healthprime.sa" />
              </div>
              <div className={fieldClass}>
                <Label>{tx("password", lang)} {!isEdit && "*"}</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isEdit ? tx("leaveBlank", lang) : tx("setInitialPassword", lang)}
                />
              </div>
              <div className={fieldClass}>
                <Label>{tx("phone", lang)}</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+966 5X XXX XXXX" />
              </div>
              <div className={fieldClass}>
                <Label>{tx("gender", lang)}</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder={tx("selectGender", lang)} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{tx("male", lang)}</SelectItem>
                    <SelectItem value="female">{tx("female", lang)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className={fieldClass}>
                <Label>{tx("dateOfBirthShort", lang)}</Label>
                <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>
              <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
                <Label>{tx("address", lang)}</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={tx("enterAddress", lang)} />
              </div>
            </div>
          </section>

          {/* Professional Information */}
          <section>
            <h3 className="text-sm font-semibold mb-5 pb-2 border-b border-border">
              {tx("professionalInformation", lang)}
            </h3>
            <div className={sectionClass}>
              <div className={fieldClass}>
                <Label>{tx("role", lang)} *</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue placeholder={tx("selectRole", lang)} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor">{tx("doctor", lang)}</SelectItem>
                    <SelectItem value="nurse">{tx("nurse", lang)}</SelectItem>
                    <SelectItem value="admin">{tx("admin", lang)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className={fieldClass}>
                <Label>{tx("specialty", lang)} *</Label>
                <Select value={specialty} onValueChange={setSpecialty} disabled={!role}>
                  <SelectTrigger>
                    <SelectValue placeholder={tx("selectSpecialty", lang)} />
                  </SelectTrigger>
                  <SelectContent>
                    {(!role || role === "doctor") && (
                      <>
                        <SelectItem value="family">{tx("familyMedicine", lang)}</SelectItem>
                        <SelectItem value="internal">{tx("internalMedicine", lang)}</SelectItem>
                      </>
                    )}
                    {(!role || role === "doctor" || role === "nurse") && (
                      <>
                        <SelectItem value="pediatrics">{tx("pediatrics", lang)}</SelectItem>
                        <SelectItem value="emergency">{tx("emergency", lang)}</SelectItem>
                        <SelectItem value="general">{tx("general", lang)}</SelectItem>
                      </>
                    )}
                    {(!role || role === "admin") && (
                      <>
                        <SelectItem value="administration">{tx("administration", lang)}</SelectItem>
                        <SelectItem value="it">{tx("it", lang)}</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className={fieldClass}>
                <Label>{tx("licenseNumber", lang)} *</Label>
                <Input value={license} onChange={(e) => setLicense(e.target.value)} placeholder="e.g. SM-20456" />
              </div>
              <div className={fieldClass}>
                <Label>{tx("department", lang)}</Label>
                <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder={tx("enterDepartment", lang)} />
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <Button onClick={() => save.mutate()} disabled={save.isPending} className="min-w-[160px]">
              {save.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {tx("saving", lang)}
                </>
              ) : (
                tx("saveProvider", lang)
              )}
            </Button>
            <Button variant="outline" onClick={() => navigate("/providers")}>
              {tx("cancel", lang)}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
