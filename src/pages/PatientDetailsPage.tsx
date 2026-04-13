import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Pencil, FileText, ClipboardList } from "lucide-react";

const patient = {
  firstName: "Ahmed",
  secondName: "Mohammed",
  thirdName: "Ibrahim",
  fourthName: "Al-Rashid",
  gender: "Male",
  dob: "1985-03-12",
  age: 41,
  nationality: "Saudi",
  nationalId: "1098765432",
  email: "ahmed.rashid@example.com",
  bloodGroup: "A+",
  phone: "+966 50 111 2233",
  buildingNo: "45",
  area: "Al Olaya",
  city: "Riyadh",
  state: "Riyadh Region",
  country: "Saudi Arabia",
  postcode: "11564",
  aliasNames: "Abu Mohammed",
  employer: "Saudi Aramco",
  disability: "None",
  status: "Registered" as const,
};

const statusMap = { Registered: "active" as const, "In Progress": "pending" as const, Discharged: "inactive" as const };

export default function PatientDetailsPage() {
  const navigate = useNavigate();

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section>
      <h3 className="text-sm font-medium mb-4 pb-2 border-b border-border">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">{children}</div>
    </section>
  );

  const Field = ({ label, value }: { label: string; value: string }) => (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );

  return (
    <DashboardLayout>
      <PageHeader
        title="Patient Details"
        description={`${patient.firstName} ${patient.fourthName} — National ID: ${patient.nationalId}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => navigate("/patients/emr/1")}>
              <ClipboardList className="w-4 h-4" /> Open EMR
            </Button>
            <Button variant="outline" className="gap-2">
              <Pencil className="w-4 h-4" /> Edit
            </Button>
          </div>
        }
      />

      <div className="max-w-4xl space-y-8">
        {/* Status */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-sm text-muted-foreground">Patient Status:</span>
            <StatusBadge variant={statusMap[patient.status]}>{patient.status}</StatusBadge>
          </div>

          <Section title="Personal Information">
            <Field label="First Name" value={patient.firstName} />
            <Field label="Second Name" value={patient.secondName} />
            <Field label="Third Name" value={patient.thirdName} />
            <Field label="Fourth Name (Family)" value={patient.fourthName} />
            <Field label="Gender" value={patient.gender} />
            <Field label="Date of Birth" value={patient.dob} />
            <Field label="Age" value={`${patient.age} years`} />
            <Field label="Nationality" value={patient.nationality} />
            <Field label="National ID" value={patient.nationalId} />
            <Field label="Email" value={patient.email} />
            <Field label="Blood Group" value={patient.bloodGroup} />
          </Section>
        </div>

        <div className="bg-card rounded-lg border border-border p-6 space-y-8">
          <Section title="Address">
            <Field label="Building No" value={patient.buildingNo} />
            <Field label="Area" value={patient.area} />
            <Field label="City" value={patient.city} />
            <Field label="State" value={patient.state} />
            <Field label="Country" value={patient.country} />
            <Field label="Phone" value={patient.phone} />
            <Field label="Postcode" value={patient.postcode} />
          </Section>

          <Section title="Additional Information">
            <Field label="Alias Names" value={patient.aliasNames} />
            <Field label="Employer" value={patient.employer} />
            <Field label="Disability" value={patient.disability} />
          </Section>
        </div>

        {/* Reports */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-sm font-medium mb-4 pb-2 border-b border-border">Reports & Documents</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-md border border-border bg-secondary/30">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Patient Documents</p>
                <p className="text-xs text-muted-foreground">No documents uploaded</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-md border border-border bg-secondary/30">
              <ClipboardList className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Diagnostic Reports</p>
                <p className="text-xs text-muted-foreground">No reports available</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
