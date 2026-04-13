import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProviderFormPage() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSave = () => {
    setFeedback({ type: "success", message: "Healthcare provider registered successfully." });
  };

  return (
    <DashboardLayout>
      <PageHeader title="Add Healthcare Provider" description="Register a new healthcare provider." />

      <div className="max-w-3xl">
        {feedback && (
          <div className={`mb-4 flex items-center gap-2 text-sm px-4 py-3 rounded-md ${
            feedback.type === "success" ? "text-primary bg-primary/10" : "text-destructive bg-destructive/10"
          }`}>
            {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {feedback.message}
          </div>
        )}

        <div className="bg-card rounded-lg border border-border p-6 space-y-8">
          {/* Personal Info */}
          <section>
            <h3 className="text-sm font-medium mb-4 pb-2 border-b border-border">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input placeholder="Enter full name" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="email@healthprime.sa" />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" placeholder="Set initial password" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="+966 5X XXX XXXX" />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label>Address</Label>
                <Input placeholder="Enter address" />
              </div>
            </div>
          </section>

          {/* Professional Info */}
          <section>
            <h3 className="text-sm font-medium mb-4 pb-2 border-b border-border">Professional Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="nurse">Nurse</SelectItem>
                    <SelectItem value="admin">E-Health Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Specialty</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select specialty" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family">Family Medicine</SelectItem>
                    <SelectItem value="pediatrics">Pediatrics</SelectItem>
                    <SelectItem value="internal">Internal Medicine</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>License Number</Label>
                <Input placeholder="e.g. SM-20456" />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input placeholder="Enter department" />
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <Button onClick={handleSave}>Save Healthcare Provider</Button>
            <Button variant="outline" onClick={() => navigate("/providers")}>Cancel</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
