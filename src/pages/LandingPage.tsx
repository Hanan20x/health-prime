import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HeartPulse, Shield, Activity, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/hooks/useLang";
import { tx } from "@/lib/i18n";

export default function LandingPage() {
  const [logoError, setLogoError] = useState(false);
  const navigate = useNavigate();
  const { lang, toggleLang, isArabic } = useLang();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-white flex flex-col" dir={isArabic ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-16 border-b border-primary/10 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <HeartPulse className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-primary tracking-tight">{tx("appTitle", lang)}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLang}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 border-r border-border mr-1"
          >
            {lang === "en" ? "عربي" : "EN"}
          </button>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary font-medium hover:bg-primary/5 h-9"
            onClick={() => navigate("/login")}
          >
            {isArabic ? "تسجيل الدخول" : "Sign In"}
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="max-w-6xl w-full">
          <div className="bg-white/95 border border-primary/10 shadow-[0_40px_120px_-80px_rgba(15,23,42,0.15)] rounded-[2rem] overflow-hidden backdrop-blur-sm">
            <div className="p-12 text-center bg-gradient-to-b from-primary/10 via-white to-white">
              <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
                <HeartPulse className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-5xl font-bold text-foreground mb-4">{tx("appTitle", lang)}</h1>
              <p className="text-xl font-semibold text-primary mb-4">
                {lang === "ar" ? "مركز الريث للرعاية الصحية الأولية" : "Alraith Primary Healthcare Center"}
              </p>
              <p className="text-base text-muted-foreground mb-12 max-w-2xl mx-auto">
                {tx("secureSystem", lang)}
              </p>
            </div>

            <div className="grid gap-8 px-8 pb-12 md:grid-cols-3 md:px-12">
              <div className="rounded-3xl border border-primary/10 p-8 text-left shadow-sm bg-primary/5">
                <Shield className="w-7 h-7 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-foreground">{tx("secureAccess", lang)}</h3>
                <p className="text-sm text-muted-foreground">{tx("secureAccessDesc", lang)}</p>
              </div>
              <div className="rounded-3xl border border-primary/10 p-8 text-left shadow-sm bg-primary/5">
                <Activity className="w-7 h-7 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-foreground">{tx("medicalRecords", lang)}</h3>
                <p className="text-sm text-muted-foreground">{tx("medicalRecordsDesc", lang)}</p>
              </div>
              <div className="rounded-3xl border border-primary/10 p-8 text-left shadow-sm bg-primary/5">
                <Users className="w-7 h-7 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-foreground">{tx("providerManagement", lang)}</h3>
                <p className="text-sm text-muted-foreground">{tx("providerManagementDesc", lang)}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 px-6 py-8 md:px-10">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <div className="flex items-center gap-4">
                  {!logoError ? (
                    <img
                      src="/ministry-of-health-logo.png"
                      alt="Saudi Ministry of Health Logo"
                      className="h-16 w-auto object-contain"
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                      <HeartPulse className="w-8 h-8 text-primary" />
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">{tx("ministryOfHealth", lang)}</p>
                    <p className="text-xs text-muted-foreground">{tx("officialPartner", lang)}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">{tx("welcomeTo", lang)}</p>
                  <p className="text-xs text-muted-foreground">{tx("unifiedPlatform", lang)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
