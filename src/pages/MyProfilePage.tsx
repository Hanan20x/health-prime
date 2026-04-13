import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Building2 } from "lucide-react";

export default function MyProfilePage() {
  return (
    <DashboardLayout>
      <PageHeader title="My Profile" description="View and manage your account information." />

      <div className="max-w-3xl space-y-6">
        {/* Profile Card */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Admin User</h2>
              <p className="text-sm text-muted-foreground">E-Health Admin</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <Input defaultValue="Admin User" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input defaultValue="E-Health Admin" disabled className="bg-secondary" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <Input defaultValue="admin@healthprime.sa" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <Input defaultValue="+966 50 123 4567" />
              </div>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Department</Label>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <Input defaultValue="Administration" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-6 mt-6 border-t border-border">
            <Button>Save Changes</Button>
            <Button variant="outline">Cancel</Button>
          </div>
        </div>

        {/* Doctor Widget Customization Section (shown only for doctors) */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-sm font-medium mb-1">Dashboard Widget Customization</h3>
          <p className="text-xs text-muted-foreground mb-4">Select which widgets appear on your dashboard. (Doctor role only)</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              "Outpatients",
              "Consult / Referrals",
              "Lab Reports",
              "Emergency Patients",
              "Deficiency Records",
              "Appointments",
              "Confirm",
              "Diagnostic Reports",
            ].map((widget) => (
              <label
                key={widget}
                className="flex items-center gap-3 px-4 py-3 rounded-md border border-border bg-secondary/30 hover:bg-secondary/60 cursor-pointer transition-colors"
              >
                <input type="checkbox" className="rounded border-input text-primary focus:ring-primary" defaultChecked />
                <span className="text-sm">{widget}</span>
              </label>
            ))}
          </div>

          <div className="mt-4">
            <label className="flex items-center gap-3 text-sm text-muted-foreground cursor-pointer">
              <input type="checkbox" className="rounded border-input" />
              <span>Select All</span>
            </label>
          </div>

          <div className="flex items-center gap-3 pt-4 mt-4 border-t border-border">
            <Button>Save Widgets</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
