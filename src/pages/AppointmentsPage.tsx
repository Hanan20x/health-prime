import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { CalendarPlus, Sparkles, Pencil, Trash2, Eye, Calendar as CalendarIcon, Clock, Users, AlertCircle, CalendarDays } from "lucide-react";
import { apiFetch } from "@/api/client";
import { useLang } from "@/hooks/useLang";
import { tx } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { StatCard } from "@/components/shared/StatCard";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import type { PatientListItem, ProviderListItem } from "@/api/types";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./appointments-calendar.css";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface AppointmentRow {
  id: number;
  patientId: number;
  providerId: number;
  appointmentDate: string;
  reason: string;
  status: string;
  notes?: string;
  isAiGenerated: boolean;
  patientName: string;
  providerName: string;
  department?: string;
  visitType?: string;
  priorityLevel?: string;
  aiExplanation?: string;
  manualSlotsAffected?: string;
  optimizationDiffs?: string;
}

interface OptimizationDiffField {
  field: string;
  staffEntry: string | null;
  aiSuggestion: string | null;
  flag: boolean;
  reasoning: string | null;
}

interface OptimizationReview {
  diffs: OptimizationDiffField[];
  aiSkipped: boolean;
  aiExplanation: string | null;
  manualSlotsAffected?: string;
}

export default function AppointmentsPage() {
  const qc = useQueryClient();
  const { lang } = useLang();
  const { canBookAppointments, role } = useAuth();
  const canManageAppointments = canBookAppointments || role === "Doctor";
  const location = useLocation();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  useEffect(() => {
    if (location.state?.openBooking) {
      setIsDialogOpen(true);
      // Clear history state to avoid triggering it again on reload/navigation
      window.history.replaceState({}, document.title);
    }
  }, [location]);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRow | null>(null);
  const [optimizeAppointmentId, setOptimizeAppointmentId] = useState<number | null>(null);
  const [lastOptimizedId, setLastOptimizedId] = useState<number | null>(null);
  const [deleteAppointmentId, setDeleteAppointmentId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"overview" | "list" | "calendar">("overview");
  const [calendarView, setCalendarView] = useState<"month" | "week" | "day" | "agenda">("month");
  
  // Schedule Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterBookingType, setFilterBookingType] = useState("all");

  // Form State
  const [patientId, setPatientId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [reason, setReason] = useState("");
  const [department, setDepartment] = useState("");
  const [visitType, setVisitType] = useState("");
  const [priorityLevel, setPriorityLevel] = useState("");

  const [optimizationReview, setOptimizationReview] = useState<OptimizationReview | null>(null);
  const [fieldDecisions, setFieldDecisions] = useState<Record<string, "ACCEPT" | "KEEP" | "EDIT">>({});

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => apiFetch<AppointmentRow[]>("/appointments"),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => apiFetch<PatientListItem[]>("/patients"),
  });

  const { data: providers = [] } = useQuery({
    queryKey: ["providers"],
    queryFn: () => apiFetch<ProviderListItem[]>("/providers"),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      apiFetch("/appointments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      setLastOptimizedId(data.id || optimizeAppointmentId);
      setTimeout(() => setLastOptimizedId(null), 5000); 
      toast.success(tx("appointmentCreated", lang));
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error(tx("error", lang)),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      apiFetch("/appointments/" + optimizeAppointmentId, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      setLastOptimizedId(data.id || optimizeAppointmentId);
      setTimeout(() => setLastOptimizedId(null), 5000); 
      toast.success(tx("appointmentCreated", lang));
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error(tx("error", lang)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch("/appointments/" + id, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      setDeleteAppointmentId(null);
      toast.success(lang === "ar" ? "ØªÙ… Ø­Ø°Ù Ø§Ù„Ù…ÙˆØ¹Ø¯" : "Appointment deleted successfully");
    },
    onError: () => toast.error(tx("error", lang)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiFetch(`/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success(lang === "ar" ? "ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø­Ø§Ù„Ø©" : "Status updated");
    },
    onError: () => toast.error(tx("error", lang)),
  });

  const optimizeMutation = useMutation({
    mutationFn: (data: any) =>
      apiFetch("/appointments/optimize", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data: OptimizationReview) => {
      setOptimizationReview(data);
      const initialDecisions: Record<string, "ACCEPT" | "KEEP" | "EDIT"> = {};
      data.diffs.forEach(d => {
        if (d.flag) initialDecisions[d.field] = "ACCEPT";
      });
      setFieldDecisions(initialDecisions);
    },
    onError: () => toast.error("Failed to fetch AI optimization"),
  });

  const resetForm = () => {
    setPatientId("");
    setProviderId("");
    setDateStr("");
    setTimeStr("");
    setReason("");
    setDepartment("");
    setVisitType("");
    setPriorityLevel("");
    setOptimizationReview(null);
    setOptimizeAppointmentId(null);
  };

  const handleConfirmOptimization = () => {
    let finalPriority = priorityLevel;
    let finalDate = dateStr;
    let finalTime = timeStr;
    let finalProviderId = providerId;

    if (optimizationReview) {
      optimizationReview.diffs.forEach(d => {
        if (fieldDecisions[d.field] === "ACCEPT" && d.aiSuggestion && d.aiSuggestion !== "KEEP") {
          if (d.field === "Priority") finalPriority = d.aiSuggestion;
          if (d.field === "Date") finalDate = d.aiSuggestion;
          if (d.field === "Time") finalTime = d.aiSuggestion;
          if (d.field === "Doctor") {
            const matched = providers.find(p => p.name.includes(d.aiSuggestion!));
            if (matched) finalProviderId = matched.id.toString();
          }
        }
      });
    }

    const hasAiChanges = optimizationReview?.diffs.some(d => d.flag) || false;
    
    const payload = {
      patientId: Number(patientId),
      providerId: finalProviderId ? Number(finalProviderId) : undefined,
      appointmentDate: new Date(`${finalDate}T${finalTime}`).toISOString(),
      reason,
      department,
      visitType,
      priorityLevel: finalPriority || "Routine",
      isAiGenerated: hasAiChanges,
      aiExplanation: optimizationReview?.aiExplanation,
      manualSlotsAffected: optimizationReview?.manualSlotsAffected,
      optimizationDiffs: JSON.stringify(optimizationReview?.diffs || []),
    };

    if (optimizeAppointmentId) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleCreate = () => {
    if (!patientId || !providerId || !dateStr || !timeStr || !reason) {
      toast.error(tx("fillRequiredFields", lang));
      return;
    }
    const payload = {
      patientId: Number(patientId),
      providerId: providerId ? Number(providerId) : undefined,
      appointmentDate: new Date(`${dateStr}T${timeStr}`).toISOString(),
      reason,
      department,
      visitType,
      priorityLevel: priorityLevel || "Routine",
      isAiGenerated: false
    };
    if (optimizeAppointmentId) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleOptimize = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!patientId || !dateStr || !timeStr || !reason) {
      toast.error(tx("fillRequiredFields", lang));
      return;
    }
    
    // Create an ISO UTC string of the requested time
    const utcDateTime = new Date(`${dateStr}T${timeStr}`).toISOString();
    
    optimizeMutation.mutate({
      patientId: parseInt(patientId),
      providerId: providerId ? parseInt(providerId) : undefined,
      appointmentDate: dateStr,
      timeStr,
      utc_datetime: utcDateTime,
      reason,
      department,
      visitType,
      priorityLevel,
    });
  };

  const parseOptimizationMessage = (msg: string | undefined) => {
    if (!msg) return null;
    if (msg.includes("Original Time:")) {
      try {
        const lines = msg.split("\n");
        const reasonLine = lines[0].replace("[CONFLICT]", "").trim();
        const origTime = lines.find(l => l.includes("Original Time:"))?.split(":")[1]?.trim();
        const newTime = lines.find(l => l.includes("Optimized Time:"))?.split(":")[1]?.trim();
        return { type: "optimized", reason: reasonLine, original: origTime, optimized: newTime };
      } catch (e) {
        return { type: "raw", text: msg };
      }
    }
    return { type: "clear", text: msg };
  };

  const handleRowClick = (appt: AppointmentRow) => {
    setSelectedAppointment(appt);
  };

  const columns: Column<AppointmentRow>[] = [
    { 
      header: tx("dateTime", lang) || "Date & Time", 
      className: "text-center",
      accessor: (row) => (
        <div className="flex flex-col items-center text-center">
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {row.appointmentDate && !isNaN(new Date(row.appointmentDate).getTime()) ? format(new Date(row.appointmentDate), "p") : "--:--"}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {row.appointmentDate && !isNaN(new Date(row.appointmentDate).getTime()) ? format(new Date(row.appointmentDate), "MMM d, yyyy") : "Invalid Date"}
          </span>
        </div>
      ) 
    },
    { 
      header: tx("patient", lang), 
      className: "text-center",
      accessor: (row) => (
        <div className="flex flex-col items-center text-center">
          <span className="font-semibold text-slate-800 dark:text-slate-100">{row.patientName}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            ID: #{row.patientId}
          </span>
        </div>
      )
    },
    { 
      header: lang === "ar" ? "Ù…Ø²ÙˆØ¯ Ø§Ù„Ø±Ø¹Ø§ÙŠØ© Ø§Ù„ØµØ­ÙŠØ©" : "Healthcare Provider", 
      className: "text-center",
      accessor: (row) => (
        <div className="flex flex-col items-center text-center">
          <span className="font-semibold text-slate-800 dark:text-slate-100">{row.providerName || "Unassigned"}</span>
          {row.department && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {row.department}
            </span>
          )}
        </div>
      )
    },
    { 
      header: "Priority", 
      className: "text-center",
      accessor: (row) => {
        const prio = row.priorityLevel || "Routine";
        let colorClass = "bg-emerald-100 text-emerald-800 ring-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300";
        let dotClass = "bg-emerald-500";
        if (prio === "Urgent") {
          colorClass = "bg-rose-100 text-rose-800 ring-rose-500/30 dark:bg-rose-500/20 dark:text-rose-300";
          dotClass = "bg-rose-500";
        } else if (prio === "Soon" || prio === "High") {
          colorClass = "bg-amber-100 text-amber-800 ring-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300";
          dotClass = "bg-amber-500";
        }
        return (
          <div className="flex justify-center">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ring-1 ring-inset ${colorClass}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${dotClass} shadow-sm`} />
              {prio.toUpperCase()}
            </span>
          </div>
        );
      }
    },
    { 
      header: tx("source", lang) || "Source", 
      className: "text-center",
      accessor: (row) => (
        <div className="flex justify-center items-center">
          {row.isAiGenerated ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold" title="Optimized by AI">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">AI Optimized</span>
            </span>
          ) : (
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Manual Booking
            </span>
          )}
        </div>
      )
    },
    { 
      header: tx("status", lang) || "Status", 
      className: "text-center",
      accessor: (row) => {
        const status = row.status || "Scheduled";
        let colorClass = "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50";
        if (status === "Completed") {
          colorClass = "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50";
        } else if (status === "Waiting") {
          colorClass = "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/50";
        } else if (status === "Cancelled" || status === "No Show") {
          colorClass = "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/50";
        }
        return (
          <div className="flex justify-center">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${colorClass}`}>
              {status}
            </span>
          </div>
        );
      }
    },
    {
      header: tx("actions", lang) || "Actions",
      className: "text-center",
      accessor: (row) => (
        <div className="flex justify-center items-center gap-1 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
          {(row.status === "Scheduled" || !row.status) && canBookAppointments && (
            <Button variant="outline" size="sm" className="h-7 text-xs border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/30" onClick={() => statusMutation.mutate({ id: row.id, status: "Waiting" })}>
              Set Waiting
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleRowClick(row)}>
            <Eye className="w-3.5 h-3.5" />
          </Button>
          {canManageAppointments && (
            <>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => {
                setPatientId(row.patientId.toString());
                setReason(row.reason);
                if (row.providerId) setProviderId(row.providerId.toString());
                if (row.department) setDepartment(row.department);
                if (row.visitType) setVisitType(row.visitType);
                setPriorityLevel(row.priorityLevel || "Routine");
                const dt = new Date(row.appointmentDate);
                setDateStr(dt.toLocaleDateString("en-CA"));
                setTimeStr(dt.toTimeString().slice(0, 5));
                setOptimizeAppointmentId(row.id);
                setIsDialogOpen(true);
              }}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50" onClick={() => {
                setDeleteAppointmentId(row.id);
              }}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
              {!row.isAiGenerated && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30" onClick={() => {
                  setPatientId(row.patientId.toString());
                  setReason(row.reason);
                  if (row.providerId) setProviderId(row.providerId.toString());
                  if (row.department) setDepartment(row.department);
                  if (row.visitType) setVisitType(row.visitType);
                  setPriorityLevel(row.priorityLevel || "Routine");
                  const dt = new Date(row.appointmentDate);
                  setDateStr(dt.toLocaleDateString("en-CA"));
                  setTimeStr(dt.toTimeString().slice(0, 5));
                  setOptimizeAppointmentId(row.id);
                  setIsDialogOpen(true);
                }}>
                  <Sparkles className="w-3.5 h-3.5" />
                </Button>
              )}
            </>
          )}
        </div>
      )
    }
  ];

  const overviewColumns: Column<AppointmentRow>[] = [
    {
      header: lang === "ar" ? "Ø§Ù„Ù…Ø±ÙŠØ¶" : "PATIENT",
      accessor: (row) => {
        const patientObj = patients.find(p => p.id === row.patientId);
        const nationalId = patientObj?.nationalId || `ID: #${row.patientId}`;
        const initials = (row.patientName && typeof row.patientName === 'string')
          ? row.patientName
              .split(" ")
              .filter(Boolean)
              .map((n) => n[0] || "")
              .join("")
              .slice(0, 2)
              .toUpperCase()
          : "P";
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-slate-800 dark:text-slate-100 hover:text-primary transition-colors cursor-pointer">
                {row.patientName}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {nationalId}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      header: lang === "ar" ? "Ø§Ù„Ø®Ø¯Ù…Ø©" : "SERVICE",
      accessor: (row) => (
        <div className="flex flex-col text-left">
          <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
            {row.reason}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {row.visitType || "General Consultation"} Â· 30 min
          </span>
        </div>
      )
    },
    {
      header: lang === "ar" ? "Ø§Ù„ØªØ§Ø±ÙŠØ® ÙˆØ§Ù„ÙˆÙ‚Øª" : "DATE & TIME",
      accessor: (row) => {
        const start = new Date(row.appointmentDate);
        const end = new Date(start.getTime() + 30 * 60000);
        return (
          <div className="flex flex-col text-left">
            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              {!isNaN(start.getTime()) ? format(start, "MMM d, yyyy") : "Invalid Date"}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {!isNaN(start.getTime()) ? format(start, "p") : "--:--"} - {!isNaN(end.getTime()) ? format(end, "p") : "--:--"}
            </span>
          </div>
        );
      }
    },
    {
      header: lang === "ar" ? "Ø§Ù„Ù…ØµØ¯Ø±" : "SOURCE",
      accessor: (row) => (
        <div className="flex justify-start">
          {row.isAiGenerated ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50">
              <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              AI Widget
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-100 dark:bg-slate-800/30 dark:text-slate-400 dark:border-slate-700">
              Manual Slot
            </span>
          )}
        </div>
      )
    },
    {
      header: lang === "ar" ? "Ø§Ù„Ø­Ø§Ù„Ø©" : "STATUS",
      accessor: (row) => {
        const status = row.status || "Scheduled";
        let colorClass = "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50";
        if (status === "Completed") {
          colorClass = "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50";
        } else if (status === "Waiting") {
          colorClass = "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/50";
        } else if (status === "Cancelled" || status === "No Show") {
          colorClass = "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/50";
        }
        return (
          <div className="flex justify-start">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}>
              {status}
            </span>
          </div>
        );
      }
    },
    {
      header: lang === "ar" ? "Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª" : "ACTIONS",
      accessor: (row) => (
        <div className="flex items-center gap-1 justify-start" onClick={(e) => e.stopPropagation()}>
          {(row.status === "Scheduled" || !row.status) && canBookAppointments && (
            <Button variant="outline" size="sm" className="h-7 text-[10px] border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/30" onClick={() => statusMutation.mutate({ id: row.id, status: "Waiting" })}>
              Wait
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleRowClick(row)}>
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => {
            setPatientId(row.patientId.toString());
            setReason(row.reason);
            if (row.providerId) setProviderId(row.providerId.toString());
            if (row.department) setDepartment(row.department);
            if (row.visitType) setVisitType(row.visitType);
            setPriorityLevel(row.priorityLevel || "Routine");
            const dt = new Date(row.appointmentDate);
            setDateStr(dt.toLocaleDateString("en-CA"));
            setTimeStr(dt.toTimeString().slice(0, 5));
            setOptimizeAppointmentId(row.id);
            setIsDialogOpen(true);
          }}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50" onClick={() => {
            setDeleteAppointmentId(row.id);
          }}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    }
  ];

  // Stats & Filters Calculations for the Overview front page
  const todayStr = new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const upcomingBookedCount = appointments.filter(appt => {
    const date = new Date(appt.appointmentDate);
    return date.getTime() > Date.now() && appt.status !== "Cancelled";
  }).length;

  const distinctPatientsCount = new Set(appointments.map(appt => appt.patientId)).size;

  const cancellationsCount = appointments.filter(appt => appt.status === "Cancelled").length;

  const isToday = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isAfterToday = (dateStr: string) => {
    const date = new Date(dateStr);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    return date.getTime() > todayEnd.getTime();
  };

  const filteredAppointments = useMemo(() => {
    let result = appointments.filter(a => a.status !== "Cancelled");

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(a => 
        (a.patientName && a.patientName.toLowerCase().includes(q)) || 
        (a.reason && a.reason.toLowerCase().includes(q)) ||
        (a.providerName && a.providerName.toLowerCase().includes(q)) ||
        (a.department && a.department.toLowerCase().includes(q))
      );
    }
    
    if (filterPriority && filterPriority !== "all") {
      const priority = (a: any) => (a.priorityLevel || "Routine").toLowerCase();
      result = result.filter(a => priority(a) === filterPriority.toLowerCase());
    }
    
    if (filterBookingType && filterBookingType !== "all") {
      if (filterBookingType === "ai") result = result.filter(a => a.isAiGenerated);
      if (filterBookingType === "manual") result = result.filter(a => !a.isAiGenerated);
    }

    if (department && department !== "all") {
      result = result.filter(a => a.department === department);
    }

    if (visitType && visitType !== "all") {
      result = result.filter(a => a.visitType === visitType);
    }

    if (dateStr) {
      result = result.filter(a => {
        if (!a.appointmentDate) return false;
        try {
          const d = new Date(a.appointmentDate);
          return d.toLocaleDateString("en-CA") === dateStr;
        } catch (e) {
          return false;
        }
      });
    }
    
    return result;
  }, [appointments, searchTerm, filterPriority, filterBookingType, department, visitType, dateStr]);

  const todayAppointments = filteredAppointments.filter(appt => isToday(appt.appointmentDate));
  const upcomingAppointments = filteredAppointments
    .filter(appt => isAfterToday(appt.appointmentDate))
    .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());

  return (
    <DashboardLayout>
      <PageHeader
        title={tx("appointments", lang)}
        description={tx("manageAppointmentsDesc", lang)}
        actions={
          <div className="flex gap-2 items-center">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
              <Button 
                variant={viewMode === "overview" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("overview")}
                className={`text-sm ${viewMode === "overview" ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
              >
                {lang === "ar" ? "Ù†Ø¸Ø±Ø© Ø¹Ø§Ù…Ø©" : "Overview"}
              </Button>
              <Button 
                variant={viewMode === "list" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("list")}
                className={`text-sm ${viewMode === "list" ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
              >
                {lang === "ar" ? "Ø§Ù„Ù‚Ø§Ø¦Ù…Ø©" : "List"}
              </Button>
              <Button 
                variant={viewMode === "calendar" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("calendar")}
                className={`text-sm ${viewMode === "calendar" ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}
              >
                {lang === "ar" ? "Ø§Ù„ØªÙ‚ÙˆÙŠÙ…" : "Calendar"}
              </Button>
            </div>
            {canBookAppointments && (
              <Button onClick={() => setIsDialogOpen(true)} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                <CalendarPlus className="w-4 h-4" /> {tx("bookAppointment", lang)}
              </Button>
            )}
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {viewMode === "overview" && (
            <div className="space-y-6">
              {/* StatCards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title={lang === "ar" ? "ØªØ§Ø±ÙŠØ® Ø§Ù„ÙŠÙˆÙ…" : "Today's Date"}
                  value={todayStr}
                  icon={CalendarIcon}
                  description={lang === "ar" ? "Ø§Ù„ØªØ§Ø±ÙŠØ® Ø§Ù„Ø­Ø§Ù„ÙŠ" : "Current date"}
                />
                <StatCard
                  title={lang === "ar" ? "Ø§Ù„Ù…ÙˆØ§Ø¹ÙŠØ¯ Ø§Ù„Ù‚Ø§Ø¯Ù…Ø© Ø§Ù„Ù…Ø¤ÙƒØ¯Ø©" : "Upcoming Booked & Confirmed"}
                  value={upcomingBookedCount}
                  icon={Clock}
                  description={lang === "ar" ? "Ø§Ù„Ø­Ø¬ÙˆØ²Ø§Øª Ø§Ù„Ù‚Ø§Ø¯Ù…Ø© ØºÙŠØ± Ø§Ù„Ù…Ù„ØºØ§Ø©" : "Scheduled future slots"}
                />
                <StatCard
                  title={lang === "ar" ? "Ø¹Ø¯Ø¯ Ø§Ù„Ù…Ø±Ø¶Ù‰" : "Patients"}
                  value={distinctPatientsCount}
                  icon={Users}
                  description={lang === "ar" ? "Ø§Ù„Ù…Ø±Ø¶Ù‰ Ø§Ù„Ù…Ø³Ø¬Ù„ÙŠÙ† ÙÙŠ Ø§Ù„Ù…ÙˆØ§Ø¹ÙŠØ¯" : "Distinct patients scheduled"}
                />
                <StatCard
                  title={lang === "ar" ? "Ø§Ù„Ù…Ù„ØºØ§Ø©" : "Cancellation"}
                  value={cancellationsCount}
                  icon={AlertCircle}
                  description={lang === "ar" ? "Ø§Ù„Ù…ÙˆØ§Ø¹ÙŠØ¯ Ø§Ù„Ù…Ù„ØºØ§Ø©" : "Cancelled appointments"}
                />
              </div>

              {/* Filters Bar */}
              <div className="flex flex-wrap items-center gap-3 bg-card border border-border/50 p-4 rounded-xl shadow-sm ring-1 ring-border/5">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder={lang === "ar" ? "Ø§Ù„Ø¨Ø­Ø« Ø¹Ù† Ø·Ø±ÙŠÙ‚ Ø§Ø³Ù… Ø§Ù„Ù…Ø±ÙŠØ¶ Ø£Ùˆ Ø§Ù„Ø·Ø¨ÙŠØ¨..." : "Search by patient, provider or department..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 text-sm bg-white dark:bg-slate-950"
                  />
                </div>
                <div className="w-[160px]">
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="h-9 text-sm bg-white dark:bg-slate-950">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{lang === "ar" ? "ÙƒÙ„ Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ§Øª" : "All Priorities"}</SelectItem>
                      <SelectItem value="urgent">{lang === "ar" ? "Ø¹Ø§Ø¬Ù„" : "Urgent"}</SelectItem>
                      <SelectItem value="soon">{lang === "ar" ? "Ù‚Ø±ÙŠØ¨Ø§Ù‹" : "Soon"}</SelectItem>
                      <SelectItem value="routine">{lang === "ar" ? "Ø±ÙˆØªÙŠÙ†ÙŠ" : "Routine"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-[160px]">
                  <Select value={filterBookingType} onValueChange={setFilterBookingType}>
                    <SelectTrigger className="h-9 text-sm bg-white dark:bg-slate-950">
                      <SelectValue placeholder="Booking Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{lang === "ar" ? "ÙƒÙ„ Ø£Ù†ÙˆØ§Ø¹ Ø§Ù„Ø­Ø¬Ø²" : "All Bookings"}</SelectItem>
                      <SelectItem value="ai">{lang === "ar" ? "Ù…Ø­Ø³Ù† Ø¨Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ" : "AI Optimized"}</SelectItem>
                      <SelectItem value="manual">{lang === "ar" ? "Ø­Ø¬Ø² ÙŠØ¯ÙˆÙŠ" : "Manual Booking"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(searchTerm || filterPriority !== "all" || filterBookingType !== "all") && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearchTerm("");
                      setFilterPriority("all");
                      setFilterBookingType("all");
                    }}
                    className="h-9 px-3 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    {lang === "ar" ? "Ø¥Ø¹Ø§Ø¯Ø© Ø¶Ø¨Ø·" : "Clear Filters"}
                  </Button>
                )}
              </div>

              {/* Schedules Layout Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Today's Schedule (2/3 width) */}
                <div className="lg:col-span-2 space-y-6 bg-card border border-border/50 p-6 rounded-xl shadow-sm ring-1 ring-border/5">
                  <div className="flex justify-between items-center pb-4 border-b border-border/40">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <CalendarDays className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none mb-1">
                          {lang === "ar" ? "Ø¬Ø¯ÙˆÙ„ Ø§Ù„ÙŠÙˆÙ…" : "Today's Schedule"}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", { weekday: "long", month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full font-bold">
                      {todayAppointments.length} {todayAppointments.length === 1 ? (lang === "ar" ? "Ù…ÙˆØ¹Ø¯" : "appointment") : (lang === "ar" ? "Ù…ÙˆØ§Ø¹ÙŠØ¯" : "appointments")}
                    </span>
                  </div>
                  
                  <DataTable
                    columns={overviewColumns}
                    data={todayAppointments}
                    emptyMessage={lang === "ar" ? "Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…ÙˆØ§Ø¹ÙŠØ¯ Ø§Ù„ÙŠÙˆÙ…" : "No appointments scheduled for today"}
                    rowClassName={(row) => {
                      if (row.id === lastOptimizedId) return "bg-indigo-50 dark:bg-indigo-900/50 border-l-4 border-indigo-500 cursor-pointer transition-colors duration-700";
                      return row.isAiGenerated ? "bg-[#f5fdf5]/50 hover:bg-[#eaf8ea]/50 dark:bg-[#f5fdf5]/5 cursor-pointer" : "cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/50";
                    }}
                    onRowClick={handleRowClick}
                  />
                </div>

                {/* Upcoming Schedule (1/3 width list style) */}
                <div className="lg:col-span-1 space-y-6 bg-card border border-border/50 p-6 rounded-xl shadow-sm ring-1 ring-border/5">
                  <div className="flex justify-between items-center pb-4 border-b border-border/40">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">
                          {lang === "ar" ? "Ù‚Ø±ÙŠØ¨Ø§Ù‹" : "Upcoming"}
                        </h3>
                      </div>
                    </div>
                    <button
                      onClick={() => setViewMode("list")}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 bg-transparent border-0 cursor-pointer"
                    >
                      {lang === "ar" ? "Ø¹Ø±Ø¶ Ø§Ù„ÙƒÙ„" : "See all"} â†’
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {upcomingAppointments.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-sm">
                        {lang === "ar" ? "Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…ÙˆØ§Ø¹ÙŠØ¯ Ù‚Ø§Ø¯Ù…Ø©" : "No upcoming appointments"}
                      </div>
                    ) : (
                      upcomingAppointments.map((appt) => {
                        const start = new Date(appt.appointmentDate);
                        return (
                          <div
                            key={appt.id}
                            onClick={() => handleRowClick(appt)}
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                            <div className="flex flex-col text-left min-w-0">
                              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
                                {appt.patientName}
                              </span>
                              <span className="text-[11px] text-slate-400 truncate">
                                {appt.reason || "General Consultation"} · {!isNaN(start.getTime()) ? `${format(start, "MMM d")}, ${format(start, "p")}` : "Invalid Date"}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === "list" && (
            <DataTable 
              columns={columns} 
              data={filteredAppointments} 
              emptyMessage={tx("noData", lang)} 
              rowClassName={(row) => {
                if (row.id === lastOptimizedId) return "bg-indigo-50 dark:bg-indigo-900/50 border-l-4 border-indigo-500 cursor-pointer transition-colors duration-700";
                return row.isAiGenerated ? "bg-[#f5fdf5] hover:bg-[#eaf8ea] dark:bg-[#f5fdf5]/5 cursor-pointer" : "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800";
              }}
              onRowClick={handleRowClick}
            />
          )}

          {viewMode === "calendar" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4 bg-white px-4 py-3 rounded-xl shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-sm font-medium">
                <span className="text-slate-500 text-xs uppercase tracking-wider font-bold mr-2">Legend:</span>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-200"></span>
                  <span className="text-slate-700 dark:text-slate-300">Urgent</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-200"></span>
                  <span className="text-slate-700 dark:text-slate-300">Soon</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm shadow-emerald-200"></span>
                  <span className="text-slate-700 dark:text-slate-300">Routine</span>
                </div>
                <div className="flex items-center gap-2 ml-auto pl-4 border-l border-slate-200 dark:border-slate-700">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">AI Optimized</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800" style={{ height: "82vh" }}>
                <Calendar
                  localizer={localizer}
                  events={appointments.map(appt => ({
                    id: appt.id,
                    title: `${appt.patientName} - ${appt.reason}`,
                    start: new Date(appt.appointmentDate),
                    end: new Date(new Date(appt.appointmentDate).getTime() + 30 * 60000),
                    resource: appt
                  }))}
                  startAccessor="start"
                  endAccessor="end"
                  view={calendarView as any}
                  onView={(view: any) => setCalendarView(view)}
                  onSelectEvent={(event: any) => handleRowClick(event.resource)}
                  components={{
                    event: ({ event }: any) => {
                      const resource = event.resource;
                      const isAi = resource.isAiGenerated;
                      const timeLabel = new Date(resource.appointmentDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
                      return (
                        <div className="group flex flex-col justify-center px-2 py-1 h-full w-full relative">
                          <div className="font-bold text-[13px] flex items-center gap-1.5 leading-snug">
                            <span className="truncate">{resource.patientName}</span>
                            {isAi && <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-500" />}
                          </div>
                          <div className="text-[11px] truncate opacity-75 mt-0.5 font-medium">
                            {timeLabel}
                          </div>
                          {canManageAppointments && (
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-white/90 backdrop-blur-sm p-0.5 rounded-md shadow-sm border border-slate-200" onClick={(e) => e.stopPropagation()}>
                               <button type="button" className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" onClick={(e) => {
                                 e.stopPropagation();
                                 setPatientId(resource.patientId.toString());
                                 setReason(resource.reason);
                                 if (resource.providerId) setProviderId(resource.providerId.toString());
                                 if (resource.department) setDepartment(resource.department);
                                 if (resource.visitType) setVisitType(resource.visitType);
                                 setPriorityLevel(resource.priorityLevel || "Routine");
                                 const dt = new Date(resource.appointmentDate);
                                 setDateStr(dt.toLocaleDateString("en-CA"));
                                 setTimeStr(dt.toTimeString().slice(0, 5));
                                 setOptimizeAppointmentId(resource.id);
                                 setIsDialogOpen(true);
                               }}>
                                 <Pencil className="w-3 h-3" />
                               </button>
                               <button type="button" className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" onClick={(e) => {
                                 e.stopPropagation();
                                 setDeleteAppointmentId(resource.id);
                               }}>
                                 <Trash2 className="w-3 h-3" />
                               </button>
                            </div>
                          )}
                        </div>
                      );
                    }
                  }}
                  eventPropGetter={(event: any) => {
                    const prio = event.resource.priorityLevel || "Routine";
                    const isJustOptimized = event.resource.id === lastOptimizedId;

                    if (calendarView === "agenda") {
                       return { className: "font-sans" };
                    }

                    let style: any = {
                      borderRadius: '6px',
                      color: '#065f46',
                      backgroundColor: '#d1fae5',
                      border: '1px solid #6ee7b7',
                      borderLeft: '4px solid #10b981',
                    };

                    if (prio === 'Urgent') {
                      style = {
                        ...style,
                        color: '#9f1239',
                        backgroundColor: '#ffe4e6',
                        border: '1px solid #fda4af',
                        borderLeft: '4px solid #f43f5e',
                      };
                    } else if (prio === 'Soon' || prio === 'High') {
                      style = {
                        ...style,
                        color: '#92400e',
                        backgroundColor: '#fef3c7',
                        border: '1px solid #fcd34d',
                        borderLeft: '4px solid #f59e0b',
                      };
                    }

                    if (isJustOptimized) {
                      style = {
                        ...style,
                        color: '#ffffff',
                        backgroundColor: '#10b981',
                        borderLeft: '4px solid #047857',
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                      };
                    }

                    return { style, className: "shadow-sm hover:shadow-md transition-shadow" };
                  }}
                  className="font-sans"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Standard Booking Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-[500px]" dir={lang === "ar" ? "rtl" : "ltr"}>
          <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <DialogTitle>{optimizationReview ? "AI Optimization Review" : tx("bookAppointment", lang)}</DialogTitle>
            <DialogDescription>
              {optimizationReview ? "Review the AI's suggestions before confirming." : tx("bookingDialogDesc", lang)}
            </DialogDescription>
          </DialogHeader>
          
          {optimizationReview ? (
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1 pr-3">
              {optimizationReview.aiExplanation && (
                <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg flex gap-2 items-start text-sm font-medium border border-emerald-100">
                  <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{optimizationReview.aiExplanation}</p>
                </div>
              )}
              {optimizationReview.diffs.map((diff, idx) => (
                <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-3 py-2 border-b flex justify-between items-center">
                    <span className="font-semibold text-slate-700">{diff.field}</span>
                    {diff.flag ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Suggested Change</span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">No Change Recommended</span>
                    )}
                  </div>
                  <div className="p-3 text-sm space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="rounded p-2 bg-slate-50 border border-slate-100">
                        <span className="block text-[10px] uppercase text-slate-400 font-bold mb-1">YOUR ENTRY</span>
                        <span className={`font-medium text-slate-600 ${diff.flag && fieldDecisions[diff.field] === "ACCEPT" ? "line-through" : ""}`}>{diff.staff_entry || diff.staffEntry || "-"}</span>
                      </div>
                      <div className={`rounded p-2 border ${diff.flag ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100"}`}>
                        <span className={`block text-[10px] uppercase font-bold mb-1 ${diff.flag ? "text-emerald-600" : "text-slate-400"}`}>AI SUGGESTION</span>
                        <span className={`font-bold ${diff.flag ? "text-emerald-700" : "text-slate-500"}`}>{(diff.ai_suggestion || diff.aiSuggestion) === "KEEP" ? (diff.staff_entry || diff.staffEntry) : (diff.ai_suggestion || diff.aiSuggestion)}</span>
                      </div>
                    </div>
                    {diff.flag && diff.reasoning && (
                      <div className="text-[12px] text-slate-600 bg-slate-50/80 p-3 rounded-lg border border-slate-100 mt-1 leading-relaxed">
                        <p>{diff.reasoning}</p>
                      </div>
                    )}
                    {diff.flag && (
                      <div className="flex flex-col gap-2 justify-center pt-3 border-t border-slate-100 mt-2">
                        <span className="text-[10px] uppercase text-slate-400 font-bold text-center">Select which value to use:</span>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant={fieldDecisions[diff.field] === "ACCEPT" ? "default" : "outline"}
                            className={`flex-1 gap-2 ${fieldDecisions[diff.field] === "ACCEPT" ? "bg-emerald-600 text-white hover:bg-emerald-700 ring-2 ring-emerald-600 ring-offset-1" : "text-slate-500 hover:text-emerald-700"}`}
                            onClick={() => setFieldDecisions(prev => ({...prev, [diff.field]: "ACCEPT"}))}
                          >
                            {fieldDecisions[diff.field] === "ACCEPT" && <Sparkles className="w-3.5 h-3.5" />}
                            Use AI Suggestion
                          </Button>
                          <Button 
                            size="sm" 
                            variant={fieldDecisions[diff.field] === "KEEP" ? "default" : "outline"}
                            className={`flex-1 gap-2 ${fieldDecisions[diff.field] === "KEEP" ? "bg-slate-700 text-white hover:bg-slate-800 ring-2 ring-slate-700 ring-offset-1" : "text-slate-500 hover:text-slate-700"}`}
                            onClick={() => setFieldDecisions(prev => ({...prev, [diff.field]: "KEEP"}))}
                          >
                            Use My Entry
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1 pr-3">
              <div className="grid gap-2">
                <Label>{tx("patient", lang)}</Label>
                <Select value={patientId} onValueChange={setPatientId}>
                  <SelectTrigger><SelectValue placeholder={tx("selectPatient", lang)} /></SelectTrigger>
                  <SelectContent>
                    {patients.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name} ({p.nationalId})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Department *</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                  <SelectContent>
                    {["Allied Health", "Chronic Diseases Clinic", "Diagnostic Radiology", "Dressing", "Family Medicine Clinic", "Labortary Department", "Urgent Care Unit"].map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Visit Type *</Label>
                  <Select value={visitType} onValueChange={setVisitType}>
                    <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                    <SelectContent>
                      {["New Visit", "Walk In", "Follow Up Visit", "ER Visit", "Maternity Visit"].map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Priority</Label>
                  <Select value={priorityLevel} onValueChange={setPriorityLevel}>
                    <SelectTrigger><SelectValue placeholder="Select Priority" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Urgent">Urgent (within 4 hours)</SelectItem>
                      <SelectItem value="Soon">Soon (within 48 hours)</SelectItem>
                      <SelectItem value="Routine">Routine (Next open slot, no acute risk)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>{lang === "ar" ? "Ù…Ø²ÙˆØ¯ Ø§Ù„Ø±Ø¹Ø§ÙŠØ© Ø§Ù„ØµØ­ÙŠØ©" : "Healthcare Provider"}</Label>
                <Select value={providerId} onValueChange={setProviderId}>
                  <SelectTrigger><SelectValue placeholder={tx("selectProvider", lang)} /></SelectTrigger>
                  <SelectContent>
                    {providers.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name} ({p.role})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{tx("date", lang)}</Label>
                  <Input type="date" value={dateStr} onChange={e => setDateStr(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>{tx("time", lang)}</Label>
                  <Select value={timeStr} onValueChange={setTimeStr}>
                    <SelectTrigger><SelectValue placeholder="Select Time" /></SelectTrigger>
                    <SelectContent className="max-h-48 overflow-y-auto">
                      {Array.from({ length: 19 }).map((_, i) => {
                        const hour = Math.floor(i / 2) + 8;
                        const min = i % 2 === 0 ? "00" : "30";
                        const time = `${hour.toString().padStart(2, '0')}:${min}`;
                        const displayHour = hour > 12 ? hour - 12 : hour;
                        const ampm = hour >= 12 ? "PM" : "AM";
                        const display = `${displayHour.toString().padStart(2, '0')}:${min} ${ampm}`;
                        return <SelectItem key={time} value={time}>{display}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>{tx("appointmentReason", lang)}</Label>
                <Input placeholder="Routine Checkup, Fever, etc" value={reason} onChange={e => setReason(e.target.value)} />
              </div>
            </div>
          )}
          
          <DialogFooter className="pt-2 flex gap-2 justify-end mt-4">
            {optimizationReview ? (
               <>
                 <Button variant="ghost" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => setOptimizationReview(null)}>Reject AI Changes</Button>
                 <Button onClick={handleConfirmOptimization} disabled={createMutation.isPending || updateMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                   <Sparkles className="w-4 h-4" /> Accept & Book
                 </Button>
               </>
            ) : (
               <>
                 <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>{tx("cancel", lang)}</Button>
                 <Button variant="outline" className="gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={handleOptimize} disabled={optimizeMutation.isPending}>
                    {optimizeMutation.isPending ? "Optimizing..." : <><Sparkles className="w-4 h-4" /> Optimize with AI</>}
                 </Button>
                 <Button onClick={handleCreate} disabled={createMutation.isPending || updateMutation.isPending}>{tx("save", lang)}</Button>
               </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Details & AI Optimization Report Dialog */}
      <Dialog open={selectedAppointment !== null} onOpenChange={(open) => { if (!open) setSelectedAppointment(null); }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" dir={lang === "ar" ? "rtl" : "ltr"}>
          <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <CalendarPlus className="w-5 h-5 text-emerald-500" />
              {tx("appointmentDetails", lang)}
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              {lang === "ar" ? "ØªÙ Ø§ØµÙŠÙ„ Ù…ÙˆØ¹Ø¯ Ø§Ù„Ù…Ø±ÙŠØ¶ ÙˆØªÙ‚Ø§Ø±ÙŠØ± Ø¬Ø¯ÙˆÙ„Ø© Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ." : "Patient appointment details and AI scheduling insights."}
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (<>
            <div className="space-y-6 pt-4 text-slate-700 dark:text-slate-300">
              <div className="grid grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-900/40 p-4 rounded-lg border border-slate-100 dark:border-slate-800 text-sm">
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">{tx("patient", lang)}</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedAppointment.patientName}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">{lang === "ar" ? "Ù…Ø²ÙˆØ¯ Ø§Ù„Ø±Ø¹Ø§ÙŠØ©" : "Provider"}</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedAppointment.providerName || "Any"}</span>
                </div>
                <div className="mt-2">
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">{tx("dateTime", lang)}</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {format(new Date(selectedAppointment.appointmentDate), "PP p")}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">{tx("bookingType", lang)}</span>
                  <span className="inline-flex items-center gap-1 font-medium">
                    {selectedAppointment.isAiGenerated ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> AI Optimized
                      </span>
                    ) : (
                      <span className="text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1">
                        {lang === "ar" ? "ÙŠØ¯ÙˆÙŠ" : "Manual Slot"}
                      </span>
                    )}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedAppointment.priorityLevel || "Routine"}</span>
                </div>
                <div className="mt-2">
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Department</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedAppointment.department || "General"}</span>
                </div>
                <div className="mt-2">
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Visit Type</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedAppointment.visitType || "Routine"}</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">{tx("appointmentReason", lang)}</h4>
                <p className="text-slate-800 dark:text-slate-200 text-sm font-medium border-l-2 border-slate-300 dark:border-slate-700 pl-3 py-1 bg-slate-50/20">
                  {selectedAppointment.reason}
                </p>
                {selectedAppointment.notes && (
                  <div className="mt-3">
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Notes</h4>
                    <p className="text-slate-600 dark:text-slate-400 text-sm border-l-2 border-slate-200 dark:border-slate-800 pl-3 py-1">
                      {selectedAppointment.notes}
                    </p>
                  </div>
                )}
              </div>

              {selectedAppointment.isAiGenerated ? (
                <div className="border border-emerald-100 dark:border-emerald-900/50 rounded-xl overflow-hidden shadow-sm shadow-emerald-100/30">
                  <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/40 dark:from-emerald-950/20 dark:to-teal-950/10 px-4 py-3 border-b border-emerald-100/50 dark:border-emerald-900/40 flex justify-between items-center">
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold text-sm flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                      AI Optimization Report
                    </span>
                    {(() => {
                      const prio = selectedAppointment.priorityLevel || "Routine";
                      let colorClass = "bg-sky-50 text-sky-700 border-sky-200";
                      if (prio === "Urgent") colorClass = "bg-rose-50 text-rose-700 border-rose-200";
                      else if (prio === "High") colorClass = "bg-amber-50 text-amber-700 border-amber-200";
                      return (
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${colorClass}`}>
                          {prio}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="p-4 space-y-4 bg-white dark:bg-slate-900 text-sm">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Summary</span>
                      <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                        {selectedAppointment.aiExplanation || "Optimized based on medical history and patient symptoms."}
                      </p>
                    </div>
                    {(() => {
                      try {
                        const diffs = JSON.parse(selectedAppointment.optimizationDiffs || "[]");
                        if (diffs.length === 0) return null;
                        return (
                          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">Field-by-Field Review</span>
                            {diffs.map((d: any, i: number) => (
                              <div key={i} className="rounded-lg border border-slate-100 dark:border-slate-800 overflow-hidden">
                                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5">
                                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">{d.field}</span>
                                  {d.flag ? (
                                    <span className="text-[9px] font-bold uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Changed</span>
                                  ) : (
                                    <span className="text-[9px] font-medium text-slate-400">No Change</span>
                                  )}
                                </div>
                                <div className="p-3 space-y-2">
                                  <div className="grid grid-cols-2 gap-2 text-center">
                                    <div className="rounded p-1.5 bg-slate-50 border border-slate-100 dark:bg-slate-800/30 dark:border-slate-700">
                                      <span className="block text-[9px] uppercase text-slate-400 font-bold">Staff Entry</span>
                                      <span className={`text-xs font-medium ${d.flag ? "line-through text-slate-400" : "text-slate-600 dark:text-slate-300"}`}>{d.staff_entry || d.staffEntry || "-"}</span>
                                    </div>
                                    <div className={`rounded p-1.5 border ${d.flag ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900" : "bg-slate-50 border-slate-100 dark:bg-slate-800/30 dark:border-slate-700"}`}>
                                      <span className={`block text-[9px] uppercase font-bold ${d.flag ? "text-emerald-600" : "text-slate-400"}`}>AI Suggestion</span>
                                      <span className={`text-xs font-bold ${d.flag ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500"}`}>{(d.ai_suggestion || d.aiSuggestion) === "KEEP" ? (d.staff_entry || d.staffEntry) : (d.ai_suggestion || d.aiSuggestion)}</span>
                                    </div>
                                  </div>
                                  {(d.reasoning) && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50/50 dark:bg-slate-800/20 p-2 rounded">{d.reasoning}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      } catch { return null; }
                    })()}
                  </div>
                </div>
              ) : (
                <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 bg-slate-50/30 dark:bg-slate-900/20 text-xs">
                  <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-slate-400"></span>
                    {tx("manualBookingNote", lang)}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    {tx("manualBookingDesc", lang)}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 flex sm:flex-row flex-col gap-2 justify-end">
              {!selectedAppointment.isAiGenerated && (
                <Button 
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  onClick={() => {
                    setPatientId(selectedAppointment.patientId.toString());
                    setReason(selectedAppointment.reason);
                    if (selectedAppointment.providerId) setProviderId(selectedAppointment.providerId.toString());
                    if (selectedAppointment.department) setDepartment(selectedAppointment.department);
                    if (selectedAppointment.visitType) setVisitType(selectedAppointment.visitType);
                    setPriorityLevel(selectedAppointment.priorityLevel || "Routine");
                    const dt = new Date(selectedAppointment.appointmentDate);
                    setDateStr(dt.toLocaleDateString("en-CA"));
                    setTimeStr(dt.toTimeString().slice(0, 5));
                    setOptimizeAppointmentId(selectedAppointment.id);
                    setSelectedAppointment(null);
                    setIsDialogOpen(true);
                  }}
                >
                  <Sparkles className="w-4 h-4" /> Optimize Slot with AI
                </Button>
              )}
              <Button className="w-full sm:w-auto" variant="outline" onClick={() => setSelectedAppointment(null)}>
                {tx("cancel", lang)}
              </Button>
            </DialogFooter>
          </>)}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteAppointmentId !== null} onOpenChange={(open) => !open && setDeleteAppointmentId(null)}>
        <AlertDialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl" dir={lang === "ar" ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-500" /> 
              {lang === "ar" ? "ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø­Ø°Ù" : "Confirm Deletion"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
              {lang === "ar" ? "Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø­Ø°Ù Ù‡Ø°Ø§ Ø§Ù„Ù…ÙˆØ¹Ø¯ØŸ Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø§Ù„ØªØ±Ø§Ø¬Ø¹ Ø¹Ù† Ù‡Ø°Ø§ Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡." : "Are you sure you want to delete this appointment? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="border-slate-200 dark:border-slate-700">{tx("cancel", lang)}</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={() => {
                if (deleteAppointmentId) deleteMutation.mutate(deleteAppointmentId);
              }}
            >
              {lang === "ar" ? "Ø­Ø°Ù" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
