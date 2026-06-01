import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { CalendarPlus, Sparkles, Pencil, Trash2 } from "lucide-react";
import { apiFetch } from "@/api/client";
import { useLang } from "@/hooks/useLang";
import { tx } from "@/lib/i18n";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRow | null>(null);
  const [optimizeAppointmentId, setOptimizeAppointmentId] = useState<number | null>(null);
  const [lastOptimizedId, setLastOptimizedId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

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
      toast.success(lang === "ar" ? "تم حذف الموعد" : "Appointment deleted successfully");
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

    const payload = {
      patientId: Number(patientId),
      providerId: finalProviderId ? Number(finalProviderId) : undefined,
      appointmentDate: new Date(`${finalDate}T${finalTime}`).toISOString(),
      reason,
      department,
      visitType,
      priorityLevel: finalPriority || "Routine",
      isAiGenerated: true,
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
    optimizeMutation.mutate({
      patientId: parseInt(patientId),
      providerId: providerId ? parseInt(providerId) : undefined,
      appointmentDate: dateStr,
      timeStr,
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
    { header: tx("dateTime", lang), accessor: (row) => format(new Date(row.appointmentDate), "PP p") },
    { header: tx("patient", lang), accessor: "patientName" },
    { header: tx("provider", lang), accessor: (row) => row.providerName || "Any" },
    { header: "Priority", accessor: (row) => {
      const prio = row.priorityLevel || "Routine";
      let colorClass = "bg-sky-50 text-sky-700 border-sky-200";
      if (prio === "Urgent") colorClass = "bg-rose-50 text-rose-700 border-rose-200";
      else if (prio === "Soon" || prio === "High") colorClass = "bg-amber-50 text-amber-700 border-amber-200";
      return <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${colorClass}`}>{prio}</span>;
    }},
    { header: tx("status", lang), accessor: (row) => (
      <div className="flex items-center gap-2">
        <StatusBadge variant={row.status === "Scheduled" ? "active" : "inactive"}>{row.status}</StatusBadge>
        {row.isAiGenerated && <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium" title="Optimized by AI"><Sparkles className="w-3.5 h-3.5" /> AI</div>}
      </div>
    )},
    {
      header: tx("actions", lang) || "Actions",
      accessor: (row) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="outline" size="sm" onClick={() => handleRowClick(row)}>
            {tx("view", lang) || "View"}
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100" onClick={() => {
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
          <Button variant="outline" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50" onClick={() => {
            if(confirm(lang === "ar" ? "هل أنت متأكد من حذف هذا الموعد؟" : "Are you sure you want to delete this appointment?")) {
              deleteMutation.mutate(row.id);
            }
          }}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          {!row.isAiGenerated && (
            <Button variant="outline" size="sm" className="gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => {
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
              <Sparkles className="w-3 h-3" /> Optimize With AI
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title={tx("appointments", lang)}
        description={tx("manageAppointmentsDesc", lang)}
        actions={
          <div className="flex gap-2 items-center">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <Button 
                variant={viewMode === "list" ? "secondary" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("list")}
                className={`text-sm ${viewMode === "list" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}
              >
                List
              </Button>
              <Button 
                variant={viewMode === "calendar" ? "secondary" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("calendar")}
                className={`text-sm ${viewMode === "calendar" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}
              >
                Calendar
              </Button>
            </div>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <CalendarPlus className="w-4 h-4" /> {tx("bookAppointment", lang)}
            </Button>
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
          {viewMode === "list" ? (
            <DataTable 
              columns={columns} 
              data={appointments} 
              emptyMessage={tx("noData", lang)} 
              rowClassName={(row) => {
                if (row.id === lastOptimizedId) return "bg-indigo-50 dark:bg-indigo-900/50 border-l-4 border-indigo-500 cursor-pointer transition-colors duration-700";
                return row.isAiGenerated ? "bg-emerald-100/60 hover:bg-emerald-100 dark:bg-emerald-900/30 cursor-pointer" : "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800";
              }}
              onRowClick={handleRowClick}
            />
          ) : (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800" style={{ height: "65vh" }}>
              <Calendar
                localizer={localizer}
                events={appointments.map(appt => ({
                  id: appt.id,
                  title: `${appt.patientName} - ${appt.reason}`,
                  start: new Date(appt.appointmentDate),
                  end: new Date(new Date(appt.appointmentDate).getTime() + 30 * 60000), // 30 min duration
                  resource: appt
                }))}
                startAccessor="start"
                endAccessor="end"
                onSelectEvent={(event: any) => handleRowClick(event.resource)}
                eventPropGetter={(event: any) => {
                  let className = "bg-emerald-50 text-emerald-900 border-l-4 border-emerald-500 font-medium text-xs";
                  if (event.resource.id === lastOptimizedId) {
                    className = "bg-emerald-500 text-white font-bold animate-pulse shadow-md border-l-4 border-emerald-700 text-xs ring-1 ring-emerald-500";
                  } else if (event.resource.isAiGenerated) {
                    className = "bg-teal-50 text-teal-950 border-l-4 border-teal-500 font-medium text-xs";
                  }
                  return { className };
                }}
                className="font-sans"
              />
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
                    {diff.reasoning && (
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
                      {["Urgent", "Soon", "Routine"].map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>{lang === "ar" ? "مزود الرعاية الصحية" : "Healthcare Provider"}</Label>
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
                  <Input type="time" value={timeStr} onChange={e => setTimeStr(e.target.value)} />
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
              {lang === "ar" ? "تفاصيل موعد المريض وتقارير جدولة الذكاء الاصطناعي." : "Patient appointment details and AI scheduling insights."}
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
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">{lang === "ar" ? "مزود الرعاية" : "Provider"}</span>
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
                        {lang === "ar" ? "يدوي" : "Manual Slot"}
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
    </DashboardLayout>
  );
}
