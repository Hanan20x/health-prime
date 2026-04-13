import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/shared/StatCard";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Thermometer,
  Heart,
  Activity,
  Wind,
  AlertTriangle,
  Search,
  RefreshCw,
  Printer,
  Plus,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const patient = {
  name: "Ahmed Mohammed Al-Rashid",
  nationalId: "1098765432",
  gender: "Male",
  age: 41,
  allergies: ["Penicillin"],
};

const tempData = [
  { date: "Jan 5", value: 36.5 },
  { date: "Jan 8", value: 36.8 },
  { date: "Jan 10", value: 37.0 },
  { date: "Jan 12", value: 36.6 },
  { date: "Jan 15", value: 36.8 },
];

const hrData = [
  { date: "Jan 5", value: 70 },
  { date: "Jan 8", value: 68 },
  { date: "Jan 10", value: 72 },
  { date: "Jan 12", value: 74 },
  { date: "Jan 15", value: 72 },
];

const bpData = [
  { date: "Jan 5", systolic: 118, diastolic: 76 },
  { date: "Jan 8", systolic: 122, diastolic: 80 },
  { date: "Jan 10", systolic: 120, diastolic: 78 },
  { date: "Jan 12", systolic: 116, diastolic: 74 },
  { date: "Jan 15", systolic: 120, diastolic: 80 },
];

const chartCardClass = "bg-card rounded-lg border border-border p-5";

const vitalsHistory = [
  { date: "Jan 15", time: "09:30", temp: "36.8°C", bp: "120/80", hr: "72", rr: "16", spo2: "98%", weight: "72 kg", recordedBy: "Nurse Hala" },
  { date: "Jan 12", time: "08:15", temp: "36.6°C", bp: "116/74", hr: "74", rr: "15", spo2: "99%", weight: "72 kg", recordedBy: "Nurse Amal" },
  { date: "Jan 10", time: "10:00", temp: "37.0°C", bp: "120/78", hr: "72", rr: "16", spo2: "98%", weight: "71.5 kg", recordedBy: "Nurse Hala" },
  { date: "Jan 8", time: "08:45", temp: "36.8°C", bp: "122/80", hr: "68", rr: "14", spo2: "99%", weight: "71.5 kg", recordedBy: "Nurse Amal" },
  { date: "Jan 5", time: "09:00", temp: "36.5°C", bp: "118/76", hr: "70", rr: "16", spo2: "98%", weight: "72 kg", recordedBy: "Nurse Hala" },
];

export default function VitalsChartsPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"charts" | "tabular">("charts");

  return (
    <DashboardLayout>
      {/* Patient Context Bar */}
      <div className="bg-card rounded-lg border border-border p-4 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
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
          </div>
          {patient.allergies.length > 0 && (
            <div className="flex items-center gap-2 text-xs bg-destructive/10 text-destructive px-3 py-1.5 rounded-md">
              <AlertTriangle className="w-3.5 h-3.5" /> Allergies: {patient.allergies.join(", ")}
            </div>
          )}
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Panel</Label>
            <Select defaultValue="general">
              <SelectTrigger className="w-[200px] bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Vital Signs</SelectItem>
                <SelectItem value="cardio">Cardiovascular</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input type="date" defaultValue="2024-01-01" className="w-[160px] bg-card" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input type="date" defaultValue="2024-01-31" className="w-[160px] bg-card" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Time Range</Label>
            <Select defaultValue="all">
              <SelectTrigger className="w-[140px] bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Day</SelectItem>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="evening">Evening</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9"><Search className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="h-9 w-9"><RefreshCw className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="h-9 w-9"><Printer className="w-4 h-4" /></Button>
          <Button size="sm" className="gap-1.5" onClick={() => navigate("/vitals/record")}>
            <Plus className="w-4 h-4" /> New Entry
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-1 mb-6">
        {(["charts", "tabular"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === mode
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            {mode === "charts" ? "Graph Charts" : "Tabular Chart"}
          </button>
        ))}
      </div>

      {/* Latest Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Temperature" value="36.8°C" icon={Thermometer} />
        <StatCard title="Heart Rate" value="72 bpm" icon={Heart} />
        <StatCard title="Blood Pressure" value="120/80" icon={Activity} />
        <StatCard title="SpO2" value="98%" icon={Wind} />
      </div>

      {viewMode === "charts" && (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className={chartCardClass}>
              <h3 className="text-sm font-medium mb-4">Temperature Over Time</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={tempData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[35, 39]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name="°C" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className={chartCardClass}>
              <h3 className="text-sm font-medium mb-4">Heart Rate Over Time</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={hrData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 4 }} name="bpm" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-2">
              <div className={chartCardClass}>
                <h3 className="text-sm font-medium mb-4">Blood Pressure Over Time</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={bpData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[60, 140]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="systolic" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name="Systolic" />
                    <Line type="monotone" dataKey="diastolic" stroke="hsl(var(--info))" strokeWidth={2} dot={{ r: 4 }} name="Diastolic" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* History Table (always shown in tabular mode, below charts in chart mode) */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-medium">Vitals History</h3>
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
                <th className="text-left px-4 py-3 font-medium">Weight</th>
                <th className="text-left px-4 py-3 font-medium">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {vitalsHistory.map((v, i) => (
                <tr key={i}>
                  <td className="px-4 py-3">{v.date}</td>
                  <td className="px-4 py-3">{v.time}</td>
                  <td className="px-4 py-3">{v.temp}</td>
                  <td className="px-4 py-3">{v.bp}</td>
                  <td className="px-4 py-3">{v.hr}</td>
                  <td className="px-4 py-3">{v.rr}</td>
                  <td className="px-4 py-3">{v.spo2}</td>
                  <td className="px-4 py-3">{v.weight}</td>
                  <td className="px-4 py-3">{v.recordedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
