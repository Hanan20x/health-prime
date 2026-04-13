import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserRound,
  HeartPulse,
  UserCheck,
  Plus,
  BarChart3,
  Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const recentActivity = [
  { id: 1, action: "Vital signs recorded", patient: "Ahmed Al-Rashid", provider: "Dr. Fatima", time: "10 min ago" },
  { id: 2, action: "New patient registered", patient: "Sara Al-Otaibi", provider: "Nurse Hala", time: "25 min ago" },
  { id: 3, action: "Healthcare provider added", patient: "—", provider: "Admin", time: "1 hr ago" },
  { id: 4, action: "Vital signs recorded", patient: "Mohammed Al-Harbi", provider: "Dr. Khalid", time: "2 hrs ago" },
  { id: 5, action: "Patient record updated", patient: "Noura Al-Salem", provider: "Nurse Amal", time: "3 hrs ago" },
];

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <PageHeader
        title="Welcome back, Admin"
        description="Here's an overview of today's activity at Alraith Primary Healthcare Center."
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Healthcare Providers" value={48} icon={Users} description="+2 this week" />
        <StatCard title="Total Patients" value={1243} icon={UserRound} description="+15 this week" />
        <StatCard title="Today's Vitals" value={37} icon={HeartPulse} description="Recorded today" />
        <StatCard title="Active Staff" value={24} icon={UserCheck} description="Currently on duty" />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate("/providers/new")} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" /> Add Healthcare Provider
          </Button>
          <Button onClick={() => navigate("/patients/new")} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" /> Add Patient
          </Button>
          <Button onClick={() => navigate("/vitals/record")} variant="outline" className="gap-2">
            <HeartPulse className="w-4 h-4" /> Record Vitals
          </Button>
          <Button onClick={() => navigate("/vitals/charts")} variant="outline" className="gap-2">
            <BarChart3 className="w-4 h-4" /> View Charts
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-lg border border-border">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">Recent Activity</h2>
        </div>
        <div className="divide-y divide-border">
          {recentActivity.map((item) => (
            <div key={item.id} className="px-5 py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">{item.action}</p>
                <p className="text-xs text-muted-foreground">
                  {item.patient !== "—" && `Patient: ${item.patient} · `}By {item.provider}
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
