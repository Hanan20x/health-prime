import { useMemo, useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertTriangle,
  Pencil,
  Printer,
  X,
  Plus,
  Heart,
  Settings,
  ChevronRight,
  ChevronDown,
  Check,
  Loader2,
  Undo2,
  List,
  Image as ImageIcon,
  History,
  Activity,
  FlaskConical,
  Trash2,
  CalendarDays,
  Camera,
  MoveHorizontal,
  UserRound,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Stethoscope,
  Save,
} from "lucide-react";
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
import { apiFetch } from "@/api/client";
import type { EmrPage } from "@/api/types";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/PageHeader";
import { useLang } from "@/hooks/useLang";
import { tx, txEmrSection, txGender, txStatus } from "@/lib/i18n";
import { toast } from "sonner";

// ─── PatientEMRPage ────────────────────────────────────────────────────────────

export default function PatientEMRPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const patientId = id ? Number(id) : 0;
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { lang } = useLang();

  // Queries
  const { data, isLoading, error } = useQuery({
    queryKey: ["emr", patientId],
    queryFn: () => apiFetch<EmrPage>(`/patients/${patientId}/emr`),
    enabled: patientId > 0,
  });

  const fullSectionTitles = [
    "Chief Complaints",
    "Present Illness",
    "Past Medical/Surgical History",
    "Gynecological and Obstetrical History",
    "Family History",
    "Surgical / Medical Procedure",
    "Medication History",
    "Personal/Social History",
    "Developmental History",
    "Physical Examination",
    "OB History",
    "Doctor Notes",
    "Doctor Recommendation and Advice",
    "Plan of Care"
  ];

  const recordsBySection = useMemo(() => {
    if (!data) return {};
    const map: Record<string, any[]> = {};
    if (data.sections) {
      data.sections.forEach(s => {
        const key = s.key;
        if (!map[key]) map[key] = [];
        map[key].push(s);
      });
    }
    return map;
  }, [data]);

  const latestVitals = useMemo(() => {
    const composite = { height: "—", weight: "—", bmi: "—", temp: "—", bp: "—", hr: "—", spo2: "—" };
    const vitalsHistory = data?.vitals_history || data?.vitalsHistory || [];
    if (!vitalsHistory || vitalsHistory.length === 0) return composite;
    
    for (const v of vitalsHistory) {
      if (composite.height === "—" && v.height && v.height !== "—") composite.height = v.height;
      if (composite.weight === "—" && v.weight && v.weight !== "—") composite.weight = v.weight;
      if (composite.bmi === "—" && v.bmi && v.bmi !== "—") composite.bmi = v.bmi;
      if (composite.temp === "—" && v.temp && v.temp !== "—") composite.temp = v.temp;
      if (composite.bp === "—" && v.bp && v.bp !== "—") composite.bp = v.bp;
      if (composite.hr === "—" && v.hr && v.hr !== "—") composite.hr = v.hr;
      if (composite.spo2 === "—" && v.spo2 && v.spo2 !== "—") composite.spo2 = v.spo2;
    }
    return composite;
  }, [data]);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["Chief Complaints"]));
  const [editingId, setEditingId] = useState<string | null>("Chief Complaints");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null);
  const [draftToClear, setDraftToClear] = useState<string | null>(null);

  // --- Diagnoses ---
  const [aiConsentOpen, setAiConsentOpen] = useState(false);
  const [aiConsentDisclaimerChecked, setAiConsentDisclaimerChecked] = useState(false);
  const [aiConsentPatientChecked, setAiConsentPatientChecked] = useState(false);

  const [addingDiagnosis, setAddingDiagnosis] = useState(false);
  const [newDiagCode, setNewDiagCode] = useState("");
  const [newDiagTitle, setNewDiagTitle] = useState("");
  const [newDiagNotes, setNewDiagNotes] = useState("");
  const [isAddDiagnosisModalOpen, setIsAddDiagnosisModalOpen] = useState(false);
  const [editingDiagnosisId, setEditingDiagnosisId] = useState<number | null>(null);
  const [editDiagStatus, setEditDiagStatus] = useState("Active");
  const [editDiagNotes, setEditDiagNotes] = useState("");
  const [editDiagCode, setEditDiagCode] = useState("");
  const [editDiagTitle, setEditDiagTitle] = useState("");
  const [editIcdSearch, setEditIcdSearch] = useState("");
  const [editIcdResults, setEditIcdResults] = useState<{code: string, title: string}[]>([]);
  const [editIcdLoading, setEditIcdLoading] = useState(false);
  const [showEditIcdDropdown, setShowEditIcdDropdown] = useState(false);
  const [diagnosisToDelete, setDiagnosisToDelete] = useState<number | null>(null);

  const [icdSearchTerm, setIcdSearchTerm] = useState("");
  const [icdSearchResults, setIcdSearchResults] = useState<{code: string, title: string, description?: string}[]>([]);

  const [isSearchingIcd, setIsSearchingIcd] = useState(false);
  const [showIcdDropdown, setShowIcdDropdown] = useState(false);

  const [viewingDiagnosisNotes, setViewingDiagnosisNotes] = useState<{title: string, notes: string} | null>(null);

  useEffect(() => {
    if (icdSearchTerm.length < 2) {
      setIcdSearchResults([]);
      return;
    }
    // Only search if we haven't selected a final diagnosis (the search term wouldn't just be the display string)
    if (newDiagCode && icdSearchTerm.includes(newDiagCode)) return;

    const delayDebounceFn = setTimeout(() => {
      setIsSearchingIcd(true);
      apiFetch(`/icd10/search?q=${encodeURIComponent(icdSearchTerm)}`)
        .then((res: any) => setIcdSearchResults(res || []))
        .catch(() => setIcdSearchResults([]))
        .finally(() => setIsSearchingIcd(false));
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [icdSearchTerm, newDiagCode]);

  useEffect(() => {
    if (editIcdSearch.length < 2) { setEditIcdResults([]); return; }
    if (editDiagCode && editIcdSearch.includes(editDiagCode)) return;
    const t = setTimeout(() => {
      setEditIcdLoading(true);
      apiFetch(`/icd10/search?q=${encodeURIComponent(editIcdSearch)}`)
        .then((res: any) => setEditIcdResults(res || []))
        .catch(() => setEditIcdResults([]))
        .finally(() => setEditIcdLoading(false));
    }, 500);
    return () => clearTimeout(t);
  }, [editIcdSearch, editDiagCode]);


  const addDiagnosisMutation = useMutation({
    mutationFn: (body: any) => apiFetch(`/patients/${patientId}/diagnoses`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emr", patientId] });
      setAddingDiagnosis(false);
      setNewDiagCode("");
      setNewDiagTitle("");
      setNewDiagNotes("");
      setIsAddDiagnosisModalOpen(false);
      toast.success("Diagnosis added successfully");
    },
    onError: (error: any) => toast.error(error instanceof Error ? error.message : "Failed to add diagnosis")
  });

  const deleteDiagMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/patients/${patientId}/diagnoses/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emr", patientId] });
      setDiagnosisToDelete(null);
      toast.success("Diagnosis removed");
    },
    onError: (error: any) => toast.error(error instanceof Error ? error.message : "Failed to delete diagnosis")
  });

  const editDiagMutation = useMutation({
    mutationFn: ({ id, status, notes, icd_code, icd_title }: { id: number, status: string, notes: string, icd_code?: string, icd_title?: string }) =>
      apiFetch(`/patients/${patientId}/diagnoses/${id}`, { method: "PATCH", body: JSON.stringify({ status, notes, icd_code, icd_title }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emr", patientId] });
      setEditingDiagnosisId(null);
      toast.success("Diagnosis updated");
    },
    onError: (error: any) => toast.error(error instanceof Error ? error.message : "Failed to update diagnosis")
  });




  const saveMutation = useMutation({
    mutationFn: async ({ sectionId, content }: { sectionId: string; content: string }) => {
      return apiFetch(`/patients/${patientId}/emr/${sectionId}`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["emr", patientId] });
      setDrafts(prev => {
        const next = { ...prev };
        delete next[variables.sectionId];
        return next;
      });
      setEditingId(null);
      toast.success(tx("clinicalEntrySaved", lang));
    },
    onError: () => toast.error(tx("failedSaveEntry", lang))
  });

  const deleteMutation = useMutation({
    mutationFn: (recordId: number) => apiFetch(`/emr/records/${recordId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emr", patientId] });
      setRecordToDelete(null);
      toast.success(tx("recordRemoved", lang));
    },
    onError: () => toast.error(tx("failedDeleteRecord", lang))
  });

  const updateAvatarMutation = useMutation({
    mutationFn: (avatarUrl: string | null) => {
      if (avatarUrl) {
        return apiFetch(`/patients/${patientId}/emr/PATIENT_IMAGE`, {
          method: "POST",
          body: JSON.stringify({ content: avatarUrl }),
        });
      } else {
        return apiFetch(`/patients/${patientId}/photo`, { method: "DELETE" });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emr", patientId] });
      toast.success(tx("photoUpdated", lang));
    },
    onError: () => toast.error(tx("failedUpdatePhoto", lang))
  });



  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
        if (editingId === sectionId) setEditingId(null);
      } else {
        next.add(sectionId);
        setEditingId(sectionId);
        if (drafts[sectionId] === undefined) setDrafts(prev => ({ ...prev, [sectionId]: "" }));
      }
      return next;
    });
  };

  const handleUpdateDraft = (sectionId: string, value: string) => setDrafts(prev => ({ ...prev, [sectionId]: value }));

  const handleAddBullet = (sectionId: string) => {
    const prev = drafts[sectionId] || "";
    const startOfLine = prev.length === 0 || prev.endsWith('\n');
    const newValue = prev + (startOfLine ? "• " : "\n• ");
    handleUpdateDraft(sectionId, newValue);
  };

  const handlePrint = () => window.print();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => updateAvatarMutation.mutate(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) return <DashboardLayout><Skeleton className="h-[600px] w-full" /></DashboardLayout>;

  if (!id || id === "undefined" || patientId === 0) {
    navigate("/patients", { replace: true });
    return null;
  }

  if (isLoading) return <DashboardLayout><div className="p-20 text-center flex flex-col items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary mb-4" /><p className="text-muted-foreground font-bold uppercase tracking-widest">{tx("loading", lang) || "Loading..."}</p></div></DashboardLayout>;
  
  if (error) return <DashboardLayout><div className="p-10 text-center text-destructive font-bold bg-destructive/10 m-6 rounded-xl border border-destructive/20">{tx("error", lang)}: {error instanceof Error ? error.message : "Failed to load"}</div></DashboardLayout>;
  
  if (!data) return <DashboardLayout><div className="p-10 text-center text-muted-foreground font-bold">No data found</div></DashboardLayout>;

  const patient = data.patient;
  const vitalsHistory = data.vitals_history || data.vitalsHistory || [];

  return (
    <DashboardLayout>
      <style>{`
        @media print {
          .no-print, .actions, .sidebar, .nav-header, button { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; }
          .main-content { margin: 0 !important; padding: 0 !important; width: 100% !important; }
        }
      `}</style>
      
      <div className="no-print">
        <PageHeader
          title={patient.name}
          description={`ID: ${patient.nationalId} · ${txGender(patient.gender, lang)} · ${patient.dob} (${patient.age}y)`}
          actions={
            <div className="flex gap-2">
              <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2 border-primary/20 hover:bg-primary/5 text-primary">
                <Printer className="w-4 h-4" /> {tx("printHistory", lang)}
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/patients")} className="text-destructive border-destructive/20 hover:bg-destructive/5">
                <X className="w-4 h-4" /> {tx("closeChart", lang)}
              </Button>
            </div>
          }
        />
      </div>

      <div className="space-y-8 main-content">
        {/* Patient Banner */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
           <div className="relative group no-print">
              <Avatar className="w-36 h-36 border-4 border-card shadow-2xl">
                 <AvatarImage src={patient.avatarUrl || ""} className="object-cover" />
                 <AvatarFallback className="bg-primary/10 text-primary text-4xl font-black">
                   {patient.name.split(' ').map(n => n[0]).join('')}
                 </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-primary/20 backdrop-blur-[2px] rounded-full cursor-pointer">
                 <div className="flex gap-3">
                    <button onClick={() => fileInputRef.current?.click()} className="p-2.5 bg-card rounded-full shadow-lg hover:scale-110 transition-transform text-primary"><Camera className="w-5 h-5" /></button>
                    {patient.avatarUrl && (
                       <button onClick={() => updateAvatarMutation.mutate(null)} className="p-2.5 bg-card rounded-full shadow-lg hover:scale-110 transition-transform text-destructive"><Trash2 className="w-5 h-5" /></button>
                    )}
                 </div>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
           </div>

           <div className="flex-1 w-full space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                 {[
                   { label: tx("heightUnit", lang) || "Height", value: latestVitals?.height || "—", icon: MoveHorizontal },
                   { label: tx("weightUnit", lang) || "Weight", value: latestVitals?.weight || "—", icon: MoveHorizontal },
                   { label: tx("bmiUnit", lang) || "BMI", value: latestVitals?.bmi || "—", color: "text-destructive", icon: Activity },
                   { label: "Temp (°C)", value: latestVitals?.temp || "—", icon: Activity },
                   { label: tx("bpUnit", lang) || "BP", value: latestVitals?.bp || "—", icon: Activity },
                   { label: tx("hrUnit", lang) || "HR", value: latestVitals?.hr || "—", icon: Heart },
                   { label: tx("spo2Unit", lang) || "SpO2", value: latestVitals?.spo2 || "—", icon: Activity },
                 ].map((stat, i) => (
                   <div key={i} className="bg-card border border-border/50 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow ring-1 ring-border/5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{stat.label}</p>
                      <p className={cn("text-xl font-black tracking-tight", stat.value === "—" ? "text-muted-foreground/30" : (stat.color || "text-primary"))}>{stat.value}</p>
                   </div>
                 ))}
              </div>

              {patient.allergies && patient.allergies.length > 0 && (
                <div className="bg-destructive/5 border border-destructive/10 text-destructive px-6 py-4 rounded-xl flex items-center justify-between text-sm font-bold no-print shadow-inner">
                   <div className="flex items-center gap-3">
                      <div className="bg-destructive/10 p-2 rounded-full"><AlertTriangle className="w-5 h-5" /></div>
                      <span>{tx("safetyAlert", lang)}: <span className="uppercase ml-1 tracking-tight">{patient.allergies.join(", ")}</span></span>
                   </div>
                </div>
              )}
           </div>
        </div>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           <div className="lg:col-span-8 flex flex-col gap-8">
              <div className="flex flex-col bg-card border border-border/60 rounded-2xl overflow-hidden shadow-lg shadow-primary/5">

              <div className="px-6 py-5 border-b border-border/60 bg-muted/30 flex items-center justify-between">
                 <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-3">
                    <History className="w-5 h-5" /> {tx("clinicalHistory", lang)}
                 </h3>
              </div>

              <div className="divide-y divide-border/40">
                 {fullSectionTitles.map((title) => {
                   const key = title;
                   const isOpen = expandedSections.has(key);
                   const isEditing = editingId === key;
                   const history = recordsBySection[key] || [];

                   return (
                     <div key={key} className="flex flex-col group/section">
                        <button onClick={() => toggleSection(key)} className={cn("w-full flex items-center gap-4 px-8 py-5 text-left transition-all no-print", isOpen ? "bg-primary/5 border-l-[3px] border-primary" : "hover:bg-muted/10 border-l-[3px] border-transparent")}>
                           <div className={cn("p-1.5 rounded-md transition-colors", isOpen ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                           </div>
                           <span className={cn("text-sm font-black uppercase tracking-wider transition-colors", isOpen ? "text-primary" : "text-muted-foreground group-hover/section:text-foreground")}>{txEmrSection(title, lang)}</span>
                           <div className="ml-auto flex items-center gap-3">
                              {title === "Chief Complaints" && (
                                <Button size="sm" variant="outline" className="h-8 text-xs font-bold shadow-sm bg-white pointer-events-auto" onClick={(e) => { e.stopPropagation(); setIsAddDiagnosisModalOpen(true); }}>
                                   <Plus className="w-3.5 h-3.5 mr-1" /> Add Manual Diagnosis
                                </Button>
                              )}
                              {history.length > 0 && <span className="text-xs font-black bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">{history.length} {tx("records", lang)}</span>}
                              <Pencil className={cn("w-4 h-4 text-primary transition-all", isEditing ? "opacity-100 scale-110" : "opacity-0 group-hover/section:opacity-100")} />
                           </div>
                        </button>
                        
                        <div className="hidden print:block px-8 py-3 bg-muted/20 border-b border-border font-black text-[10px] uppercase text-primary mt-6 tracking-widest">{txEmrSection(title, lang)}</div>

                        {(isOpen || true) && (
                          <div className={cn("px-16 pb-8 pt-4 bg-background/20 space-y-8", !isOpen && "print:block hidden")}>
                             {isOpen && title !== "Chief Complaints" && (
                               <div className="space-y-4 bg-card border border-primary/10 rounded-2xl p-6 shadow-xl no-print ring-1 ring-primary/5">
                                  <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-4">
                                     <p className="text-xs font-black uppercase text-primary flex items-center gap-2">
                                        <Plus className="w-4 h-4" /> {tx("newLogEntry", lang)}
                                     </p>
                                     <div className="flex gap-4">
                                        <button title={tx("clearAll", lang)} onClick={() => setDraftToClear(key)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive/40 hover:text-destructive transition-all"><Trash2 className="w-4 h-4" /></button>
                                        <button title={tx("undo", lang)} onClick={() => handleUpdateDraft(key, "")} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-all"><Undo2 className="w-4 h-4" /></button>
                                        <button title={tx("addBullet", lang)} onClick={() => handleAddBullet(key)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-all"><List className="w-4 h-4" /></button>
                                     </div>
                                  </div>
                                  <textarea
                                    value={drafts[key] ?? ""}
                                    onChange={(e) => handleUpdateDraft(key, e.target.value)}
                                    className="w-full min-h-[150px] text-sm p-4 bg-background/50 border-none rounded-xl outline-none focus:ring-2 ring-primary/10 text-foreground transition-all placeholder:italic"
                                    placeholder={`${tx("initiateDocumentation", lang)} ${txEmrSection(title, lang)}...`}
                                  />
                                  <div className="flex items-center justify-end">
                                     <Button size="sm" className="h-10 text-xs px-8 font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all rounded-full" onClick={() => drafts[key] && saveMutation.mutate({ sectionId: key, content: drafts[key] })} disabled={saveMutation.isPending}>
                                        {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />} {tx("signAndSave", lang)}
                                     </Button>
                                  </div>
                               </div>
                             )}

                             {title === "Chief Complaints" && (
                                <div className="space-y-4 bg-card border border-primary/10 rounded-2xl p-6 shadow-xl no-print ring-1 ring-primary/5">
                                  <h4 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2 mb-4">
                                    <Stethoscope className="w-4 h-4" /> Structured Diagnoses
                                  </h4>
                                  {data?.diagnoses && data.diagnoses.length > 0 ? (
                     <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 mt-4">Saved Diagnoses</h4>
                        {data.diagnoses.map(d => (
                           <div key={d.id} className="group relative flex flex-col gap-3 p-6 rounded-2xl border-2 border-border/50 hover:border-primary/30 transition-all bg-background hover:shadow-md">
                              {/* Row 1: icon + badges + action buttons */}
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-2 flex-wrap">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                                       <Stethoscope className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-black bg-primary/10 text-primary px-3 py-1 rounded-lg uppercase tracking-wide">{d.icdCode || "-"}</span>
                                    {d.isAiGenerated ? (
                                       <span className="text-xs font-black uppercase text-amber-600 bg-amber-100 px-3 py-1 rounded-lg">AI Assisted</span>
                                    ) : (
                                       <span className="text-xs font-black uppercase text-slate-600 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">Manual</span>
                                    )}
                                 </div>
                                 <div className="flex items-center gap-2 shrink-0">
                                    <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => { setEditingDiagnosisId(d.id); setEditDiagStatus(d.status); setEditDiagNotes(d.notes || ""); setEditDiagCode(d.icdCode || ""); setEditDiagTitle(d.icdTitle || ""); setEditIcdSearch(d.icdCode || ""); setEditIcdResults([]); }}>
                                       <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => deleteDiagMutation.mutate(d.id)}>
                                       <Trash2 className="w-4 h-4" />
                                    </Button>
                                 </div>
                              </div>

                              {/* Row 2: title */}
                              <span className="font-bold text-lg text-foreground leading-snug" title={d.icdTitle || "-"}>{d.icdTitle || "-"}</span>

                              {/* Row 3: date + status */}
                              <div className="flex items-center gap-3">
                                 <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                                    <CalendarDays className="w-4 h-4" /> {d.diagnosedAt ? new Date(d.diagnosedAt).toLocaleDateString() : "Unknown date"} at {d.diagnosedAt ? new Date(d.diagnosedAt).toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"}) : "Unknown time"}
                                 </p>
                                 <span className={`text-xs font-bold uppercase px-3 py-0.5 rounded-full ${d.status === 'Active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{d.status}</span>
                              </div>

                              {d.notes && <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{d.notes}</p>}

                              <div>
                                 {d.isAiGenerated ? (
                                   d.notes && (
                                     <Button variant="outline" className="h-9 px-5 text-sm font-bold border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => navigate(`/patients/emr/${patientId}/diagnosis`, { state: { restoredDiagnosis: d } })}>
                                        <Sparkles className="w-4 h-4 mr-2" /> View AI Breakdown
                                     </Button>
                                   )
                                 ) : (
                                   <Button variant="outline" className="h-9 px-5 text-sm font-bold text-slate-600 hover:bg-slate-50 border-slate-200" onClick={() => setViewingDiagnosisNotes({title: d.icdTitle || "Manual Diagnosis", notes: d.notes || "No clinical notes were provided for this diagnosis."})}>
                                      <CheckCircle2 className="w-4 h-4 mr-2" /> View Clinical Notes
                                   </Button>
                                 )}
                              </div>

                              {editingDiagnosisId === d.id && (
                                    <div className="mt-5 p-6 bg-primary/5 border-2 border-primary/25 rounded-2xl space-y-5 shadow-md">
                                       <div className="flex items-center justify-between mb-1">
                                          <div className="flex items-center gap-2">
                                             <span className="w-1.5 h-5 rounded-full bg-primary inline-block" />
                                             <span className="text-sm font-black uppercase tracking-widest text-primary">Edit Diagnosis</span>
                                          </div>
                                          <button onClick={() => setEditingDiagnosisId(null)} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Close">
                                             <X className="w-4 h-4" />
                                          </button>
                                       </div>
                                       <div className="relative">
                                          <label className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-2 block">ICD-10 Code</label>
                                          <input
                                             type="text"
                                             className="w-full h-11 px-4 text-sm font-medium rounded-xl border-2 border-primary/20 bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                             placeholder="Search ICD-10 code or diagnosis name..."
                                             value={editIcdSearch}
                                             onChange={e => { setEditIcdSearch(e.target.value); setShowEditIcdDropdown(true); }}
                                             onFocus={() => editIcdResults.length > 0 && setShowEditIcdDropdown(true)}
                                          />
                                          {editDiagCode && (
                                             <div className="mt-2 flex items-center gap-2">
                                                <span className="text-xs font-black bg-primary/10 text-primary px-3 py-1 rounded-lg uppercase tracking-wide">{editDiagCode}</span>
                                                <span className="text-xs text-muted-foreground truncate">{editDiagTitle}</span>
                                             </div>
                                          )}
                                          {showEditIcdDropdown && editIcdResults.length > 0 && (
                                             <div className="absolute z-50 mt-1 w-full bg-background border-2 border-primary/20 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                                {editIcdLoading ? (
                                                   <div className="p-3 text-sm text-muted-foreground text-center">Searching...</div>
                                                ) : (
                                                   editIcdResults.map(r => (
                                                      <button key={r.code} type="button"
                                                         className="w-full text-left px-4 py-3 hover:bg-primary/5 border-b border-border/40 last:border-0 transition-colors"
                                                         onClick={() => { setEditDiagCode(r.code); setEditDiagTitle(r.title); setEditIcdSearch(`${r.code} — ${r.title}`); setShowEditIcdDropdown(false); setEditIcdResults([]); }}>
                                                         <span className="text-xs font-black text-primary mr-2">{r.code}</span>
                                                         <span className="text-sm">{r.title}</span>
                                                      </button>
                                                   ))
                                                )}
                                             </div>
                                          )}
                                       </div>
                                       <div>
                                          <label className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-2 block">Status</label>
                                          <select className="w-48 h-11 px-4 text-sm font-medium rounded-xl border-2 border-primary/20 bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" value={editDiagStatus} onChange={e => setEditDiagStatus(e.target.value)}>
                                             <option value="Active">Active</option>
                                             <option value="Resolved">Resolved</option>
                                          </select>
                                       </div>
                                       <div>
                                          <label className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-2 block">Clinical Notes</label>
                                          <textarea className="w-full p-4 text-sm rounded-xl border-2 border-primary/20 bg-background min-h-[140px] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-y leading-relaxed" value={editDiagNotes} onChange={e => setEditDiagNotes(e.target.value)} placeholder="Add clinical notes, observations, or treatment plan..." />
                                       </div>
                                       <div className="flex justify-end gap-3 pt-2 border-t border-primary/10">
                                          <Button variant="outline" className="px-6 font-bold border-2" onClick={() => setEditingDiagnosisId(null)}>Cancel</Button>
                                          <Button className="px-8 font-black bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md" onClick={() => editDiagMutation.mutate({ id: d.id, status: editDiagStatus, notes: editDiagNotes, icd_code: editDiagCode, icd_title: editDiagTitle })} disabled={editDiagMutation.isPending}>
                                             {editDiagMutation.isPending ? "Saving..." : "Save Changes"}
                                          </Button>
                                       </div>
                                    </div>
                                 )}
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="text-center py-6 text-sm text-muted-foreground font-medium">No diagnoses recorded yet.</div>
                  )}
                                </div>
                             )}

                             {history.length > 0 && (
                               <div className="space-y-4 relative">
                                  <div className="absolute left-[-1.5rem] top-0 bottom-0 w-px bg-primary/10 no-print" />
                                  {history.map((record) => (
                                    <div key={record.id} className="relative bg-card border border-border/50 p-6 rounded-2xl shadow-sm group/item hover:border-primary/30 hover:shadow-md transition-all print:border-slate-200 print:shadow-none">
                                       <div className="absolute left-[-1.85rem] top-8 w-3 h-3 rounded-full bg-primary/20 border-2 border-card no-print" />
                                       <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center gap-2 text-[10px] font-black text-primary/60 tracking-widest uppercase italic">
                                             <CalendarDays className="w-3.5 h-3.5 opacity-50" /> {record.date}
                                          </div>
                                          <button onClick={() => setRecordToDelete(record.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive/30 opacity-0 group-hover/item:opacity-100 transition-all no-print"><Trash2 className="w-4 h-4" /></button>
                                       </div>
                                       <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap font-medium">{record.content}</p>
                                    </div>
                                  ))}
                               </div>
                             )}
                          </div>
                        )}
                     </div>
                   );
                 })}
              </div>
            </div>
            
            {/* Old position of Doctor Diagnosis */}
         </div>

         <div className="lg:col-span-4 flex flex-col gap-8 no-print">
              <div className="bg-card border border-border/60 rounded-2xl overflow-hidden flex flex-col shadow-lg shadow-primary/5">
                 <div className="px-5 py-4 border-b border-border/60 bg-muted/30">
                    <h4 className="text-sm font-black uppercase text-primary tracking-widest">{tx("vitalsMonitoring", lang)}</h4>
                 </div>
                 <div className="max-h-[350px] overflow-auto custom-scrollbar">
                    <table className="w-full text-sm">
                       <thead className="bg-muted/10 sticky top-0 border-b border-border/40 z-10 backdrop-blur-md">
                          <tr className="text-muted-foreground uppercase text-xs font-black tracking-tighter">
                             <th className="px-5 py-4 text-left">{tx("timestamp", lang)}</th>
                             <th className="px-5 py-4 text-left">{tx("bpUnit", lang)}</th>
                             <th className="px-5 py-4 text-left">{tx("hrUnit", lang)}</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-border/30">
                          {vitalsHistory.map((v, i) => (
                            <tr key={i} className="hover:bg-primary/5 transition-colors group">
                               <td className="px-5 py-4 font-black text-primary/80">{v.time}</td>
                               <td className="px-5 py-4 font-bold text-foreground/70">{v.bp}</td>
                               <td className="px-5 py-4 font-black text-primary group-hover:scale-110 transition-transform">{v.hr}</td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>

              {/* AI Diagnostic Assistant Callout */}
              <div className="bg-gradient-to-br from-primary/5 via-card to-amber-500/[0.02] border border-border/60 rounded-2xl overflow-hidden shadow-lg shadow-primary/5 p-6 space-y-4">
                 <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                    <h4 className="text-sm font-black uppercase text-primary tracking-widest">
                       {tx("aiDiagnosticAssistant", lang)}
                    </h4>
                 </div>
                 <p className="text-sm text-foreground/70 leading-relaxed font-medium">
                    {lang === "ar"
                      ? "استخدم المساعد السريري المتقدم للحصول على مقترحات الرموز الطبية ICD-10 وتحليل السجلات الطبية للمريض."
                      : "Access advanced clinical decision support to generate diagnosis suggestions, review reasoning traces, and verify ICD-10 medical codes."}
                 </p>
                 <Button
                   className="w-full h-12 text-sm font-black uppercase tracking-widest bg-gradient-to-r from-amber-600 to-primary hover:from-amber-700 hover:to-primary/95 text-white rounded-xl shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2"
                   onClick={() => setAiConsentOpen(true)}
                 >
                   <Sparkles className="w-4 h-4 text-amber-300" />
                   {lang === "ar" ? "افتح مساعد التشخيص الذكي" : "Open AI Diagnostic Assistant"}
                 </Button>
              </div>
           </div>
        </div>
      </div>

      <AlertDialog open={recordToDelete !== null} onOpenChange={(open) => !open && setRecordToDelete(null)}>
        <AlertDialogContent className="bg-white border-primary/20 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary flex items-center gap-3 font-black uppercase tracking-tight"><Trash2 className="w-5 h-5 text-destructive" /> {tx("confirmDelete", lang)}</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/70 font-medium">{tx("deleteRecordConfirm", lang)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="rounded-full px-6">{tx("cancel", lang)}</AlertDialogCancel>
            <AlertDialogAction onClick={() => recordToDelete && deleteMutation.mutate(recordToDelete)} className="bg-destructive hover:bg-destructive/90 text-white font-bold rounded-full px-8">{tx("delete", lang)}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={draftToClear !== null} onOpenChange={(open) => !open && setDraftToClear(null)}>
        <AlertDialogContent className="bg-white border-primary/20 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary flex items-center gap-3 font-black uppercase tracking-tight"><Undo2 className="w-5 h-5" /> {tx("clearAllDrafts", lang)}</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/70 font-medium">{tx("clearDraftsConfirm", lang)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
             <AlertDialogCancel className="rounded-full px-6">{tx("keepTyping", lang)}</AlertDialogCancel>
             <AlertDialogAction onClick={() => { if (draftToClear) handleUpdateDraft(draftToClear, ""); setDraftToClear(null); }} className="bg-primary hover:bg-primary/90 text-white font-bold rounded-full px-8">{tx("clearNow", lang)}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog 
        open={aiConsentOpen} 
        onOpenChange={(open) => {
          setAiConsentOpen(open);
          if (!open) {
            setAiConsentDisclaimerChecked(false);
            setAiConsentPatientChecked(false);
          }
        }}
      >
        <AlertDialogContent className="bg-white border-primary/20 rounded-3xl max-w-2xl p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary flex items-center gap-3 text-xl font-black uppercase tracking-tight">
              <Sparkles className="w-7 h-7 text-amber-500" /> AI Diagnostic Assistant Terms & Consent
            </AlertDialogTitle>
            <AlertDialogDescription className="flex flex-col gap-5 mt-6 text-left">
              <div className="p-5 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-start gap-4">
                <Checkbox
                  id="disclaimer-check"
                  checked={aiConsentDisclaimerChecked}
                  onCheckedChange={(c) => setAiConsentDisclaimerChecked(c === true)}
                  className="mt-1 w-5 h-5 shrink-0"
                />
                <div className="text-base text-amber-800">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    <strong className="text-base">Medical Disclaimer</strong>
                  </div>
                  <p className="leading-relaxed">
                    I acknowledge that AI systems can make mistakes. This tool is for diagnostic assistance only, and further clinical investigation by a licensed physician is always necessary. <strong>I will not use this tool for medical emergencies.</strong>
                  </p>
                </div>
              </div>

              <div className="p-5 bg-blue-50 border-2 border-blue-200 rounded-2xl flex items-start gap-4">
                <Checkbox
                  id="patient-consent-check"
                  checked={aiConsentPatientChecked}
                  onCheckedChange={(c) => setAiConsentPatientChecked(c === true)}
                  className="mt-1 w-5 h-5 shrink-0"
                />
                <div className="text-base text-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <UserRound className="w-5 h-5" />
                    <strong className="text-base">Patient Consent Required</strong>
                  </div>
                  <p className="leading-relaxed">
                    I legally confirm that the patient has been informed and has provided explicit consent for their medical records to be analyzed by the AI Diagnostic Assistant.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="rounded-full px-8 h-12 text-base text-muted-foreground font-bold border-border/50">Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!aiConsentDisclaimerChecked || !aiConsentPatientChecked}
              onClick={() => { setAiConsentOpen(false); navigate(`/patients/emr/${patientId}/diagnosis`); }}
              className="bg-primary hover:bg-primary/90 text-white font-bold rounded-full px-10 h-12 text-base gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" /> Accept & Proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={diagnosisToDelete !== null} onOpenChange={(open) => !open && setDiagnosisToDelete(null)}>
        <AlertDialogContent className="bg-white border-primary/20 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary flex items-center gap-3 font-black uppercase tracking-tight"><Trash2 className="w-5 h-5 text-destructive" /> Delete Diagnosis</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/70 font-medium">Are you sure you want to delete this diagnosis? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="rounded-full px-6">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => diagnosisToDelete && deleteDiagMutation.mutate(diagnosisToDelete)} className="bg-destructive hover:bg-destructive/90 text-white font-bold rounded-full px-8">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manual Diagnosis Modal */}
      {isAddDiagnosisModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-card w-full max-w-4xl rounded-3xl shadow-2xl border border-border/60 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-border/60 bg-muted/30 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-3">
                <Stethoscope className="w-5 h-5" /> {tx("manualDiagnosis", lang) || "Manual Diagnosis"}
              </h3>
              <button onClick={() => setIsAddDiagnosisModalOpen(false)} className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8">
                <div className="flex gap-4 mb-6 relative">
                   <div className="w-full relative">
                      <label className="text-xs uppercase font-black tracking-widest text-muted-foreground/80 mb-2 block">Search ICD-10 Code</label>
                      {!newDiagCode && (
                        <>
                          <div className="relative shadow-sm rounded-xl overflow-hidden">
                             <input 
                               type="text" 
                               className="w-full h-14 rounded-xl border border-border bg-background px-5 text-base font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                               placeholder="Search diagnosis e.g. hypertension..." 
                               value={icdSearchTerm} 
                               onChange={e => {
                                 setIcdSearchTerm(e.target.value);
                                 setShowIcdDropdown(true);
                               }}
                               onFocus={() => setShowIcdDropdown(true)}
                             />
                             {isSearchingIcd && <Loader2 className="absolute right-5 top-4 w-6 h-6 animate-spin text-primary" />}
                          </div>
                          {showIcdDropdown && icdSearchTerm.length >= 2 && (
                            <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                              {icdSearchResults.length > 0 ? (
                                <table className="w-full text-left text-sm bg-background">
                                  <thead className="bg-background sticky top-0 z-10 border-b border-border text-xs uppercase tracking-wider text-muted-foreground shadow-sm">
                                    <tr>
                                      <th className="px-5 py-4 font-black w-32">Code</th>
                                      <th className="px-5 py-4 font-black w-1/3">Name</th>
                                      <th className="px-5 py-4 font-black">Description</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/30">
                                    {icdSearchResults.map((res, i) => (
                                      <tr key={i} className="hover:bg-primary/5 cursor-pointer transition-colors" onClick={() => {
                                        setNewDiagCode(res.code);
                                        setNewDiagTitle(res.title);
                                        setIcdSearchTerm(`${res.code} - ${res.title}`);
                                        setShowIcdDropdown(false);
                                      }}>
                                        <td className="px-5 py-4 font-black text-primary border-r border-border/20">{res.code}</td>
                                        <td className="px-5 py-4 font-bold text-foreground border-r border-border/20">{res.title}</td>
                                        <td className="px-5 py-4 text-muted-foreground">{res.description || res.title}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                !isSearchingIcd && <div className="px-5 py-4 text-sm font-medium text-muted-foreground bg-background">No results found.</div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                   </div>
                </div>
                
                {newDiagCode && newDiagTitle && (
                   <div className="flex gap-4 mb-8 p-4 bg-primary/5 rounded-xl border border-primary/20 items-center shadow-sm">
                      <div className="bg-white text-primary px-4 py-2 rounded-lg text-sm font-black uppercase tracking-wider shadow-sm border border-primary/10">{newDiagCode}</div>
                      <div className="text-base font-bold text-foreground flex-1">{newDiagTitle}</div>
                      <button onClick={() => { setNewDiagCode(""); setNewDiagTitle(""); setIcdSearchTerm(""); }} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><X className="w-5 h-5"/></button>
                   </div>
                )}

                <div className="mb-8">
                   <label className="text-xs uppercase font-black tracking-widest text-muted-foreground/80 mb-2 block">Clinical Notes</label>
                   <textarea className="w-full p-5 text-base font-medium rounded-xl border border-border bg-background min-h-[140px] outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm" placeholder="Type clinical notes here..." value={newDiagNotes} onChange={e => setNewDiagNotes(e.target.value)} />
                </div>

               <div className="flex justify-end gap-4 pt-4 border-t border-border/50">
                  <Button size="lg" variant="ghost" className="font-bold px-8 text-muted-foreground" onClick={() => setIsAddDiagnosisModalOpen(false)}>Cancel</Button>
                  <Button size="lg" className="font-black px-10 text-white shadow-lg shadow-primary/20" onClick={() => addDiagnosisMutation.mutate({ icd_code: newDiagCode, icd_title: newDiagTitle, notes: newDiagNotes, is_ai_generated: false, status: "Active" })} disabled={!newDiagCode || !newDiagTitle || addDiagnosisMutation.isPending}>
                     {addDiagnosisMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                     Save Diagnosis
                  </Button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Notes Modal */}
      {viewingDiagnosisNotes !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-card w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-700 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-slate-500" /> Clinical Notes: {viewingDiagnosisNotes.title}
              </h3>
              <button onClick={() => setViewingDiagnosisNotes(null)} className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-background">
              <div className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-foreground/80 space-y-6">
                {viewingDiagnosisNotes.notes}
              </div>
            </div>
            <div className="flex justify-end gap-4 p-6 border-t border-border/50 bg-muted/20">
               <Button size="lg" className="font-black px-10 text-white bg-slate-600 hover:bg-slate-700 shadow-lg shadow-slate-600/20" onClick={() => setViewingDiagnosisNotes(null)}>
                  Close
               </Button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>

  );
}
