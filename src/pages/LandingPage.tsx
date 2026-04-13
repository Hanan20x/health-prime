import { useNavigate } from "react-router-dom";
import { HeartPulse, Shield, Activity, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-16 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <HeartPulse className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-primary tracking-tight">Health Prime</span>
        </div>
        <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          English | العربية
        </button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-8">
            <HeartPulse className="w-10 h-10 text-primary" />
          </div>

          <h1 className="text-4xl font-bold text-foreground mb-2">Health Prime</h1>
          <p className="text-lg text-muted-foreground mb-2">
            Alraith Primary Healthcare Center
          </p>
          <p className="text-base text-muted-foreground/80 mb-10 max-w-lg mx-auto">
            A secure, efficient, and intelligent health information system
          </p>

          <Button size="lg" className="h-12 px-10 text-base" onClick={() => navigate("/login")}>
            Sign In to Continue
          </Button>

          {/* Features */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="bg-card rounded-lg border border-border p-5">
              <Shield className="w-6 h-6 text-primary mb-3" />
              <h3 className="text-sm font-medium mb-1">Secure Access</h3>
              <p className="text-xs text-muted-foreground">Role-based access for admins, doctors, and nurses.</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-5">
              <Activity className="w-6 h-6 text-primary mb-3" />
              <h3 className="text-sm font-medium mb-1">Clinical Records</h3>
              <p className="text-xs text-muted-foreground">Electronic medical records and vital signs tracking.</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-5">
              <Users className="w-6 h-6 text-primary mb-3" />
              <h3 className="text-sm font-medium mb-1">Healthcare Provider Management</h3>
              <p className="text-xs text-muted-foreground">Manage healthcare providers and patient registrations.</p>
            </div>
          </div>

          <p className="mt-12 text-xs text-muted-foreground/60">
            Ministry of Health — Kingdom of Saudi Arabia
          </p>
        </div>
      </main>
    </div>
  );
}
