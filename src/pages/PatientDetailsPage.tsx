import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, FileText, ClipboardList, HeartPulse } from "lucide-react";
import { apiFetch } from "@/api/client";
import type { PatientDetail } from "@/api/types";
import { useLang } from "@/hooks/useLang";
import { useAuth } from "@/hooks/useAuth";
import { tx, txStatus, txGender } from "@/lib/i18n";

const statusMap = {
  Registered: "active" as const,
  "In Progress": "pending" as const,
  Discharged: "inactive" as const,
};

export default function PatientDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { lang } = useLang();
  const { canRegisterPatients, canViewEMR } = useAuth();

  const { data: patient, isLoading, error } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => apiFetch<PatientDetail>(`/patients/${id}`),
    enabled: !!id,
  });

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section>
      <h3 className="text-sm font-semibold mb-4 pb-2 border-b border-border">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">{children}</div>
    </section>
  );

  const Field = ({ label, value }: { label: string; value: string }) => (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-[400px] w-full" />
      </DashboardLayout>
    );
  }

  if (error || !patient) {
    return (
      <DashboardLayout>
        <PageHeader title={tx("patientDetails", lang)} description={tx("recordNotFound", lang)} />
        <Button variant="outline" onClick={() => navigate("/patients")}>
          {tx("backToPatients", lang)}
        </Button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={tx("patientDetails", lang)}
        description={`${patient.firstName} ${patient.familyName} — ${tx("nationalId", lang)}: ${patient.nationalId}`}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2 border-teal-200 text-teal-700 hover:bg-teal-50"
              onClick={() => navigate(`/vitals/record?patientId=${patient.id}`)}
            >
              <HeartPulse className="w-4 h-4" /> {tx("recordVitals", lang)}
            </Button>
            {canViewEMR && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => navigate(`/patients/emr/${patient.id}`)}
              >
                <ClipboardList className="w-4 h-4" /> {tx("openEMR", lang)}
              </Button>
            )}
            {canRegisterPatients && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => navigate(`/patients/${patient.id}/edit`)}
              >
                <Pencil className="w-4 h-4" /> {tx("edit", lang)}
              </Button>
            )}
          </div>
        }
      />

      <div className="max-w-4xl space-y-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-sm text-muted-foreground">{tx("patientStatus", lang)}</span>
            <StatusBadge variant={statusMap[patient.status as keyof typeof statusMap] ?? "pending"}>
              {txStatus(patient.status, lang)}
            </StatusBadge>
          </div>

          <Section title={tx("personalInformation", lang)}>
            <Field label={tx("firstName", lang)} value={patient.firstName} />
            <Field label={tx("secondName", lang)} value={patient.secondName || "—"} />
            <Field label={tx("thirdName", lang)} value={patient.thirdName || "—"} />
            <Field label={tx("familyName", lang)} value={patient.familyName} />
            <Field label={tx("gender", lang)} value={txGender(patient.gender, lang)} />
            <Field label={tx("dateOfBirth", lang)} value={patient.dob} />
            <Field label={tx("age", lang)} value={`${patient.age} ${tx("years", lang)}`} />
            <Field label={tx("nationality", lang)} value={patient.nationality || "—"} />
            <Field label={tx("nationalId", lang)} value={patient.nationalId} />
            <Field label={tx("email", lang)} value={patient.email || "—"} />
            <Field label={tx("bloodGroup", lang)} value={patient.bloodGroup || "—"} />
          </Section>
        </div>

        <div className="bg-card rounded-lg border border-border p-6 space-y-8">
          <Section title={tx("address", lang)}>
            <Field label={tx("buildingNo", lang)} value={patient.buildingNo || "—"} />
            <Field label={tx("area", lang)} value={patient.area || "—"} />
            <Field label={tx("city", lang)} value={patient.city || "—"} />
            <Field label={tx("state", lang)} value={patient.state || "—"} />
            <Field label={tx("country", lang)} value={patient.country || "—"} />
            <Field label={tx("phone", lang)} value={patient.phone} />
            <Field label={tx("postcode", lang)} value={patient.postcode || "—"} />
          </Section>

          <Section title={tx("additionalInformation", lang)}>
            <Field label={tx("aliasNames", lang)} value={patient.aliasNames || "—"} />
            <Field label={tx("employer", lang)} value={patient.employer || "—"} />
            <Field label={tx("disability", lang)} value={patient.disability || "—"} />
          </Section>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-sm font-semibold mb-4 pb-2 border-b border-border">{tx("reportsDocuments", lang)}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-md border border-border bg-secondary/30">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{tx("patientDocuments", lang)}</p>
                <p className="text-xs text-muted-foreground">{tx("noDocuments", lang)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-md border border-border bg-secondary/30">
              <ClipboardList className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{tx("diagnosticReports", lang)}</p>
                <p className="text-xs text-muted-foreground">{tx("noReports", lang)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
