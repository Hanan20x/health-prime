import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLang } from "@/hooks/useLang";
import { tx } from "@/lib/i18n";
import { MapPin, Building, ActivitySquare, Network, HeartPulse, Stethoscope, Baby, Pill, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  const { lang } = useLang();
  
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Alraith Primary Healthcare Center Overview
            </h1>
            <p className="text-muted-foreground mt-2 max-w-3xl leading-relaxed">
              While specific, granular operational data for individual clinics is not always published extensively, 
              <strong> Alraith Primary Healthcare Center</strong> operates within the standard framework established 
              by the Saudi Arabian government for regional clinics. Here is a factual overview of its context, function, 
              and role within the local health system.
            </p>
          </div>
        </div>

        {/* Location & Administration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="h-64 bg-muted/30 w-full relative flex items-center justify-center border-b overflow-hidden">
              {/* Note: The user can replace this placeholder with their uploaded image by placing it in public/images/ */}
              <img 
                src="/images/clinic-reception.jpg" 
                alt="Clinic Reception" 
                className="absolute inset-0 w-full h-full object-cover object-bottom"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/10 backdrop-blur-[2px] -z-10">
                <Building className="w-12 h-12 text-muted-foreground/50 mb-2" />
                <span className="text-sm text-muted-foreground/70">Reception Image Placeholder</span>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Location and Administration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <div>
                <strong className="text-foreground">Location:</strong> Situated in the Al-Raith governorate, a mountainous 
                region located in the Jazan Province of southwestern Saudi Arabia.
              </div>
              <div>
                <strong className="text-foreground">Governing Body:</strong> Operated and regulated by the <strong>Saudi Ministry of Health (MOH)</strong>. 
                It is part of a broader initiative to ensure that essential healthcare is geographically accessible to all regional communities.
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm overflow-hidden">
             <div className="h-64 bg-muted/30 w-full relative flex items-center justify-center border-b overflow-hidden">
              <img 
                src="/images/clinic-manager.jpg" 
                alt="Clinic Manager" 
                className="absolute inset-0 w-full h-full object-cover object-top"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/10 backdrop-blur-[2px] -z-10">
                <Network className="w-12 h-12 text-muted-foreground/50 mb-2" />
                <span className="text-sm text-muted-foreground/70">Manager Image Placeholder</span>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-5 h-5 text-primary" />
                Healthcare Network Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <div>
                <strong className="text-foreground">The Triage and Referral System:</strong> The center is designed to handle 
                foundational medical needs. When a patient requires advanced diagnostics, specialized treatments, or inpatient care, 
                the PHC acts as a triage point. Patients are stabilized and referred to larger secondary or tertiary facilities within 
                the MOH network, such as <strong>Al-Raith General Hospital</strong> or <strong>King Fahad Central Hospital</strong> in Jazan.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scope of Services */}
        <div className="space-y-6 pt-6">
          <div className="flex items-center gap-3 border-b pb-4">
            <ActivitySquare className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-semibold tracking-tight">Scope of Services</h2>
          </div>
          <p className="text-muted-foreground">
            As a Primary Healthcare Center (PHC), the facility acts as the community's first point of contact with the healthcare system. 
            Rather than handling severe traumas or complex surgeries, its focus is on foundational, preventive, and outpatient care. Standard services include:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            
            {/* General Outpatient */}
            <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Stethoscope className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-lg">General Outpatient Care</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Routine medical consultations, basic diagnostics, and treatment for common illnesses and minor injuries.
                </p>
              </CardContent>
            </Card>

            {/* Preventative Medicine */}
            <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <HeartPulse className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Preventative Medicine</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Administration of national vaccination programs, routine wellness check-ups, and early screenings for communicable and non-communicable diseases.
                </p>
              </CardContent>
            </Card>

            {/* Maternal and Child Health */}
            <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Baby className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Maternal & Child Health</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Antenatal tracking, basic pediatric monitoring, and family planning services.
                </p>
              </CardContent>
            </Card>

            {/* Chronic Disease */}
            <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Pill className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Chronic Disease</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Ongoing support, medication dispersal, and lifestyle monitoring for prevalent long-term conditions like diabetes, asthma, and hypertension.
                </p>
              </CardContent>
            </Card>

            {/* Health Education */}
            <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Health Education</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Providing localized guidance on nutrition, hygiene, and public health awareness.
                </p>
              </CardContent>
            </Card>

            {/* Image placeholders for the other two images uploaded by user (dental and pharmacy) */}
            <Card className="border-border/50 shadow-sm overflow-hidden md:col-span-1">
              <div className="h-full min-h-[160px] bg-muted/30 w-full relative flex items-center justify-center">
                 <img 
                  src="/images/clinic-pharmacy.jpg" 
                  alt="Clinic Pharmacy" 
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/10 backdrop-blur-[2px] -z-10">
                  <Pill className="w-10 h-10 text-muted-foreground/50 mb-2" />
                  <span className="text-sm text-muted-foreground/70">Pharmacy Image</span>
                </div>
              </div>
            </Card>

            <Card className="border-border/50 shadow-sm overflow-hidden md:col-span-1 lg:col-span-2">
              <div className="h-full min-h-[160px] bg-muted/30 w-full relative flex items-center justify-center">
                 <img 
                  src="/images/clinic-dental.jpg" 
                  alt="Clinic Dental" 
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/10 backdrop-blur-[2px] -z-10">
                  <Stethoscope className="w-10 h-10 text-muted-foreground/50 mb-2" />
                  <span className="text-sm text-muted-foreground/70">Dental Clinic Image</span>
                </div>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
