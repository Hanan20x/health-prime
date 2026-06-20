import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  UserRound,
  HeartPulse,
  UserCheck,
  Plus,
  BarChart3,
  Activity,
  Stethoscope,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Brain,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/api/client";
import type { DashboardSummary, UserOut } from "@/api/types";
import { useLang } from "@/hooks/useLang";
import { useAuth } from "@/hooks/useAuth";
import { tx, txStatTitle, txStatDesc, txRole, txAction, txRelativeTime } from "@/lib/i18n";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const { role, canManageProviders, canRegisterPatients, canRecordVitals } = useAuth();

  const { data: me } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiFetch<UserOut>("/auth/me"),
  });
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () => apiFetch<DashboardSummary>("/dashboard/summary"),
  });

  let welcomeName = "";
  if (me?.fullName) {
    const parts = me.fullName.split(/\s+/);
    const isDr = parts[0].toLowerCase().replace(".", "") === "dr";
    const firstName = isDr && parts.length > 1 ? `${parts[0]} ${parts[1]}` : parts[0];
    
    if (isDr || role === "Doctor") {
      welcomeName = isDr ? firstName : `Dr. ${firstName}`;
    } else {
      welcomeName = role ? `${txRole(role, lang)} ${firstName}` : firstName;
    }
  }

  // Dynamic icon based on index and user role
  const getIconForIdx = (i: number) => {
    if (role === "Doctor") {
      // Completion Rate, AI Optimized, Urgent Cases, Patients Today
      return [CheckCircle, TrendingUp, AlertCircle, UserRound][i] ?? Users;
    } else if (role === "Nurse") {
      // Vitals Today, Today's Bookings, Alert Cases
      return [HeartPulse, Calendar, AlertCircle][i] ?? Users;
    } else {
      // Active Providers, Total Patients, Today's Bookings, AI Resolved, Shift Coverage, System Logs
      return [Users, UserRound, Calendar, TrendingUp, UserCheck, AlertCircle][i] ?? Users;
    }
  };

  let gridColsClass = "lg:grid-cols-3";
  if (role === "Doctor") gridColsClass = "lg:grid-cols-4";
  else if (role === "E-Health Admin") gridColsClass = "lg:grid-cols-3 xl:grid-cols-6";

  return (
    <DashboardLayout>
      <PageHeader
        title={welcomeName ? `${tx("welcomeBack", lang)}${lang === "ar" ? "،" : ","} ${welcomeName}` : tx("welcomeBack", lang)}
        description={tx("dashboardDescription", lang)}
      />

      {error && (
        <div className="mb-4 text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-md">
          {tx("couldNotLoad", lang)}
        </div>
      )}

      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${gridColsClass} gap-4 mb-8`}>
        {isLoading &&
          Array.from({ length: role === "Doctor" ? 4 : (role === "E-Health Admin" ? 6 : 3) }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-lg" />
          ))}
        {!isLoading &&
          data?.stats.map((s, idx) => {
            const Icon = getIconForIdx(idx);
            return (
              <StatCard
                key={s.title}
                title={txStatTitle(s.title, lang)}
                value={s.value}
                icon={Icon}
                description={txStatDesc(s.description, lang)}
              />
            );
          })}
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">{tx("quickActions", lang)}</h2>
        <div className="flex flex-wrap gap-3">
          {canManageProviders && (
            <Button onClick={() => navigate("/providers/new")} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" /> {tx("addProvider", lang)}
            </Button>
          )}
          {canRegisterPatients && (
            <Button onClick={() => navigate("/patients/new")} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" /> {tx("addPatient", lang)}
            </Button>
          )}
          {canRecordVitals && (
            <Button onClick={() => navigate("/vitals/record")} variant="outline" className="gap-2">
              <Stethoscope className="w-4 h-4" /> {tx("recordVitals", lang)}
            </Button>
          )}
          <Button onClick={() => navigate("/vitals/record?view=trends")} variant="outline" className="gap-2">
            <BarChart3 className="w-4 h-4" /> {tx("viewCharts", lang)}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">{tx("recentActivity", lang)}</h2>
        </div>
        {isLoading && (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}
        {!isLoading && data?.activity?.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            {tx("noData", lang)}
          </div>
        )}
        {!isLoading && data?.activity && data.activity.length > 0 &&
          <div className="divide-y divide-border">
            {data.activity.map((item) => {
              const isAI = item.action.includes("AI Diagnosis");
              const isManualDiag = item.action.includes("Diagnosis") && !isAI;
              
              return (
                <div key={item.id} className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Add an icon based on action type */}
                    {isAI ? (
                      <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
                        <Brain className="w-4 h-4 text-primary" />
                      </div>
                    ) : isManualDiag ? (
                      <div className="bg-blue-500/10 p-2 rounded-full flex-shrink-0">
                        <Stethoscope className="w-4 h-4 text-blue-500" />
                      </div>
                    ) : (
                      <div className="bg-muted p-2 rounded-full flex-shrink-0">
                        <Activity className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="min-w-0">
                      <p className="text-sm font-medium flex items-center flex-wrap gap-2">
                        {txAction(item.action, lang)}
                        {isAI && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary uppercase tracking-widest border border-primary/20">
                            AI Generated
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.patient !== "—" && (
                          <span className="font-semibold text-foreground/80 mr-1.5">
                            {item.patient}
                          </span>
                        )}
                        {item.patient !== "—" && "· "}
                        {isManualDiag || isAI ? (
                          <span>{item.provider}</span>
                        ) : (
                          <span>{tx("by", lang)} {item.provider}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{txRelativeTime(item.time, lang)}</span>
                </div>
              );
            })}
          </div>
        }
      </div>
    </DashboardLayout>
  );
}
