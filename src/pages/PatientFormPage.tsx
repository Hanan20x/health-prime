import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PatientFormPage() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSave = () => {
    setFeedback({ type: "success", message: "Patient registered successfully." });
  };

  return (
    <DashboardLayout>
      <PageHeader title="Add Patient" description="Register a new patient record." />

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
          {/* Personal Information */}
          <section>
            <h3 className="text-sm font-medium mb-4 pb-2 border-b border-border">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input placeholder="First name" />
              </div>
              <div className="space-y-2">
                <Label>Second Name</Label>
                <Input placeholder="Second name" />
              </div>
              <div className="space-y-2">
                <Label>Third Name</Label>
                <Input placeholder="Third name" />
              </div>
              <div className="space-y-2">
                <Label>Fourth Name (Family)</Label>
                <Input placeholder="Family name" />
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
              <div className="space-y-2">
                <Label>Nationality</Label>
                <Input placeholder="e.g. Saudi" />
              </div>
              <div className="space-y-2">
                <Label>National ID</Label>
                <Input placeholder="10-digit National ID" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="patient@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Blood Group</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger>
                  <SelectContent>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="+966 5X XXX XXXX" />
              </div>
            </div>
          </section>

          {/* Address */}
          <section>
            <h3 className="text-sm font-medium mb-4 pb-2 border-b border-border">Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Building No</Label>
                <Input placeholder="Building number" />
              </div>
              <div className="space-y-2">
                <Label>Area</Label>
                <Input placeholder="Area / District" />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input placeholder="City" />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input placeholder="State / Region" />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input defaultValue="Saudi Arabia" />
              </div>
              <div className="space-y-2">
                <Label>Postcode</Label>
                <Input placeholder="Postcode" />
              </div>
            </div>
          </section>

          {/* Additional Information */}
          <section>
            <h3 className="text-sm font-medium mb-4 pb-2 border-b border-border">Additional Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Alias Names</Label>
                <Input placeholder="Alternative names (if any)" />
              </div>
              <div className="space-y-2">
                <Label>Employer</Label>
                <Input placeholder="Employer name" />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label>Disability</Label>
                <Textarea placeholder="Describe any disability (if applicable)" rows={2} />
              </div>
            </div>
          </section>

          {/* Medical Info */}
          <section>
            <h3 className="text-sm font-medium mb-4 pb-2 border-b border-border">Medical Information</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Allergies</Label>
                <Textarea placeholder="List known allergies (if any)" rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Chronic Conditions</Label>
                <Textarea placeholder="List chronic conditions (if any)" rows={2} />
              </div>
            </div>
          </section>

          {/* Emergency Contact */}
          <section>
            <h3 className="text-sm font-medium mb-4 pb-2 border-b border-border">Emergency Contact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input placeholder="Emergency contact name" />
              </div>
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input placeholder="+966 5X XXX XXXX" />
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <Button onClick={handleSave}>Save Patient</Button>
            <Button variant="outline" onClick={() => navigate("/patients")}>Cancel</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
