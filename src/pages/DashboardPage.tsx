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

  const userName = me?.fullName?.split(/\s+/)[0] ?? "";
  const welcomeName = role && userName ? `${txRole(role, lang)} ${userName}` : userName || "";

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-lg" />
          ))}
        {!isLoading &&
          data?.stats.map((s, idx) => {
            const icons = [Users, UserRound, HeartPulse, UserCheck];
            const Icon = icons[idx] ?? Users;
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
          <Button onClick={() => navigate("/vitals/charts")} variant="outline" className="gap-2">
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
        {!isLoading &&
          <div className="divide-y divide-border">
            {data.activity.map((item) => (
              <div key={item.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{txAction(item.action, lang)}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.patient !== "—" && `${tx("patient", lang)}: ${item.patient} · `}
                    {tx("by", lang)} {item.provider}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{txRelativeTime(item.time, lang)}</span>
              </div>
            ))}
          </div>
        }
      </div>
    </DashboardLayout>
  );
}
