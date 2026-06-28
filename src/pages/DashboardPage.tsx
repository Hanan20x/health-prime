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
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Brain,
  ClipboardPlus,
  CalendarDays,
  UserCog,
  Sparkles,
  ShieldAlert,
  ArrowRightLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/api/client";
import type { DashboardSummary, UserOut } from "@/api/types";
import { useLang } from "@/hooks/useLang";
import { useAuth } from "@/hooks/useAuth";
import { tx, txStatTitle, txStatDesc, txRole, txRelativeTime } from "@/lib/i18n";

// ─── Activity Feed helpers ────────────────────────────────────────────────────

type ParsedActivity = {
  headline: string;
  eventType: "ai_optimization" | "ai_diagnosis" | "patient_registered" | "vitals" | "diagnosis" | "other";
  priority?: string;
  provider?: string;
  date?: string;
  changes?: string;
};

function parseAction(raw: string): ParsedActivity {
  // Pipe-delimited format: "Headline | Priority: X | Provider: Y | Date: Z"
  const parts = raw.split("|").map((s) => s.trim());
  const headline = parts[0];
  const meta: Record<string, string> = {};
  for (const p of parts.slice(1)) {
    const idx = p.indexOf(":");
    if (idx !== -1) {
      const key = p.slice(0, idx).trim().toLowerCase();
      meta[key] = p.slice(idx + 1).trim();
    }
  }

  let eventType: ParsedActivity["eventType"] = "other";
  if (headline.toLowerCase().includes("ai optimization") || headline.toLowerCase().includes("ai appointment")) eventType = "ai_optimization";
  else if (headline.toLowerCase().includes("ai diagnosis")) eventType = "ai_diagnosis";
  else if (headline.toLowerCase().includes("patient registered") || headline.toLowerCase().includes("new patient")) eventType = "patient_registered";
  else if (headline.toLowerCase().includes("vital")) eventType = "vitals";
  else if (headline.toLowerCase().includes("diagnosis")) eventType = "diagnosis";

  // Extract change count from "— N change(s) suggested"
  const changeMatch = headline.match(/(\d+)\s+change/i);

  return {
    headline,
    eventType,
    priority: meta["priority"],
    provider: meta["provider"],
    date: meta["date"],
    changes: changeMatch ? changeMatch[1] : undefined,
  };
}

const PRIORITY_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  urgent:    { bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-500",    label: "Urgent" },
  emergency: { bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-500",    label: "Emergency" },
  high:      { bg: "bg-amber-100",  text: "text-amber-700",  dot: "bg-amber-500",  label: "High" },
  routine:   { bg: "bg-emerald-100",text: "text-emerald-700",dot: "bg-emerald-500",label: "Routine" },
  low:       { bg: "bg-sky-100",    text: "text-sky-700",    dot: "bg-sky-400",    label: "Low" },
};

function getPriorityStyle(raw?: string) {
  if (!raw) return null;
  // Handle "Routine → Urgent" style (pick final priority)
  const final = raw.includes("→") ? raw.split("→").pop()!.trim() : raw;
  return PRIORITY_STYLES[final.toLowerCase()] ?? { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", label: final };
}

const EVENT_ICON_CONFIG = {
  ai_optimization: { icon: Sparkles,      bg: "bg-violet-100", text: "text-violet-600" },
  ai_diagnosis:    { icon: Brain,          bg: "bg-purple-100", text: "text-purple-600" },
  patient_registered: { icon: UserCog,    bg: "bg-blue-100",   text: "text-blue-600" },
  vitals:          { icon: HeartPulse,     bg: "bg-rose-100",   text: "text-rose-600" },
  diagnosis:       { icon: Stethoscope,    bg: "bg-cyan-100",   text: "text-cyan-600" },
  other:           { icon: Activity,       bg: "bg-slate-100",  text: "text-slate-500" },
};

function friendlyHeadline(raw: string): string {
  // Trim everything before "—" for the tag line; keep it short
  if (raw.includes("AI Optimization")) {
    if (raw.includes("change(s) suggested")) return "AI Scheduling Optimized";
    if (raw.includes("No changes")) return "AI Scheduling — No Changes";
    return "AI Scheduling Reviewed";
  }
  return raw.split("|")[0].trim();
}

function ActivityFeed({ activity, isLoading, lang }: { activity?: any[]; isLoading: boolean; lang: string }) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2 bg-muted/30">
        <Activity className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold">{lang === "ar" ? "النشاط الأخير" : "Recent Activity"}</h2>
      </div>

      {isLoading && (
        <div className="p-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && (!activity || activity.length === 0) && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-20" />
          {lang === "ar" ? "لا يوجد نشاط بعد" : "No activity yet"}
        </div>
      )}

      {!isLoading && activity && activity.length > 0 && (
        <ul className="divide-y divide-border">
          {activity.map((item) => {
            const parsed = parseAction(item.action);
            const iconCfg = EVENT_ICON_CONFIG[parsed.eventType];
            const Icon = iconCfg.icon;
            const priorityStyle = getPriorityStyle(parsed.priority);
            const hasArrow = parsed.priority?.includes("→");

            return (
              <li key={item.id} className="px-6 py-5 flex items-start gap-5 hover:bg-muted/20 transition-colors group">
                {/* Icon bubble */}
                <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${iconCfg.bg}`}>
                  <Icon className={`w-5 h-5 ${iconCfg.text}`} />
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  {/* Top row: headline + time */}
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-base font-semibold text-foreground leading-snug">
                      {friendlyHeadline(item.action)}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap mt-0.5 shrink-0">
                      {txRelativeTime(item.time, lang)}
                    </span>
                  </div>

                  {/* Patient name */}
                  {item.patient && item.patient !== "—" && (
                    <p className="text-sm text-muted-foreground mt-1">
                      <UserRound className="inline w-3.5 h-3.5 mr-1 opacity-60" />
                      <span className="font-medium text-foreground/80">{item.patient}</span>
                    </p>
                  )}

                  {/* Tag row */}
                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    {/* Priority badge */}
                    {priorityStyle && (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${priorityStyle.bg} ${priorityStyle.text}`}>
                        <span className={`w-2 h-2 rounded-full ${priorityStyle.dot}`} />
                        {hasArrow ? (
                          <>
                            <span className="line-through opacity-60">
                              {PRIORITY_STYLES[parsed.priority!.split("→")[0].trim().toLowerCase()]?.label ?? parsed.priority!.split("→")[0].trim()}
                            </span>
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>
                              {PRIORITY_STYLES[parsed.priority!.split("→").pop()!.trim().toLowerCase()]?.label ?? parsed.priority!.split("→").pop()!.trim()}
                            </span>
                          </>
                        ) : (
                          priorityStyle.label
                        )}
                      </span>
                    )}

                    {/* Changes chip */}
                    {parsed.changes && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        {parsed.changes} change{parsed.changes !== "1" ? "s" : ""} flagged
                      </span>
                    )}

                    {/* Provider chip */}
                    {parsed.provider && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        <Stethoscope className="w-3.5 h-3.5" />
                        {parsed.provider}
                      </span>
                    )}

                    {/* Date chip */}
                    {parsed.date && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {parsed.date}
                      </span>
                    )}

                    {/* AI badge for AI types */}
                    {(parsed.eventType === "ai_optimization" || parsed.eventType === "ai_diagnosis") && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-violet-600/10 text-violet-700 border border-violet-200 uppercase tracking-wide">
                        <Sparkles className="w-3 h-3" /> AI
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const { role, canManageProviders, canRegisterPatients, canRecordVitals, isDoctor } = useAuth();

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
    const TITLE_PREFIXES = new Set(["dr", "dr.", "nurse", "mr", "mrs", "ms"]);
    const hasTitle = TITLE_PREFIXES.has(parts[0].toLowerCase());
    const isDr = parts[0].toLowerCase().replace(".", "") === "dr";
    const actualFirst = hasTitle && parts.length > 1 ? parts[1] : parts[0];

    if (isDr || role === "Doctor") {
      welcomeName = isDr ? `${parts[0]} ${actualFirst}` : `Dr. ${actualFirst}`;
    } else {
      welcomeName = role ? `${txRole(role, lang)} ${actualFirst}` : actualFirst;
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

      <div className="overflow-x-auto mb-8 -mx-1 px-1 pb-1">
        <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${role === "Doctor" ? 4 : role === "E-Health Admin" ? 6 : 3}, minmax(180px, 1fr))` }}>
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
          {isDoctor && (
            <Button onClick={() => navigate("/patients/emr")} variant="outline" className="gap-2">
              <ClipboardPlus className="w-4 h-4" /> {lang === "ar" ? "إضافة تشخيص" : "Add Diagnosis"}
            </Button>
          )}
          <Button onClick={() => navigate("/vitals/record?view=trends")} variant="outline" className="gap-2">
            <BarChart3 className="w-4 h-4" /> {tx("viewCharts", lang)}
          </Button>
        </div>
      </div>

      <ActivityFeed activity={data?.activity} isLoading={isLoading} lang={lang} />
    </DashboardLayout>
  );
}
