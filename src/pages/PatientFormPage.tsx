import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { AccessDenied } from "@/components/shared/AccessDenied";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/api/client";
import type { PatientDetail } from "@/api/types";
import { useLang } from "@/hooks/useLang";
import { useAuth } from "@/hooks/useAuth";
import { tx } from "@/lib/i18n";

export default function PatientFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id && id !== "new";
  const qc = useQueryClient();
  const { lang } = useLang();
  const { canRegisterPatients } = useAuth();

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [firstName, setFirstName] = useState("");
  const [secondName, setSecondName] = useState("");
  const [thirdName, setThirdName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [nationality, setNationality] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [email, setEmail] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [phone, setPhone] = useState("");
  const [buildingNo, setBuildingNo] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("Saudi Arabia");
  const [postcode, setPostcode] = useState("");
  const [aliasNames, setAliasNames] = useState("");
  const [employer, setEmployer] = useState("");
  const [disability, setDisability] = useState("");
  const [allergies, setAllergies] = useState("");
  const [chronic, setChronic] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [status, setStatus] = useState("Registered");

  const { data: existing } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => apiFetch<PatientDetail>(`/patients/${id}`),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setFirstName(existing.firstName ?? "");
      setSecondName(existing.secondName ?? "");
      setThirdName(existing.thirdName ?? "");
      setFamilyName(existing.familyName ?? "");
      setGender(existing.gender === "Male" ? "male" : "female");
      setDob(existing.dob ?? "");
      setNationality(existing.nationality ?? "");
      setNationalId(existing.nationalId ?? "");
      setEmail(existing.email ?? "");
      setBloodGroup(existing.bloodGroup ?? "");
      setPhone(existing.phone ?? "");
      setBuildingNo(existing.buildingNo ?? "");
      setArea(existing.area ?? "");
      setCity(existing.city ?? "");
      setState(existing.state ?? "");
      setCountry(existing.country ?? "Saudi Arabia");
      setPostcode(existing.postcode ?? "");
      setAliasNames(existing.aliasNames ?? "");
      setEmployer(existing.employer ?? "");
      setDisability(existing.disability ?? "");
      setAllergies(existing.allergies ?? "");
      setChronic(existing.chronicConditions ?? "");
      setEmergencyName(existing.emergencyContactName ?? "");
      setEmergencyPhone(existing.emergencyContactPhone ?? "");
      setStatus(existing.status ?? "Registered");
    }
  }, [existing]);

  const save = useMutation({
    mutationFn: async () => {
      const missingEn = [];
      const missingAr = [];
      if (!firstName.trim()) { missingEn.push("First Name"); missingAr.push("الاسم الأول"); }
      if (!familyName.trim()) { missingEn.push("Family Name"); missingAr.push("اسم العائلة"); }
      if (!nationalId.trim()) { missingEn.push("National ID"); missingAr.push("رقم الهوية الوطنية"); }
      if (!dob) { missingEn.push("Date of Birth"); missingAr.push("تاريخ الميلاد"); }
      if (!gender) { missingEn.push("Gender"); missingAr.push("الجنس"); }
      if (!phone.trim()) { missingEn.push("Phone"); missingAr.push("الهاتف"); }

      if (missingEn.length > 0) {
        if (missingEn.length === 1) {
          throw new Error(lang === "ar" ? `${missingAr[0]} ${tx("requiredField", lang)}` : `${missingEn[0]} ${tx("requiredField", lang)}`);
        }
        throw new Error(`${tx("completeFields", lang)} ${lang === "ar" ? missingAr.join("، ") : missingEn.join(", ")}.`);
      }
      if (email.trim()) {
        const emailRegex = /^[a-zA-Z0-9_.+-]+@healthprime\.sa$/i;
        if (!emailRegex.test(email.trim())) {
          throw new Error(tx("emailDomainError", lang));
        }
      }
      const body = {
        firstName: firstName.trim(),
        secondName: secondName.trim() || null,
        thirdName: thirdName.trim() || null,
        familyName: familyName.trim(),
        nationalId: nationalId.trim(),
        gender: gender === "male" ? "Male" : gender === "female" ? "Female" : gender,
        dob,
        phone: phone.trim(),
        email: email.trim() || null,
        bloodGroup: bloodGroup || null,
        nationality: nationality.trim() || null,
        status,
        buildingNo: buildingNo.trim() || null,
        area: area.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        country: country.trim() || null,
        postcode: postcode.trim() || null,
        aliasNames: aliasNames.trim() || null,
        employer: employer.trim() || null,
        disability: disability.trim() || null,
        allergies: allergies.trim() || null,
        chronicConditions: chronic.trim() || null,
        emergencyContactName: emergencyName.trim() || null,
        emergencyContactPhone: emergencyPhone.trim() || null,
      };
      if (isEdit) {
        return apiFetch<PatientDetail>(`/patients/${id}`, { method: "PUT", body: JSON.stringify(body) });
      }
      return apiFetch<PatientDetail>("/patients", { method: "POST", body: JSON.stringify(body) });
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["patient", id] });
      setFeedback({ type: "success", message: isEdit ? tx("successPatientEdit", lang) : tx("successPatient", lang) });
      setTimeout(() => navigate(`/patients/${result.id}`), 600);
    },
    onError: (e: Error) => {
      setFeedback({ type: "error", message: e.message || "Could not save patient." });
    },
  });

  const handleSave = () => {
    setFeedback(null);
    save.mutate();
  };

  if (!canRegisterPatients) return <AccessDenied />;

  const fieldClass = "space-y-1.5";

  return (
    <DashboardLayout>
      <PageHeader
        title={isEdit ? tx("editPatient", lang) : tx("addPatientTitle", lang)}
        description={tx("addPatientDescription", lang)}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
              <div className={fieldClass}>
                <Label>{tx("firstName", lang)} *</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={tx("firstName", lang)} />
              </div>
              <div className={fieldClass}>
                <Label>{tx("secondName", lang)}</Label>
                <Input value={secondName} onChange={(e) => setSecondName(e.target.value)} placeholder={tx("secondName", lang)} />
              </div>
              <div className={fieldClass}>
                <Label>{tx("thirdName", lang)}</Label>
                <Input value={thirdName} onChange={(e) => setThirdName(e.target.value)} placeholder={tx("thirdName", lang)} />
              </div>
              <div className={fieldClass}>
                <Label>{tx("familyName", lang)} *</Label>
                <Input value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder={tx("familyName", lang)} />
              </div>
              <div className={fieldClass}>
                <Label>{tx("gender", lang)} *</Label>
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
                <Label>{tx("dateOfBirth", lang)} *</Label>
                <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>
              <div className={fieldClass}>
                <Label>{tx("nationality", lang)}</Label>
                <Input value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder={lang === "ar" ? "مثال: سعودي" : "e.g. Saudi"} />
              </div>
              <div className={fieldClass}>
                <Label>{tx("nationalId", lang)} *</Label>
                <Input value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder={lang === "ar" ? "رقم هوية وطنية مكون من 10 أرقام" : "10-digit National ID"} />
              </div>
              <div className={fieldClass}>
                <Label>{tx("email", lang)}</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="patient@example.com" />
              </div>
              <div className={fieldClass}>
                <Label>{tx("bloodGroup", lang)}</Label>
                <Select value={bloodGroup} onValueChange={setBloodGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder={lang === "ar" ? "اختر فصيلة الدم" : "Select blood group"} />
                  </SelectTrigger>
                  <SelectContent>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className={fieldClass}>
                <Label>{tx("phone", lang)} *</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+966 5X XXX XXXX" />
              </div>
              {isEdit && (
                <div className={fieldClass}>
                  <Label>{tx("status", lang)}</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Registered">{tx("registered", lang)}</SelectItem>
                      <SelectItem value="In Progress">{tx("inProgress", lang)}</SelectItem>
                      <SelectItem value="Discharged">{tx("discharged", lang)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </section>

          {/* Address */}
          <section>
            <h3 className="text-sm font-semibold mb-5 pb-2 border-b border-border">
              {tx("address", lang)}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
              <div className={fieldClass}>
                <Label>{tx("buildingNo", lang)}</Label>
                <Input value={buildingNo} onChange={(e) => setBuildingNo(e.target.value)} />
              </div>
              <div className={fieldClass}>
                <Label>{tx("area", lang)}</Label>
                <Input value={area} onChange={(e) => setArea(e.target.value)} />
              </div>
              <div className={fieldClass}>
                <Label>{tx("city", lang)}</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className={fieldClass}>
                <Label>{tx("state", lang)}</Label>
                <Input value={state} onChange={(e) => setState(e.target.value)} />
              </div>
              <div className={fieldClass}>
                <Label>{tx("country", lang)}</Label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
              <div className={fieldClass}>
                <Label>{tx("postcode", lang)}</Label>
                <Input value={postcode} onChange={(e) => setPostcode(e.target.value)} />
              </div>
            </div>
          </section>

          {/* Additional Information */}
          <section>
            <h3 className="text-sm font-semibold mb-5 pb-2 border-b border-border">
              {tx("additionalInformation", lang)}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div className={fieldClass}>
                <Label>{tx("aliasNames", lang)}</Label>
                <Input value={aliasNames} onChange={(e) => setAliasNames(e.target.value)} />
              </div>
              <div className={fieldClass}>
                <Label>{tx("employer", lang)}</Label>
                <Input value={employer} onChange={(e) => setEmployer(e.target.value)} />
              </div>
              <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
                <Label>{tx("disability", lang)}</Label>
                <Textarea value={disability} onChange={(e) => setDisability(e.target.value)} rows={2} />
              </div>
            </div>
          </section>

          {/* Medical Information */}
          <section>
            <h3 className="text-sm font-semibold mb-5 pb-2 border-b border-border">
              {tx("medicalInformation", lang)}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div className={fieldClass}>
                <Label>{tx("allergies", lang)}</Label>
                <Textarea value={allergies} onChange={(e) => setAllergies(e.target.value)} rows={2} />
              </div>
              <div className={fieldClass}>
                <Label>{tx("chronicConditions", lang)}</Label>
                <Textarea value={chronic} onChange={(e) => setChronic(e.target.value)} rows={2} />
              </div>
            </div>
          </section>

          {/* Emergency Contact */}
          <section>
            <h3 className="text-sm font-semibold mb-5 pb-2 border-b border-border">
              {tx("emergencyContact", lang)}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div className={fieldClass}>
                <Label>{tx("contactName", lang)}</Label>
                <Input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
              </div>
              <div className={fieldClass}>
                <Label>{tx("contactPhone", lang)}</Label>
                <Input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <Button onClick={handleSave} disabled={save.isPending} className="min-w-[140px]">
              {save.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {tx("saving", lang)}
                </>
              ) : (
                tx("savePatient", lang)
              )}
            </Button>
            <Button variant="outline" onClick={() => navigate("/patients")}>
              {tx("cancel", lang)}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
