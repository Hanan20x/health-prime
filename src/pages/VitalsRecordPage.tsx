import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  HeartPulse,
  Thermometer,
  Activity,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const patient = {
  name: "Ahmed Mohammed Al-Rashid",
  nationalId: "1098765432",
  gender: "Male",
  age: 41,
  doctor: "Dr. Khalid Al-Rashid",
  facility: "Alraith PHC",
  visitTime: "09:30 AM — Apr 8, 2026",
  bmi: "24.2",
  bp: "120/80",
  allergies: ["Penicillin"],
};

const clinicalPanels = [
  { id: "general", label: "General Vital Signs", active: true },
  { id: "neuro", label: "Neurological", active: false },
  { id: "cardio", label: "Cardiovascular", active: false },
  { id: "respiratory", label: "Respiratory", active: false },
];

export default function VitalsRecordPage() {
  const [activeTab, setActiveTab] = useState<"observation" | "tabular" | "charts">("observation");
  const [activePanel, setActivePanel] = useState("general");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSave = () => {
    setFeedback({ type: "success", message: "Vital signs saved successfully." });
  };

  return (
    <DashboardLayout>
      {/* Patient Context Bar */}
      <div className="bg-card rounded-lg border border-border p-4 mb-4">
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
              <p className="text-xs text-muted-foreground">Gender / Age</p>
              <p className="font-medium">{patient.gender} · {patient.age}y</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Visit</p>
              <p className="font-medium">{patient.visitTime}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2 text-xs bg-secondary/50 px-3 py-1.5 rounded-md">
            <Thermometer className="w-3.5 h-3.5 text-muted-foreground" /> BMI: {patient.bmi}
          </div>
          <div className="flex items-center gap-2 text-xs bg-secondary/50 px-3 py-1.5 rounded-md">
            <Activity className="w-3.5 h-3.5 text-muted-foreground" /> BP: {patient.bp}
          </div>
          {patient.allergies.length > 0 && (
            <div className="flex items-center gap-2 text-xs bg-destructive/10 text-destructive px-3 py-1.5 rounded-md">
              <AlertTriangle className="w-3.5 h-3.5" /> Allergies: {patient.allergies.join(", ")}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {(["observation", "tabular", "charts"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            {tab === "observation" ? "Observation" : tab === "tabular" ? "Tabular View" : "Charts"}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`mb-4 flex items-center gap-2 text-sm px-4 py-3 rounded-md ${
          feedback.type === "success" ? "text-primary bg-primary/10" : "text-destructive bg-destructive/10"
        }`}>
          {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {feedback.message}
        </div>
      )}

      {activeTab === "observation" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel — Clinical Panels */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border border-border">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Clinical Panels</p>
              </div>
              <div className="p-2 space-y-1">
                {clinicalPanels.map((panel) => (
                  <button
                    key={panel.id}
                    onClick={() => setActivePanel(panel.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors ${
                      activePanel === panel.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-secondary/50"
                    }`}
                  >
                    {panel.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-3">
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-sm font-medium mb-5 pb-3 border-b border-border flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-primary" /> General Vital Signs
              </h3>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mb-6">
                <div className="space-y-2">
                  <Label>Observation Date</Label>
                  <Input type="date" defaultValue="2026-04-08" />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input type="time" defaultValue="09:30" />
                </div>
              </div>

              {/* Measurements */}
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Measurements</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 mb-6">
                <div className="space-y-2">
                  <Label>Height (cm)</Label>
                  <Input type="number" placeholder="170" />
                </div>
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input type="number" step="0.1" placeholder="70.0" />
                </div>
                <div className="space-y-2">
                  <Label>BMI</Label>
                  <Input type="number" step="0.1" placeholder="Auto-calculated" disabled className="bg-secondary" />
                </div>
                <div className="space-y-2">
                  <Label>Temperature (°C)</Label>
                  <Input type="number" step="0.1" placeholder="36.5" />
                </div>
                <div className="space-y-2">
                  <Label>Pulse Rate (bpm)</Label>
                  <Input type="number" placeholder="72" />
                </div>
                <div className="space-y-2">
                  <Label>Respiratory Rate (/min)</Label>
                  <Input type="number" placeholder="16" />
                </div>
                <div className="space-y-2">
                  <Label>SpO2 (%)</Label>
                  <Input type="number" placeholder="98" />
                </div>
                <div className="space-y-2">
                  <Label>Systolic BP (mmHg)</Label>
                  <Input type="number" placeholder="120" />
                </div>
                <div className="space-y-2">
                  <Label>Diastolic BP (mmHg)</Label>
                  <Input type="number" placeholder="80" />
                </div>
              </div>

              {/* Additional Info */}
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Additional Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 mb-6">
                <div className="space-y-2">
                  <Label>RBS (mg/dL)</Label>
                  <Input type="number" placeholder="Random Blood Sugar" />
                </div>
                <div className="space-y-2">
                  <Label>Smoking</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="non-smoker">Non-Smoker</SelectItem>
                      <SelectItem value="smoker">Smoker</SelectItem>
                      <SelectItem value="ex-smoker">Ex-Smoker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Physical Activity</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentary</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 lg:col-span-3 space-y-2">
                  <Label>Disability</Label>
                  <Input placeholder="Describe any disability (if applicable)" />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2 mb-6">
                <Label>Notes</Label>
                <Textarea placeholder="Additional clinical notes or observations..." rows={3} />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <Button onClick={handleSave} className="gap-2">
                  <HeartPulse className="w-4 h-4" /> Save
                </Button>
                <Button variant="outline">Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "tabular" && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-medium">Vitals History — Tabular View</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50 text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Time</th>
                  <th className="text-left px-4 py-3 font-medium">Temp</th>
                  <th className="text-left px-4 py-3 font-medium">BP</th>
                  <th className="text-left px-4 py-3 font-medium">HR</th>
                  <th className="text-left px-4 py-3 font-medium">RR</th>
                  <th className="text-left px-4 py-3 font-medium">SpO2</th>
                  <th className="text-left px-4 py-3 font-medium">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr><td className="px-4 py-3">Apr 8</td><td className="px-4 py-3">09:30</td><td className="px-4 py-3">36.8°C</td><td className="px-4 py-3">120/80</td><td className="px-4 py-3">72</td><td className="px-4 py-3">16</td><td className="px-4 py-3">98%</td><td className="px-4 py-3">Nurse Hala</td></tr>
                <tr><td className="px-4 py-3">Apr 5</td><td className="px-4 py-3">08:00</td><td className="px-4 py-3">37.0°C</td><td className="px-4 py-3">118/76</td><td className="px-4 py-3">68</td><td className="px-4 py-3">15</td><td className="px-4 py-3">99%</td><td className="px-4 py-3">Nurse Amal</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "charts" && (
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-sm text-muted-foreground">Chart view — navigate to Vital Charts page for full chart analysis.</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.href = "/vitals/charts"}>
            Open Vital Charts
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
}
