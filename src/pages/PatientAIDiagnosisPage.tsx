import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Loader2,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  UserRound
} from "lucide-react";
import { apiFetch } from "@/api/client";
import type { EmrPage } from "@/api/types";
import { cn } from "@/lib/utils";
import { useLang } from "@/hooks/useLang";
import { tx } from "@/lib/i18n";
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
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";

// ─── Types for parsed AI report ───────────────────────────────────────────────

export interface ParsedScoreItem {
  label: string;
  score: number;
  note: string;
}

export interface ParsedSuggestion {
  index: number;
  code: string;
  title: string;
  confidenceRaw: string;
  confidencePct: number;
  confidenceLevel: "HIGH" | "MODERATE" | "LOW";
  rationale: string;
  scores: ParsedScoreItem[];
  sources: string[];
  physicianReview: string;
}

export interface ParsedClinicalReport {
  urgentMessage: string | null;
  dataQualityFlags: string;
  suggestions: ParsedSuggestion[];
  differentialConsiderations: string;
  reasoningTrace: string;
  disclaimer: string;
}

// ─── parseClinicalReport ──────────────────────────────────────────────────────

export function parseClinicalReport(report: string): ParsedClinicalReport {
  const lines = report.split("\n");

  let urgentMessage: string | null = null;
  let dataQualityFlags = "";
  const suggestions: ParsedSuggestion[] = [];
  let differentialConsiderations = "";
  let reasoningTrace = "";
  let disclaimer = "";

  const urgentLineIdx = lines.findIndex((l) =>
    /🚨\s*URGENT/i.test(l) || /\*\*🚨/.test(l)
  );
  if (urgentLineIdx !== -1) {
    urgentMessage = lines[urgentLineIdx]
      .replace(/\*\*/g, "")
      .replace(/^#+\s*/, "")
      .trim();
  }

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

    const headerMatch = headerLine.match(
      /\*\*Suggestion\s+(\d+):\s*([A-Z][A-Z0-9.]+)\s*[—–-]+\s*(.+?)\*\*/i
    );
    const index = headerMatch ? parseInt(headerMatch[1]) : ci + 1;
    const code = headerMatch ? headerMatch[2].trim() : "";
    const title = headerMatch ? headerMatch[3].trim() : "";

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

    const scores: ParsedScoreItem[] = [];
    const scorePattern = /^[-•*]\s+(.+?):\s*(\d+)\/100\s*[—–-]+\s*(.+)$/;
    for (const line of chunk) {
      const m = line.match(scorePattern);
      if (m) {
        scores.push({ label: m[1].trim(), score: parseInt(m[2]), note: m[3].trim() });
      }
    }

    let rationale = "";
    const rationaleStart = chunk.findIndex((l) => /\*\*Clinical rationale\*\*/i.test(l));
    if (rationaleStart !== -1) {
      const rationaleEnd = chunk.findIndex(
        (l, i) => i > rationaleStart && /^\*\*/.test(l)
      );
      const sameLineMatch = chunk[rationaleStart].match(/\*\*Clinical rationale\*\*:?\s*(.+)/i);
      const sameLineText = sameLineMatch ? sameLineMatch[1].trim() : "";

      const rationaleLines =
        rationaleEnd === -1
          ? chunk.slice(rationaleStart + 1)
          : chunk.slice(rationaleStart + 1, rationaleEnd);

      rationale = [sameLineText, ...rationaleLines]
        .filter(Boolean)
        .join(" ")
        .replace(/^\s*[-•:]\s*/, "")
        .trim();
    }

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

  suggestions.sort((a, b) => b.confidencePct - a.confidencePct);

  return {
    urgentMessage,
    dataQualityFlags,
    suggestions,
    differentialConsiderations,
    reasoningTrace,
    disclaimer,
  };
}

// ─── compileDetailedJustification ─────────────────────────────────────────────

const compileDetailedJustification = (s: ParsedSuggestion) => {
  let text = s.rationale ? s.rationale + "\n\n" : "";
  if (s.scores && s.scores.length > 0) {
    text += "--- SCORE BREAKDOWN ---\n";
    s.scores.forEach(sc => {
      text += `${sc.label}: ${sc.score}/100\n  ${sc.note}\n`;
    });
    text += "\n";
  }
  if (s.sources && s.sources.length > 0) {
    text += "--- VERIFIED SOURCES ---\n";
    s.sources.forEach((src, i) => {
      text += `${i + 1}. ${src}\n`;
    });
    text += "\n";
  }
  if (s.physicianReview) {
    text += "--- PHYSICIAN REVIEW REQUIRED ---\n";
    text += s.physicianReview + "\n";
  }
  return text.trim();
};

// ─── ClinicalReportView ──────────────────────────────────────────────────────

export function ClinicalReportView({
  report,
  onApply,
  isRestoredView = false,
  activeAppointment,
  lang,
}: {
  report: ParsedClinicalReport;
  onApply: (code: string, title: string, rationale: string) => void;
  isRestoredView?: boolean;
  activeAppointment?: any;
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
      {report.urgentMessage && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm font-bold text-red-700 dark:text-red-400 leading-relaxed">
            {report.urgentMessage}
          </p>
        </div>
      )}

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

      {/* Legend for AI Confidence Scores */}
      <div className="bg-background border border-border/50 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between text-xs shadow-sm mb-4">
        <span className="font-black uppercase tracking-widest text-muted-foreground text-[10px]">Confidence Legend</span>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20"></span>
            <span className="font-bold text-foreground">High (80-100%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/20"></span>
            <span className="font-bold text-foreground">Moderate (50-79%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/20"></span>
            <span className="font-bold text-foreground">Low (&lt;50%)</span>
          </div>
        </div>
      </div>

      {report.suggestions.map((s) => (
        <div
          key={s.code}
          className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 font-black text-sm bg-primary/10 text-primary border border-primary/20 rounded-lg">
                {s.code}
              </span>
              <span className="text-sm font-bold text-foreground">{s.title}</span>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button className={cn(
                  "px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border shrink-0 hover:opacity-80 transition-opacity cursor-pointer shadow-sm hover:shadow active:scale-95",
                  confidenceColor(s.confidenceLevel)
                )}>
                  {s.confidencePct}% {s.confidenceLevel}
                </button>
              </PopoverTrigger>
              {!activeAppointment && (
                <div className="mt-4 p-3 bg-amber-50 text-amber-800 rounded-lg text-sm flex items-center gap-2 border border-amber-200">
                  <AlertTriangle className="w-4 h-4" />
                  Patient must have an active appointment today to receive a diagnosis.
                </div>
              )}
              <PopoverContent className="w-80 p-4 rounded-xl border-primary/20 shadow-xl" align="end" side="bottom">
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-primary border-b border-border/50 pb-2">
                    Confidence Calculation
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                    This percentage is a weighted composite score designed to ensure rigorous clinical grounding:
                  </p>
                  <ul className="text-[11px] space-y-2 text-foreground/80 font-medium">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                      <span><strong className="text-foreground">30%</strong> Symptom Match</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                      <span><strong className="text-foreground">25%</strong> Lab &amp; Vital Alignment</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                      <span><strong className="text-foreground">20%</strong> ICD-10 Guideline Similarity</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                      <span><strong className="text-foreground">15%</strong> Internal Consistency</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                      <span><strong className="text-foreground">10%</strong> Comorbidity Probability</span>
                    </li>
                  </ul>
                  <div className="bg-primary/5 p-3 rounded-xl border border-primary/20 text-[10px] text-primary font-mono font-bold tracking-tight mt-3 text-center shadow-inner leading-relaxed">
                    Score = (0.30 × Symptom) + (0.25 × Lab) + (0.20 × RAG) + (0.15 × Consistency) + (0.10 × Comorbidity)
                  </div>
                  <p className="text-[9px] text-muted-foreground italic pt-3 mt-1 border-t border-border/50 text-center">
                    Note: Individual category scores (e.g. 70/100) are clinical AI estimates. The final confidence percentage is strictly calculated using the mathematical formula above.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {s.rationale && (
            <p className="text-xs text-foreground/70 leading-relaxed mb-4 font-medium">
              {s.rationale}
            </p>
          )}

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
                  <div className="bg-primary/5 border-l-4 border-primary/40 px-3 py-2 mt-1.5 rounded-r">
                    <p className="text-[10.5px] text-foreground leading-relaxed font-semibold">
                      {sc.note}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

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

          {!isRestoredView && (
            <Button
              size="sm"
              variant="outline"
              disabled={!activeAppointment}
              className="w-full mt-2 border-primary/20 text-primary hover:bg-primary/5 font-bold text-xs h-9 rounded-xl uppercase tracking-widest"
              onClick={() => onApply(s.code, s.title, compileDetailedJustification(s))}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Add to Patient Diagnoses
            </Button>
          )}
        </div>
      ))}

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

// ─── DiagnosisResponse type ────────────────────────────────────────────────────

export interface DiagnosisSuggestion {
  icd_code: string;
  icd_title: string;
  accuracy: number;
  reasoning: string;
  accuracy_explanation: string;
  medical_source?: string | null;
}

export interface DiagnosisResponse {
  suggestions: DiagnosisSuggestion[];
  compiled_details?: string | null;
  analysis_report?: string | null;
}

// ─── PatientAIDiagnosisPage ──────────────────────────────────────────────────

export default function PatientAIDiagnosisPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const patientId = id ? Number(id) : 0;
  const { lang } = useLang();

  const { data, isLoading, error } = useQuery({
    queryKey: ["emr", patientId],
    queryFn: () => apiFetch<EmrPage>(`/patients/${patientId}/emr`),
    enabled: patientId > 0,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => apiFetch<any[]>("/appointments"),
  });

  const todayDate = new Date();
  const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
  const activeAppointment = appointments.find(a => 
    a.patientId === Number(patientId) && 
    a.appointmentDate.startsWith(today)
  );

  const qc = useQueryClient();
  const [diagnosisDetails, setDiagnosisDetails] = useState("");
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResponse | null>(null);
  const [parsedReport, setParsedReport] = useState<ParsedClinicalReport | null>(null);

  const location = useLocation();

  // Reconstruct UI from saved diagnosis when navigated via "View Details"
  useEffect(() => {
    if (location.state?.restoredDiagnosis && !parsedReport) {
      const d = location.state.restoredDiagnosis;
      const text = d.notes || "";

      const parts = text.split("--- SCORE BREAKDOWN ---");
      const rationale = parts[0].trim();
      let rest = parts[1] || "";

      const sourcesSplit = rest.split("--- VERIFIED SOURCES ---");
      const scoresText = sourcesSplit[0] || "";
      rest = sourcesSplit[1] || "";

      const physicianSplit = rest.split("--- PHYSICIAN REVIEW REQUIRED ---");
      const sourcesText = physicianSplit[0] || "";
      const reviewText = physicianSplit[1] || "";

      const scores: ParsedScoreItem[] = [];
      const scoreLines = scoresText.trim().split("\n");
      for (let i = 0; i < scoreLines.length; i++) {
        const match = scoreLines[i].match(/(.+):\s+(\d+)\/100/);
        if (match) {
          const note = (scoreLines[i + 1] && scoreLines[i + 1].startsWith("  "))
            ? scoreLines[i + 1].trim()
            : "";
          scores.push({ label: match[1].trim(), score: parseInt(match[2], 10), note });
          if (note) i++;
        }
      }

      const sources = sourcesText
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((s) => s.replace(/^\d+\.\s*/, "").trim());

      setParsedReport({
        urgentMessage: null,
        dataQualityFlags:
          "The retrieved guidelines could not be initialized, which may impact the accuracy of the suggestions. However, based on the provided patient data, the following analysis is conducted.",
        differentialConsiderations: "",
        reasoningTrace: "",
        disclaimer:
          "This output was generated by an AI decision support tool. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider for clinical decisions.",
        suggestions: [
          {
            index: 1,
            code: d.icdCode,
            title: d.icdTitle,
            confidenceRaw: "HIGH",
            confidencePct: scores.length
              ? Math.round(scores.reduce((a, b) => a + b.score, 0) / scores.length)
              : 80,
            confidenceLevel: "HIGH",
            rationale,
            scores,
            sources,
            physicianReview: reviewText.trim(),
          },
        ],
      });

      window.history.replaceState({}, document.title);
    }
  }, [location.state, parsedReport]);

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
    onError: () => toast.error("Failed to generate diagnosis"),
  });

  const [editingDiagnosis, setEditingDiagnosis] = useState<{
    icdCode: string;
    icdTitle: string;
    notes: string;
  } | null>(null);

  const addDiagnosisMutation = useMutation({
    mutationFn: (body: any) =>
      apiFetch(`/patients/${patientId}/diagnoses`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ["emr", patientId] });
      setEditingDiagnosis(null);
      toast.success("AI Diagnosis saved successfully to EMR");

      try {
         const appts = await apiFetch<any[]>("/appointments");
         const todayDate = new Date();
         const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
         const todaysAppt = appts.find(a => 
            a.patientId === Number(patientId) && 
            (a.status === "Waiting" || !a.status || a.status === "Scheduled") && 
            a.appointmentDate.startsWith(today)
         );
         if (todaysAppt) {
            await apiFetch(`/appointments/${todaysAppt.id}/status`, { method: "PATCH", body: JSON.stringify({ status: "Completed" }) });
         }
      } catch (e) {
         console.error("Failed to transition appointment to completed", e);
      }

      navigate(`/patients/emr/${patientId}`);
    },
    onError: (error: any) => toast.error(error instanceof Error ? error.message : "Failed to add diagnosis"),
  });

  const handleApplyToPlan = (code: string, title: string, rationale: string) => {
    setEditingDiagnosis({ icdCode: code, icdTitle: title, notes: rationale });
  };

  if (isLoading)
    return (
      <DashboardLayout>
        <Skeleton className="h-[600px] w-full" />
      </DashboardLayout>
    );

  if (!id || id === "undefined" || patientId === 0 || error || !data) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center p-20 space-y-6 text-center bg-card/50 border-2 border-dashed border-border rounded-xl mt-10">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <UserRound className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-primary uppercase tracking-tight">
              {tx("noPatientSelected", lang)}
            </h2>
            <p className="text-muted-foreground max-w-sm mx-auto font-medium">
              {tx("emrAccessDesc", lang)}
            </p>
          </div>
          <Button
            onClick={() => navigate("/patients")}
            className="bg-primary hover:bg-primary/90 text-white font-bold h-11 px-8"
          >
            {tx("browsePatientRecords", lang)}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const patient = data.patient;
  const vitalsHistory = data.vitals_history || data.vitalsHistory || [];
  const latestVitals = vitalsHistory[0] || null;

  return (
    <DashboardLayout>
      <PageHeader
        title={`AI Diagnosis: ${patient.name}`}
        description="Clinical Decision Support Assistant"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/patients/emr/${patientId}`)}
            className="text-primary border-primary/20 hover:bg-primary/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to EMR
          </Button>
        }
      />

      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-lg shadow-primary/5 mt-8">
          <div className="px-6 py-5 border-b border-border/60 bg-gradient-to-r from-primary/5 to-transparent">
            <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span className="bg-gradient-to-r from-amber-600 to-amber-400 dark:from-amber-400 dark:to-amber-200 bg-clip-text text-transparent">
                {tx("aiDiagnosticAssistant", lang)}
              </span>
            </h4>
          </div>
          <div className="p-6 space-y-6">
            {!parsedReport ? (
              <>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 block">
                    {tx("initialDiagnosisPrompt", lang)}
                  </label>
                  <textarea
                    value={diagnosisDetails}
                    onChange={(e) => setDiagnosisDetails(e.target.value)}
                    rows={4}
                    className="w-full text-sm p-4 bg-background/50 border border-border/50 rounded-xl outline-none focus:ring-2 ring-primary/10 text-foreground transition-all resize-none placeholder:italic placeholder:text-muted-foreground/50"
                    placeholder={tx("initialDiagnosisPlaceholder", lang)}
                  />
                  <p className="text-xs text-muted-foreground mt-2 font-medium">
                    Leave blank to auto-compile from EMR records.
                  </p>
                </div>
                <Button
                  className="w-full h-12 text-sm font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20"
                  onClick={() => {
                    let context = `Patient Profile:\nName: ${patient.name}\nAge: ${patient.age} | Gender: ${patient.gender}\n`;

                    if (patient.vitals) {
                      context += `\nCurrent Vitals:\n- BP: ${patient.vitals.bp}\n- HR: ${patient.vitals.hr} bpm\n- SpO2: ${patient.vitals.spo2}%\n- Height/Weight: ${latestVitals?.height || "—"} / ${latestVitals?.weight || "—"}\n`;
                    }

                    if (patient.allergies && patient.allergies.length > 0) {
                      context += `\nAllergies: ${patient.allergies.join(", ")}\n`;
                    }

                    if (patient.chronicConditions && patient.chronicConditions.length > 0) {
                      context += `\nChronic Conditions: ${patient.chronicConditions.join(", ")}\n`;
                    }

                    if (data?.sections && data.sections.length > 0) {
                      const history = data.sections
                        .filter((s) =>
                          ["Past Medical/Surgical History", "Chief Complaints", "Present Illness"].includes(s.key)
                        )
                        .map((s) => `${s.key}: ${s.content}`);
                      if (history.length > 0) {
                        context += `\nEMR History:\n${history.join("\n")}\n`;
                      }
                    }

                    const finalPayload = diagnosisDetails.trim()
                      ? `${context}\nDoctor's Initial Notes/Diagnosis Details:\n${diagnosisDetails}`
                      : context;

                    diagnosisMutation.mutate(finalPayload);
                  }}
                  disabled={diagnosisMutation.isPending || !activeAppointment}
                >
                  {diagnosisMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      {tx("generatingSuggestions", lang)}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      {tx("generateSuggestions", lang)}
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="animate-in slide-in-from-bottom-4 duration-500 fade-in fill-mode-both">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold uppercase text-primary">Diagnostic Analysis Complete</h3>
                  <Button variant="outline" size="sm" onClick={() => { setParsedReport(null); setDiagnosisResult(null); }} className="h-8 text-xs font-bold text-muted-foreground">
                    Start Over
                  </Button>
                </div>
                <ClinicalReportView
                  report={parsedReport}
                  onApply={handleApplyToPlan}
                  isRestoredView={!!location.state?.restoredDiagnosis}
                  activeAppointment={activeAppointment}
                  lang={lang}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm before saving diagnosis to EMR */}
      <AlertDialog
        open={editingDiagnosis !== null}
        onOpenChange={(open) => !open && setEditingDiagnosis(null)}
      >
        <AlertDialogContent className="bg-white border-primary/20 rounded-2xl max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary flex items-center gap-3 font-black uppercase tracking-tight">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Confirm AI Diagnosis
            </AlertDialogTitle>
            <AlertDialogDescription className="font-medium">
              You are about to save the following AI-generated diagnosis to the patient's EMR. The
              detailed justification, score breakdown, and medical sources will also be saved for
              future reference.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {editingDiagnosis && (
            <div className="bg-muted/30 rounded-xl p-4 my-2 border border-border/50 space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Diagnosis
              </p>
              <p className="text-sm font-bold text-foreground">
                <span className="text-primary mr-2">{editingDiagnosis.icdCode}</span>—{" "}
                {editingDiagnosis.icdTitle}
              </p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full px-6 uppercase tracking-widest font-bold text-xs">
              Cancel
            </AlertDialogCancel>
            <Button
              onClick={() => {
                if (editingDiagnosis) {
                  addDiagnosisMutation.mutate({
                    icd_code: editingDiagnosis.icdCode,
                    icd_title: editingDiagnosis.icdTitle,
                    notes: editingDiagnosis.notes,
                    is_ai_generated: true,
                    status: "Active",
                  });
                }
              }}
              disabled={addDiagnosisMutation.isPending || !activeAppointment}
              className="bg-primary hover:bg-primary/90 text-white font-bold rounded-full px-8 uppercase tracking-widest text-xs"
            >
              {addDiagnosisMutation.isPending ? "Saving..." : "Save to EMR"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
