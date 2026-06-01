import { useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

// ─── Types for parsed AI report ───────────────────────────────────────────────

interface ParsedScoreItem {
  label: string;
  score: number;
  note: string;
}

interface ParsedSuggestion {
  index: number;
  code: string;
  title: string;
  confidenceRaw: string; // e.g. "85% — HIGH"
  confidencePct: number;
  confidenceLevel: "HIGH" | "MODERATE" | "LOW";
  rationale: string;
  scores: ParsedScoreItem[];
  sources: string[];
  physicianReview: string;
}

interface ParsedClinicalReport {
  urgentMessage: string | null;
  dataQualityFlags: string;
  suggestions: ParsedSuggestion[];
  differentialConsiderations: string;
  reasoningTrace: string;
  disclaimer: string;
}

// ─── parseClinicalReport ──────────────────────────────────────────────────────

function parseClinicalReport(report: string): ParsedClinicalReport {
  const lines = report.split("\n");

  let urgentMessage: string | null = null;
  let dataQualityFlags = "";
  const suggestions: ParsedSuggestion[] = [];
  let differentialConsiderations = "";
  let reasoningTrace = "";
  let disclaimer = "";

  // Detect urgent message at the top
  const urgentLineIdx = lines.findIndex((l) =>
    /🚨\s*URGENT/i.test(l) || /\*\*🚨/.test(l)
  );
  if (urgentLineIdx !== -1) {
    urgentMessage = lines[urgentLineIdx]
      .replace(/\*\*/g, "")
      .replace(/^#+\s*/, "")
      .trim();
  }

  // Helper: extract a block of text from one heading to the next
  const extractSection = (startPattern: RegExp, endPatterns: RegExp[]): string => {
    const startIdx = lines.findIndex((l) => startPattern.test(l));
    if (startIdx === -1) return "";
    const endIdx = lines.findIndex(
      (l, i) => i > startIdx && endPatterns.some((p) => p.test(l))
    );
    const slice = endIdx === -1 ? lines.slice(startIdx + 1) : lines.slice(startIdx + 1, endIdx);
    return slice.join("\n").trim();
  };

  const headings = [
    /^###\s+.*DATA QUALITY FLAGS/i,
    /^###\s+.*SUGGESTED ICD/i,
    /^###\s+.*DIFFERENTIAL/i,
    /^###\s+.*REASONING TRACE/i,
    /^###\s+.*DISCLAIMER/i,
  ];

  dataQualityFlags = extractSection(headings[0], headings.slice(1));
  differentialConsiderations = extractSection(headings[2], headings.slice(3));
  reasoningTrace = extractSection(headings[3], headings.slice(4));
  disclaimer = extractSection(headings[4], []);

  // Parse suggestions block
  const suggestionsBlockStart = lines.findIndex((l) => headings[1].test(l));
  const suggestionsBlockEnd = lines.findIndex(
    (l, i) => i > suggestionsBlockStart && headings[2].test(l)
  );
  const suggestionLines =
    suggestionsBlockStart === -1
      ? []
      : suggestionsBlockEnd === -1
      ? lines.slice(suggestionsBlockStart + 1)
      : lines.slice(suggestionsBlockStart + 1, suggestionsBlockEnd);

  // Split into per-suggestion chunks by the "**Suggestion N:" pattern
  const suggChunks: string[][] = [];
  let currentChunk: string[] = [];
  for (const line of suggestionLines) {
    if (/^\*\*Suggestion\s+\d+:/i.test(line)) {
      if (currentChunk.length > 0) suggChunks.push(currentChunk);
      currentChunk = [line];
    } else {
      currentChunk.push(line);
    }
  }
  if (currentChunk.length > 0) suggChunks.push(currentChunk);

  for (let ci = 0; ci < suggChunks.length; ci++) {
    const chunk = suggChunks[ci];
    const headerLine = chunk[0] || "";

    // Parse code and title from "**Suggestion N: CODE — Title**"
    const headerMatch = headerLine.match(
      /\*\*Suggestion\s+(\d+):\s*([A-Z][A-Z0-9.]+)\s*[—–-]+\s*(.+?)\*\*/i
    );
    const index = headerMatch ? parseInt(headerMatch[1]) : ci + 1;
    const code = headerMatch ? headerMatch[2].trim() : "";
    const title = headerMatch ? headerMatch[3].trim() : "";

    // Parse confidence line
    let confidenceRaw = "";
    let confidencePct = 0;
    let confidenceLevel: "HIGH" | "MODERATE" | "LOW" = "LOW";
    for (const line of chunk) {
      const confMatch = line.match(/Confidence score:\s*(\d+)%\s*[—–-]+\s*(HIGH|MODERATE|LOW)/i);
      if (confMatch) {
        confidencePct = parseInt(confMatch[1]);
        confidenceLevel = confMatch[2].toUpperCase() as "HIGH" | "MODERATE" | "LOW";
        confidenceRaw = `${confidencePct}% — ${confidenceLevel}`;
        break;
      }
    }

    // Parse score breakdown lines
    const scores: ParsedScoreItem[] = [];
    const scorePattern = /^[-•*]\s+(.+?):\s*(\d+)\/100\s*[—–-]+\s*(.+)$/;
    for (const line of chunk) {
      const m = line.match(scorePattern);
      if (m) {
        scores.push({ label: m[1].trim(), score: parseInt(m[2]), note: m[3].trim() });
      }
    }

    // Parse rationale (after "**Clinical rationale**:" until next ** section)
    let rationale = "";
    const rationaleStart = chunk.findIndex((l) => /\*\*Clinical rationale\*\*/i.test(l));
    if (rationaleStart !== -1) {
      const rationaleEnd = chunk.findIndex(
        (l, i) => i > rationaleStart && /^\*\*/.test(l)
      );
      const rationaleLines =
        rationaleEnd === -1
          ? chunk.slice(rationaleStart + 1)
          : chunk.slice(rationaleStart + 1, rationaleEnd);
      rationale = rationaleLines
        .join(" ")
        .replace(/^\s*[-•]\s*/, "")
        .trim();
    }

    // Parse verified sources
    const sources: string[] = [];
    const sourcesStart = chunk.findIndex((l) => /\*\*Verified sources\*\*/i.test(l));
    if (sourcesStart !== -1) {
      const sourcesEnd = chunk.findIndex(
        (l, i) => i > sourcesStart && /^\*\*/.test(l)
      );
      const sourceLines =
        sourcesEnd === -1
          ? chunk.slice(sourcesStart + 1)
          : chunk.slice(sourcesStart + 1, sourcesEnd);
      for (const sl of sourceLines) {
        const sm = sl.match(/^\d+\.\s*(.+)/);
        if (sm) sources.push(sm[1].trim());
      }
    }

    // Parse physician review
    let physicianReview = "";
    const phyStart = chunk.findIndex((l) => /\*\*Physician review required/i.test(l));
    if (phyStart !== -1) {
      const phyEnd = chunk.findIndex(
        (l, i) => i > phyStart && /^\*\*/.test(l)
      );
      const phyLines =
        phyEnd === -1
          ? chunk.slice(phyStart + 1)
          : chunk.slice(phyStart + 1, phyEnd);
      physicianReview = phyLines
        .join(" ")
        .replace(/^\s*[-•]\s*/, "")
        .trim();
    }

    if (code) {
      suggestions.push({
        index,
        code,
        title,
        confidenceRaw,
        confidencePct,
        confidenceLevel,
        rationale,
        scores,
        sources,
        physicianReview,
      });
    }
  }

  return {
    urgentMessage,
    dataQualityFlags,
    suggestions,
    differentialConsiderations,
    reasoningTrace,
    disclaimer,
  };
}

// ─── ClinicalReportView ────────────────────────────────────────────────────────

function ClinicalReportView({
  report,
  onApply,
  lang,
}: {
  report: ParsedClinicalReport;
  onApply: (code: string, title: string) => void;
  lang: "en" | "ar";
}) {
  const [reasoningOpen, setReasoningOpen] = useState(false);

  const confidenceColor = (level: "HIGH" | "MODERATE" | "LOW") => {
    if (level === "HIGH") return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800";
    if (level === "MODERATE") return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800";
    return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800";
  };

  const scoreBarColor = (score: number) => {
    if (score >= 75) return "bg-emerald-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Urgent Warning */}
      {report.urgentMessage && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm font-bold text-red-700 dark:text-red-400 leading-relaxed">
            {report.urgentMessage}
          </p>
        </div>
      )}

      {/* Data Quality Flags */}
      {report.dataQualityFlags && (
        <div className={cn(
          "rounded-2xl p-5 border",
          report.dataQualityFlags.toLowerCase().includes("none")
            ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
            : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
        )}>
          <p className={cn(
            "text-[10px] font-black uppercase tracking-widest mb-2",
            report.dataQualityFlags.toLowerCase().includes("none")
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-amber-700 dark:text-amber-400"
          )}>
            Data Quality Flags
          </p>
          <p className={cn(
            "text-xs font-medium",
            report.dataQualityFlags.toLowerCase().includes("none")
              ? "text-emerald-800 dark:text-emerald-300"
              : "text-amber-800 dark:text-amber-300"
          )}>
            {report.dataQualityFlags}
          </p>
        </div>
      )}

      {/* Suggestions */}
      {report.suggestions.map((s) => (
        <div
          key={s.code}
          className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 font-black text-sm bg-primary/10 text-primary border border-primary/20 rounded-lg">
                {s.code}
              </span>
              <span className="text-sm font-bold text-foreground">{s.title}</span>
            </div>
            <span className={cn(
              "px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border shrink-0",
              confidenceColor(s.confidenceLevel)
            )}>
              {s.confidencePct}% {s.confidenceLevel}
            </span>
          </div>

          {/* Rationale */}
          {s.rationale && (
            <p className="text-xs text-foreground/70 leading-relaxed mb-4 font-medium">
              {s.rationale}
            </p>
          )}

          {/* Score bars */}
          {s.scores.length > 0 && (
            <div className="space-y-2.5 mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                Score Breakdown
              </p>
              {s.scores.map((sc) => (
                <div key={sc.label} className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-foreground/70">{sc.label}</span>
                    <span className="text-primary">{sc.score}/100</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", scoreBarColor(sc.score))}
                      style={{ width: `${sc.score}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{sc.note}</p>
                </div>
              ))}
            </div>
          )}

          {/* Sources */}
          {s.sources.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                Verified Sources
              </p>
              {s.sources.map((src, i) => (
                <p key={i} className="text-[11px] text-foreground/60 font-medium leading-relaxed">
                  {i + 1}. {src}
                </p>
              ))}
            </div>
          )}

          {/* Physician review */}
          {s.physicianReview && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-1">
                Physician Review Required
              </p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                {s.physicianReview}
              </p>
            </div>
          )}

          {/* Apply button */}
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-2 border-primary/20 text-primary hover:bg-primary/5 font-bold text-xs h-9 rounded-xl"
            onClick={() => onApply(s.code, s.title)}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            {tx("applyToPlan", lang)}
          </Button>
        </div>
      ))}

      {/* Differential Considerations */}
      {report.differentialConsiderations && (
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">
            Differential Considerations
          </p>
          <p className="text-xs text-foreground/70 leading-relaxed font-medium whitespace-pre-wrap">
            {report.differentialConsiderations}
          </p>
        </div>
      )}

      {/* Reasoning Trace — collapsible */}
      {report.reasoningTrace && (
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
          <button
            onClick={() => setReasoningOpen((o) => !o)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/20 transition-colors"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Reasoning Trace
            </p>
            {reasoningOpen ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          {reasoningOpen && (
            <div className="px-5 pb-5 border-t border-border/40">
              <p className="text-xs text-foreground/60 leading-relaxed font-medium whitespace-pre-wrap mt-3">
                {report.reasoningTrace}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      {report.disclaimer && (
        <div className="bg-muted/30 border border-border/40 rounded-xl p-4">
          <p className="text-[10px] text-muted-foreground leading-relaxed italic">
            {report.disclaimer.replace(/^>\s*/, "")}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── DiagnosisResponse type (matching backend) ─────────────────────────────────

interface DiagnosisSuggestion {
  icd_code: string;
  icd_title: string;
  accuracy: number;
  reasoning: string;
  accuracy_explanation: string;
  medical_source?: string | null;
}

interface DiagnosisResponse {
  suggestions: DiagnosisSuggestion[];
  compiled_details?: string | null;
  analysis_report?: string | null;
}

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
    data.sections.forEach(s => {
      const key = s.key;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [data]);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["Chief Complaints"]));
  const [editingId, setEditingId] = useState<string | null>("Chief Complaints");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [orderFilter, setOrderFilter] = useState<"Lab" | "Imaging" | "Prescription">("Lab");
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null);
  const [draftToClear, setDraftToClear] = useState<string | null>(null);

  // AI Diagnosis state
  const [diagnosisDetails, setDiagnosisDetails] = useState("");
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResponse | null>(null);
  const [parsedReport, setParsedReport] = useState<ParsedClinicalReport | null>(null);

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

  const diagnosisMutation = useMutation({
    mutationFn: (details: string) =>
      apiFetch<DiagnosisResponse>(`/patients/${patientId}/ai-diagnosis`, {
        method: "POST",
        body: JSON.stringify({ details: details || null }),
      }),
    onSuccess: (result) => {
      setDiagnosisResult(result);
      if (result.analysis_report) {
        setParsedReport(parseClinicalReport(result.analysis_report));
      }
      toast.success(tx("suggestionsTitle", lang));
    },
    onError: () => toast.error(tx("failedSaveEntry", lang)),
  });

  const handleApplyToPlan = (code: string, title: string) => {
    const planDraft = drafts["Plan of Care"] || "";
    const entry = `${code} — ${title}`;
    const newDraft = planDraft ? `${planDraft}\n• ${entry}` : `• ${entry}`;
    setDrafts(prev => ({ ...prev, "Plan of Care": newDraft }));
    setExpandedSections(prev => new Set([...prev, "Plan of Care"]));
    setEditingId("Plan of Care");
    toast.success(tx("suggestionApplied", lang));
  };

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
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center p-20 space-y-6 text-center bg-card/50 border-2 border-dashed border-border rounded-xl mt-10">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <UserRound className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-primary uppercase tracking-tight">{tx("noPatientSelected", lang)}</h2>
            <p className="text-muted-foreground max-w-sm mx-auto font-medium">
              {tx("emrAccessDesc", lang)}
            </p>
          </div>
          <Button onClick={() => navigate("/patients")} className="bg-primary hover:bg-primary/90 text-white font-bold h-11 px-8">
             {tx("browsePatientRecords", lang)}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) return <DashboardLayout><div className="p-10 text-center text-destructive">{tx("error", lang)}</div></DashboardLayout>;

  const patient = data.patient;
  const vitalsHistory = data.vitals_history || data.vitalsHistory || [];
  const latestVitals = vitalsHistory[0] || null;

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
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                 {[
                   { label: tx("heightUnit", lang), value: latestVitals?.height || "—", icon: MoveHorizontal },
                   { label: tx("weightUnit", lang), value: latestVitals?.weight || "—", icon: MoveHorizontal },
                   { label: tx("bmiUnit", lang), value: latestVitals?.bmi || "—", color: "text-destructive", icon: Activity },
                   { label: tx("bpUnit", lang), value: patient.vitals.bp, icon: Activity },
                   { label: tx("hrUnit", lang), value: patient.vitals.hr, icon: Heart },
                   { label: tx("spo2Unit", lang), value: patient.vitals.spo2, icon: Activity },
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
           <div className="lg:col-span-8 flex flex-col bg-card border border-border/60 rounded-2xl overflow-hidden shadow-lg shadow-primary/5">
              <div className="px-6 py-4 border-b border-border/60 bg-muted/30 flex items-center justify-between">
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-3">
                    <History className="w-4 h-4" /> {tx("clinicalHistory", lang)}
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
                           <div className={cn("p-1 rounded-md transition-colors", isOpen ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                              {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                           </div>
                           <span className={cn("text-xs font-black uppercase tracking-wider transition-colors", isOpen ? "text-primary" : "text-muted-foreground group-hover/section:text-foreground")}>{txEmrSection(title, lang)}</span>
                           <div className="ml-auto flex items-center gap-3">
                              {history.length > 0 && <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">{history.length} {tx("records", lang)}</span>}
                              <Pencil className={cn("w-4 h-4 text-primary transition-all", isEditing ? "opacity-100 scale-110" : "opacity-0 group-hover/section:opacity-100")} />
                           </div>
                        </button>
                        
                        <div className="hidden print:block px-8 py-3 bg-muted/20 border-b border-border font-black text-[10px] uppercase text-primary mt-6 tracking-widest">{txEmrSection(title, lang)}</div>

                        {(isOpen || true) && (
                          <div className={cn("px-16 pb-8 pt-4 bg-background/20 space-y-8", !isOpen && "print:block hidden")}>
                             {isOpen && (
                               <div className="space-y-4 bg-card border border-primary/10 rounded-2xl p-6 shadow-xl no-print ring-1 ring-primary/5">
                                  <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-4">
                                     <p className="text-[10px] font-black uppercase text-primary flex items-center gap-2">
                                        <Plus className="w-3 h-3" /> {tx("newLogEntry", lang)}
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

           <div className="lg:col-span-4 flex flex-col gap-8 no-print">
              <div className="bg-card border border-border/60 rounded-2xl overflow-hidden flex flex-col shadow-lg shadow-primary/5">
                 <div className="px-5 py-4 border-b border-border/60 bg-muted/30">
                    <h4 className="text-[10px] font-black uppercase text-primary tracking-widest">{tx("vitalsMonitoring", lang)}</h4>
                 </div>
                 <div className="max-h-[350px] overflow-auto custom-scrollbar">
                    <table className="w-full text-xs">
                       <thead className="bg-muted/10 sticky top-0 border-b border-border/40 z-10 backdrop-blur-md">
                          <tr className="text-muted-foreground uppercase text-[10px] font-black tracking-tighter">
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

              <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-lg shadow-primary/5 p-6 space-y-5">
                 <div className="flex gap-2 p-1.5 bg-muted/40 rounded-xl border border-border/40">
                    {(["Lab", "Imaging", "Prescription"] as const).map((tab) => (
                      <button key={tab} onClick={() => setOrderFilter(tab)} className={cn("flex-1 py-3 text-[10px] font-black uppercase rounded-lg shadow-sm transition-all", orderFilter === tab ? "bg-primary text-white scale-[1.02]" : "text-muted-foreground bg-card hover:bg-muted/50")}>
                        {tab === "Lab" ? tx("lab", lang) : tab === "Imaging" ? tx("imaging", lang) : tx("prescription", lang)}
                      </button>
                    ))}
                 </div>
                 <div className="border border-border/40 rounded-xl overflow-hidden bg-background/30 ring-1 ring-border/5">
                    <table className="w-full text-[10px] border-collapse">
                       <tbody className="divide-y divide-border/20">
                          {data.orders.filter(o => o.type.includes(orderFilter) || orderFilter === "Lab").map((o) => (
                            <tr key={o.id} className="hover:bg-primary/5 transition-colors">
                               <td className="p-4 font-bold text-foreground/80 truncate max-w-[120px]">{o.description}</td>
                               <td className="p-4 font-black text-primary text-right uppercase tracking-tighter">{txStatus(o.status, lang)}</td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>

              {/* AI Diagnostic Assistant */}
              <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-lg shadow-primary/5">
                 <div className="px-5 py-4 border-b border-border/60 bg-gradient-to-r from-primary/5 to-transparent">
                    <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                       <Sparkles className="w-4 h-4" /> {tx("aiDiagnosticAssistant", lang)}
                    </h4>
                 </div>
                 <div className="p-5 space-y-4">
                    <div>
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                          {tx("initialDiagnosisPrompt", lang)}
                       </label>
                       <textarea
                         value={diagnosisDetails}
                         onChange={(e) => setDiagnosisDetails(e.target.value)}
                         rows={4}
                         className="w-full text-xs p-3 bg-background/50 border border-border/50 rounded-xl outline-none focus:ring-2 ring-primary/10 text-foreground transition-all resize-none placeholder:italic placeholder:text-muted-foreground/50"
                         placeholder={tx("initialDiagnosisPlaceholder", lang)}
                       />
                       <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">
                         Leave blank to auto-compile from EMR records.
                       </p>
                    </div>
                    <Button
                      className="w-full h-10 text-xs font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20"
                      onClick={() => diagnosisMutation.mutate(diagnosisDetails)}
                      disabled={diagnosisMutation.isPending}
                    >
                      {diagnosisMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          {tx("generatingSuggestions", lang)}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          {tx("generateSuggestions", lang)}
                        </>
                      )}
                    </Button>

                    {parsedReport && (
                      <ClinicalReportView
                        report={parsedReport}
                        onApply={handleApplyToPlan}
                        lang={lang}
                      />
                    )}
                 </div>
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
    </DashboardLayout>
  );
}
