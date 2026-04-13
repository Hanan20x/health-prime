import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Printer,
  RefreshCw,
  Filter,
  AlertTriangle,
  HeartPulse,
  Thermometer,
  Activity,
} from "lucide-react";

const patient = {
  name: "Ahmed Mohammed Al-Rashid",
  nationalId: "1098765432",
  gender: "Male",
  dob: "1985-03-12",
  age: 41,
  doctor: "Dr. Khalid Al-Rashid",
  facility: "Alraith Primary Healthcare Center",
  visitTime: "09:30 AM — Apr 8, 2026",
  allergies: ["Penicillin", "Sulfa drugs"],
  vitals: { temp: "36.8°C", hr: "72 bpm", bp: "120/80", spo2: "98%", rr: "16/min" },
};

const emrSections = [
  { id: "cc", title: "Chief Complaints", content: "Patient reports persistent headache for 3 days, mild fever." },
  { id: "pi", title: "Present Illness", content: "Headache started 3 days ago, gradual onset, bilateral, throbbing. Associated with mild fever (37.5°C at home). No nausea, vomiting, or visual disturbances." },
  { id: "pmh", title: "Past Medical History", content: "Hypertension (diagnosed 2018), Type 2 Diabetes (diagnosed 2020). No surgical history." },
  { id: "fh", title: "Family History", content: "Father: Hypertension, Diabetes. Mother: Hypothyroidism. No family history of malignancy." },
  { id: "mh", title: "Medication History", content: "Amlodipine 5mg OD, Metformin 500mg BD. Compliant with medications." },
  { id: "proc", title: "Procedures", content: "No procedures performed during this visit." },
];

const orders = [
  { id: 1, type: "Lab", description: "CBC with Differential", status: "Pending", date: "Apr 8, 2026" },
  { id: 2, type: "Lab", description: "HbA1c", status: "Pending", date: "Apr 8, 2026" },
  { id: 3, type: "Imaging", description: "Chest X-Ray PA", status: "Completed", date: "Apr 5, 2026" },
  { id: 4, type: "Medication", description: "Paracetamol 500mg PRN", status: "Active", date: "Apr 8, 2026" },
];

const vitalsHistory = [
  { time: "09:30", temp: "36.8°C", bp: "120/80", hr: "72", rr: "16", spo2: "98%" },
  { time: "08:00", temp: "37.0°C", bp: "118/76", hr: "68", rr: "15", spo2: "99%" },
];

export default function PatientEMRPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["cc", "pi"]));
  const [orderFilter, setOrderFilter] = useState<"my" | "all" | "future">("my");

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <DashboardLayout>
      {/* Patient Banner */}
      <div className="bg-card rounded-lg border border-border p-4 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Patient</p>
              <p className="font-semibold">{patient.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">National ID</p>
              <p className="font-medium">{patient.nationalId}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gender / DOB / Age</p>
              <p className="font-medium">{patient.gender} · {patient.dob} · {patient.age}y</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Doctor</p>
              <p className="font-medium">{patient.doctor}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Facility</p>
              <p className="font-medium">{patient.facility}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Visit</p>
              <p className="font-medium">{patient.visitTime}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8"><Printer className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8"><RefreshCw className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8"><Filter className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Vital indicators + allergy alerts */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs bg-secondary/50 px-3 py-1.5 rounded-md">
            <Thermometer className="w-3.5 h-3.5 text-muted-foreground" /> {patient.vitals.temp}
          </div>
          <div className="flex items-center gap-2 text-xs bg-secondary/50 px-3 py-1.5 rounded-md">
            <HeartPulse className="w-3.5 h-3.5 text-muted-foreground" /> {patient.vitals.hr}
          </div>
          <div className="flex items-center gap-2 text-xs bg-secondary/50 px-3 py-1.5 rounded-md">
            <Activity className="w-3.5 h-3.5 text-muted-foreground" /> BP: {patient.vitals.bp}
          </div>
          <div className="flex items-center gap-2 text-xs bg-secondary/50 px-3 py-1.5 rounded-md">
            SpO2: {patient.vitals.spo2}
          </div>
          {patient.allergies.length > 0 && (
            <div className="flex items-center gap-2 text-xs bg-destructive/10 text-destructive px-3 py-1.5 rounded-md">
              <AlertTriangle className="w-3.5 h-3.5" /> Allergies: {patient.allergies.join(", ")}
            </div>
          )}
        </div>
      </div>

      {/* Main EMR Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel — Clinical Notes */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium">Current Visit</h2>
          </div>

          {emrSections.map((section) => {
            const isOpen = expandedSections.has(section.id);
            return (
              <div key={section.id} className="bg-card rounded-lg border border-border">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    {section.title}
                  </div>
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-0">
                    <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Panel — Summary, Vitals, Orders */}
        <div className="space-y-4">
          {/* Vitals Table */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="text-sm font-medium mb-3">Vital Signs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left py-2 pr-2 font-medium">Time</th>
                    <th className="text-left py-2 pr-2 font-medium">Temp</th>
                    <th className="text-left py-2 pr-2 font-medium">BP</th>
                    <th className="text-left py-2 pr-2 font-medium">HR</th>
                    <th className="text-left py-2 pr-2 font-medium">RR</th>
                    <th className="text-left py-2 font-medium">SpO2</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {vitalsHistory.map((v, i) => (
                    <tr key={i}>
                      <td className="py-2 pr-2">{v.time}</td>
                      <td className="py-2 pr-2">{v.temp}</td>
                      <td className="py-2 pr-2">{v.bp}</td>
                      <td className="py-2 pr-2">{v.hr}</td>
                      <td className="py-2 pr-2">{v.rr}</td>
                      <td className="py-2">{v.spo2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Orders */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="text-sm font-medium mb-3">Orders</h3>
            <div className="flex gap-1 mb-3">
              {(["my", "all", "future"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setOrderFilter(f)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    orderFilter === f
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  {f === "my" ? "My Orders" : f === "all" ? "All Orders" : "Future Orders"}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between text-xs py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium">{order.description}</p>
                    <p className="text-muted-foreground">{order.type} · {order.date}</p>
                  </div>
                  <StatusBadge
                    variant={
                      order.status === "Completed" ? "active" :
                      order.status === "Pending" ? "pending" : "active"
                    }
                  >
                    {order.status}
                  </StatusBadge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
