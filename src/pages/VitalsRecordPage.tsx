import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HeartPulse,
  Activity,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Search,
  Stethoscope,
  BarChart3,
  Droplets,
  ClipboardCheck,
  Brain,
  Wind,
  Beef,
  Plus,
  X,
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { toast } from "sonner";
import { apiFetch } from "@/api/client";
import type { PatientListItem, PatientVitalsContext, VitalOut, VitalsChartBundle, VitalsHistoryRow } from "@/api/types";
import { cn } from "@/lib/utils";
import { useLang } from "@/hooks/useLang";
import { tx } from "@/lib/i18n";

export default function VitalsRecordPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { lang, isArabic } = useLang();
  const [searchParams, setSearchParams] = useSearchParams();
  const patientIdParam = searchParams.get("patientId");
  const patientId = patientIdParam ? Number(patientIdParam) : 0;

  const [activeView, setActiveView] = useState<"entry" | "table" | "trends">("entry");
  const [activePanel, setActivePanel] = useState("general");
  
  // States
  const [temp, setTemp] = useState("");
  const [hr, setHr] = useState("");
  const [rr, setRr] = useState("");
  const [spo2, setSpo2] = useState("");
  const [sys, setSys] = useState("");
  const [dia, setDia] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [complaints, setComplaints] = useState("");
  const [painLevel, setPainLevel] = useState("0");
  const [newAlert, setNewAlert] = useState("");
  const [sessionAlerts, setSessionAlerts] = useState<string[]>([]);

  const { data: patients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: () => apiFetch<PatientListItem[]>("/patients"),
  });

  const clinicalPanels = [
    { id: "general", label: tx("general", lang), icon: HeartPulse },
    { id: "abuse", label: tx("abuseScreening", lang), icon: ClipboardCheck },
    { id: "neuro", label: tx("neuroPanel", lang), icon: Brain },
    { id: "cardio", label: tx("cardio", lang), icon: Activity },
    { id: "respiratory", label: tx("respiratory", lang), icon: Wind },
    { id: "pain", label: tx("pain", lang), icon: Droplets },
    { id: "nutrition", label: tx("nutritional", lang), icon: Beef },
  ];

  const { data: ctx } = useQuery({
    queryKey: ["vitals-context", patientId],
    queryFn: () => apiFetch<PatientVitalsContext>(`/patients/${patientId}/vitals-context`),
    enabled: patientId > 0,
  });

  const { data: chartData } = useQuery({
    queryKey: ["vitals-charts", patientId],
    queryFn: () => apiFetch<VitalsChartBundle>(`/patients/${patientId}/vitals/charts`),
    enabled: patientId > 0 && activeView === "trends",
  });

  const { data: history = [] } = useQuery({
    queryKey: ["vitals-history", patientId],
    queryFn: () => apiFetch<VitalsHistoryRow[]>(`/patients/${patientId}/vitals/history`),
    enabled: patientId > 0 && activeView === "table",
  });

  const bmi = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    if (w && h) return (w / (h * h)).toFixed(1);
    return "0.0";
  }, [weight, height]);

  const map = useMemo(() => {
    const s = parseFloat(sys);
    const d = parseFloat(dia);
    if (s && d) return ((s + 2 * d) / 3).toFixed(1);
    return "0.0";
  }, [sys, dia]);

  useEffect(() => {
    if (!patientId && patients.length > 0) {
      setSearchParams({ patientId: String(patients[0].id) });
    }
  }, [patientId, patients, setSearchParams]);

  const save = useMutation({
    mutationFn: async () => {
      if (!patientId) throw new Error(tx("selectPatientError", lang));
      const body = {
        patient_id: patientId,
        temperature_c: temp ? Number(temp) : null,
        heart_rate: hr ? Number(hr) : null,
        respiratory_rate: rr ? Number(rr) : null,
        spo2: spo2 ? Number(spo2) : null,
        systolic_bp: sys ? Number(sys) : null,
        diastolic_bp: dia ? Number(dia) : null,
        weight_kg: weight ? Number(weight) : null,
        height_cm: height ? Number(height) : null,
        bmi: Number(bmi),
        notes: complaints.trim() || null,
      };
      return apiFetch("/vitals", { method: "POST", body: JSON.stringify(body) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vitals-context", patientId] });
      qc.invalidateQueries({ queryKey: ["vitals-history", patientId] });
      toast.success(tx("savedVitals", lang));
      if (activePanel === "general") {
          setTemp(""); setHr(""); setRr(""); setSpo2(""); setSys(""); setDia(""); setWeight(""); setHeight(""); setComplaints("");
      }
    },
    onError: (e: Error) => toast.error(lang === "ar" ? "فشل الحفظ" : "Failed to save", { description: e.message }),
  });

  const renderCurrentPanelForm = () => {
    switch (activePanel) {
      case "general":
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                   {tx("physMetrics", lang)}
                </h3>
                <div className="grid gap-6">
                   <VitalsInput label={tx("temp", lang)} value={temp} onChange={setTemp} unit="°C" placeholder="37.0" last={ctx?.lastVitals?.temperatureC} />
                   <VitalsInput label={tx("weight", lang)} value={weight} onChange={setWeight} unit="kg" placeholder="70.0" last={ctx?.lastVitals?.weightKg} />
                   <VitalsInput label={tx("height", lang)} value={height} onChange={setHeight} unit="cm" placeholder="170" last={ctx?.lastVitals?.heightCm} />
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                   {tx("coreVitals", lang)}
                </h3>
                <div className="grid gap-6">
                   <VitalsInput label={tx("pulseRate", lang)} value={hr} onChange={setHr} unit="bpm" placeholder="72" last={ctx?.lastVitals?.heartRate} />
                   <VitalsInput label={tx("rr", lang)} value={rr} onChange={setRr} unit="min" placeholder="16" last={ctx?.lastVitals?.respiratoryRate} />
                   <VitalsInput label={tx("spo2", lang)} value={spo2} onChange={setSpo2} unit="%" placeholder="98" last={ctx?.lastVitals?.spo2} />
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">{tx("bloodPressure", lang)}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                 <VitalsInput label={tx("systolic", lang)} value={sys} onChange={setSys} unit="mmHg" placeholder="120" />
                 <VitalsInput label={tx("diastolic", lang)} value={dia} onChange={setDia} unit="mmHg" placeholder="80" />
              </div>
            </div>
          </div>
        );
      case "neuro":
        return (
          <div className="space-y-10 py-4 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                   <Label className="text-xs font-semibold text-slate-500 uppercase tracking-tight">{tx("mentalStatus", lang)}</Label>
                   <Select defaultValue="alert">
                      <SelectTrigger className="h-12 rounded-xl border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alert">Alert & Oriented x 3</SelectItem>
                        <SelectItem value="confused">Confused / Disoriented</SelectItem>
                        <SelectItem value="lethargic">Lethargic</SelectItem>
                        <SelectItem value="obtunded">Obtunded</SelectItem>
                        <SelectItem value="comatose">Comatose</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
                <div className="space-y-3">
                   <Label className="text-xs font-semibold text-slate-500 uppercase tracking-tight">{tx("pupillaryResponse", lang)}</Label>
                   <Select defaultValue="perrl">
                      <SelectTrigger className="h-12 rounded-xl border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="perrl">PERRLA</SelectItem>
                        <SelectItem value="sluggish">Sluggish</SelectItem>
                        <SelectItem value="fixed">Fixed</SelectItem>
                        <SelectItem value="anisocoria">Unequal (Anisocoria)</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
             </div>
             <div className="space-y-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{tx("motorFunction", lang)} (0-5)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   <VitalsInput label="Upper Left" unit="" placeholder="5" />
                   <VitalsInput label="Upper Right" unit="" placeholder="5" />
                   <VitalsInput label="Lower Left" unit="" placeholder="5" />
                   <VitalsInput label="Lower Right" unit="" placeholder="5" />
                </div>
             </div>
          </div>
        );
      case "abuse":
        return (
          <div className="max-w-2xl mx-auto space-y-6 py-6 animate-in fade-in duration-500">
             <div className="flex items-center gap-4 bg-amber-50 border border-amber-100 p-4 rounded-xl mb-6">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-xs font-medium text-amber-700 leading-relaxed">
                  Confidential Screening: Ensure the patient is in a secure, private setting before proceeding.
                </p>
             </div>
             {[
               { id: "physical", label: "Have you been physically hurt or threatened recently?" },
               { id: "fear", label: "Do you feel unsafe in your current living situation?" },
               { id: "forced", label: "Are you being forced to do things against your will?" },
             ].map((q) => (
                <div key={q.id} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                   <span className="text-sm font-semibold text-slate-700 pr-4">{q.label}</span>
                   <div className="flex bg-slate-50 p-1 rounded-lg">
                      {["No", "Yes"].map(opt => (
                        <button key={opt} className="px-4 py-1.5 rounded-md text-[11px] font-bold uppercase transition-all hover:bg-white hover:shadow-sm">
                          {opt}
                        </button>
                      ))}
                   </div>
                </div>
             ))}
          </div>
        );
      case "cardio":
        return (
          <div className="space-y-10 py-4 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                   <Label className="text-xs font-semibold text-slate-500 uppercase tracking-tight">{tx("heartSounds", lang)}</Label>
                   <Select defaultValue="normal">
                      <SelectTrigger className="h-12 rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal (S1, S2)</SelectItem>
                        <SelectItem value="murmur">Murmur Detected</SelectItem>
                        <SelectItem value="gallop">S3 / Gallop</SelectItem>
                        <SelectItem value="irregular">Irregular Rhythm</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
                <div className="space-y-3">
                   <Label className="text-xs font-semibold text-slate-500 uppercase tracking-tight">{tx("capillaryRefill", lang)}</Label>
                   <Select defaultValue="less2">
                      <SelectTrigger className="h-12 rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="less2">&lt; 2 Seconds (Normal)</SelectItem>
                        <SelectItem value="more2">&gt; 2 Seconds (Delayed)</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
             </div>
             <div className="space-y-3">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-tight">{tx("peripheralEdema", lang)}</Label>
                <div className="flex gap-4">
                   {["None", "+1 Trace", "+2 Mild", "+3 Moderate", "+4 Severe"].map(e => (
                     <button key={e} className="flex-1 py-3 rounded-xl border border-slate-100 text-[10px] font-bold uppercase transition-all hover:border-primary hover:text-primary">
                        {e}
                     </button>
                   ))}
                </div>
             </div>
          </div>
        );
      case "respiratory":
        return (
          <div className="space-y-10 py-4 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                   <Label className="text-xs font-semibold text-slate-500 uppercase tracking-tight">{tx("lungSounds", lang)}</Label>
                   <Select defaultValue="clear">
                      <SelectTrigger className="h-12 rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clear">Clear Bilaterally</SelectItem>
                        <SelectItem value="crackles">Crackles / Rales</SelectItem>
                        <SelectItem value="wheezes">Wheezes</SelectItem>
                        <SelectItem value="rhonchi">Rhonchi</SelectItem>
                        <SelectItem value="diminished">Diminished</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
                <div className="space-y-3">
                   <Label className="text-xs font-semibold text-slate-500 uppercase tracking-tight">{tx("coughType", lang)}</Label>
                   <Select defaultValue="none">
                      <SelectTrigger className="h-12 rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="productive">Productive</SelectItem>
                        <SelectItem value="dry">Dry / Non-productive</SelectItem>
                        <SelectItem value="hacking">Hacking</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
             </div>
             <VitalsInput label={tx("oxygenSupport", lang)} unit="" placeholder="e.g. 2L Nasal Cannula" />
          </div>
        );
      case "pain":
        return (
          <div className="max-w-xl mx-auto space-y-10 py-6 animate-in fade-in duration-500">
             <div className="text-center space-y-2">
                <span className="text-6xl font-bold text-primary">{painLevel}</span>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{tx("painIntensity", lang)}</p>
             </div>
             <input type="range" min="0" max="10" value={painLevel} onChange={e => setPainLevel(e.target.value)} className="w-full h-1.5 bg-slate-100 rounded-full appearance-none accent-primary cursor-pointer" />
             <div className="grid grid-cols-2 gap-8">
                <VitalsInput label="Pain Location" unit="" placeholder="e.g. Back" />
                <div className="space-y-3">
                   <Label className="text-xs font-semibold text-slate-500">Pain Character</Label>
                   <Select><SelectTrigger className="h-11 rounded-lg border-slate-200"><SelectValue placeholder="Select character..." /></SelectTrigger><SelectContent><SelectItem value="sharp">Sharp</SelectItem><SelectItem value="dull">Dull</SelectItem></SelectContent></Select>
                </div>
             </div>
          </div>
        );
      case "nutrition":
        return (
          <div className="space-y-10 py-4 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                   <Label className="text-xs font-semibold text-slate-500 uppercase tracking-tight">{tx("dietType", lang)}</Label>
                   <Select defaultValue="omnivore">
                      <SelectTrigger className="h-12 rounded-xl border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="omnivore">Omnivore</SelectItem>
                        <SelectItem value="vegetarian">Vegetarian</SelectItem>
                        <SelectItem value="vegan">Vegan</SelectItem>
                        <SelectItem value="pescatarian">Pescatarian</SelectItem>
                        <SelectItem value="restricted">Restricted Diet</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
                <div className="space-y-3">
                   <Label className="text-xs font-semibold text-slate-500 uppercase tracking-tight">{tx("appetiteLevel", lang)}</Label>
                   <Select defaultValue="normal">
                      <SelectTrigger className="h-12 rounded-xl border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="decreased">Decreased</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
             </div>
             <div className="space-y-3">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-tight">{tx("swallowingDifficulty", lang)}</Label>
                <Select defaultValue="none">
                   <SelectTrigger className="h-12 rounded-xl border-slate-200">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="none">None</SelectItem>
                     <SelectItem value="mild">Mild (Occasional)</SelectItem>
                     <SelectItem value="moderate">Moderate (Frequent)</SelectItem>
                     <SelectItem value="severe">Severe (Most meals)</SelectItem>
                   </SelectContent>
                </Select>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                   <Label className="text-xs font-semibold text-slate-500 uppercase tracking-tight">{tx("giSymptoms", lang)}</Label>
                   <Select defaultValue="none">
                      <SelectTrigger className="h-12 rounded-xl border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="nausea">Nausea</SelectItem>
                        <SelectItem value="vomiting">Vomiting</SelectItem>
                        <SelectItem value="diarrhea">Diarrhea</SelectItem>
                        <SelectItem value="constipation">Constipation</SelectItem>
                        <SelectItem value="abdominal-pain">Abdominal Pain</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
                <div className="space-y-3">
                   <Label className="text-xs font-semibold text-slate-500 uppercase tracking-tight">{tx("weightChange", lang)}</Label>
                   <Select defaultValue="stable">
                      <SelectTrigger className="h-12 rounded-xl border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gain">Gaining Weight</SelectItem>
                        <SelectItem value="stable">Stable</SelectItem>
                        <SelectItem value="loss-mild">Mild Loss (&lt;5%)</SelectItem>
                        <SelectItem value="loss-significant">Significant Loss (&gt;5%)</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
             </div>
             <div className="space-y-3">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-tight">Dietary Restrictions / Allergies</Label>
                <input type="text" placeholder="e.g. Gluten-free, Shellfish allergy" className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:bg-white focus:ring-2 ring-primary/5 transition-all" />
             </div>
             <div className="space-y-3">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-tight">Supplements / Vitamins</Label>
                <input type="text" placeholder="e.g. Vitamin D, Fish oil, Multivitamin" className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:bg-white focus:ring-2 ring-primary/5 transition-all" />
             </div>
          </div>
        );
      default:
        return <div className="py-20 text-center text-slate-400 italic font-medium">Form for {activePanel} coming soon...</div>;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-[#fdfdfd] overflow-hidden font-sans">
        
        {/* Header: Refined Context */}
        <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between z-30">
          <div className="flex items-center gap-6">
            <div className="space-y-0.5">
               <Select value={String(patientId)} onValueChange={v => setSearchParams({ patientId: v })}>
                  <SelectTrigger className="h-auto p-0 border-none bg-transparent text-slate-900 focus:ring-0 group">
                     <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-black tracking-tight">{ctx?.fullName || tx("selectPatient", lang)}</span>
                        <span className="text-xl font-bold text-slate-300 tracking-tighter">#{ctx?.nationalId || "—"}</span>
                        <div className="ml-1 opacity-20 group-hover:opacity-100 transition-opacity">
                           <Search className="w-4 h-4" />
                        </div>
                     </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                     <div className="p-2 border-b border-slate-50 bg-slate-50/50 mb-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1">{tx("recentPatients", lang)}</p>
                     </div>
                     {patients.map(p => <SelectItem key={p.id} value={String(p.id)} className="rounded-xl py-3 cursor-pointer">{p.name} • {p.nationalId}</SelectItem>)}
                  </SelectContent>
               </Select>

               <div className="mt-1.5 flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <div className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                     <span>{ctx?.gender || "—"}</span>
                  </div>
                  <span className="w-1 h-1 rounded-full bg-slate-200" />
                  <span>{ctx?.age || "—"} {tx("years", lang)}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-200" />
                  <button 
                    onClick={() => navigate(`/emr/${patientId}`)}
                    className="text-primary hover:text-primary/70 transition-colors"
                  >
                    {tx("emrPortal", lang)} →
                  </button>
               </div>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-slate-50/50 p-1 rounded-xl border border-slate-100 shadow-inner">
             {[
               { id: "entry", label: tx("assessment", lang), icon: ClipboardCheck },
               { id: "table", label: tx("history", lang), icon: Search },
               { id: "trends", label: tx("analytics", lang), icon: BarChart3 }
             ].map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveView(tab.id as any)}
                 className={cn(
                   "flex items-center gap-2 px-6 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all",
                   activeView === tab.id ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                 ) as any}
               >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
               </button>
             ))}
          </nav>
        </header>

        <main className="flex-1 overflow-auto p-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto h-full">
            {activeView === "entry" && (
              <div className="flex flex-col lg:flex-row gap-10 items-start">
                
                <div className="flex-1 min-w-0 space-y-8">
                   {/* Header with Title and Session Info */}
                   <div className="flex items-center justify-between">
                      <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                         {clinicalPanels.find(p => p.id === activePanel)?.label} {tx("entry", lang)}
                      </h2>
                      <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-4 py-2 rounded-full">
                         Session Active: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                   </div>

                   {/* Protocol Bar */}
                   <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                      {clinicalPanels.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setActivePanel(p.id)}
                          className={cn(
                            "flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-semibold tracking-tight transition-all border shrink-0",
                            activePanel === p.id 
                             ? "bg-primary text-white border-primary shadow-lg shadow-primary/10" 
                             : "bg-white text-slate-500 border-slate-100 hover:border-primary/20 hover:text-primary"
                          )}
                        >
                           <p.icon className="w-3.5 h-3.5" />
                           {p.label}
                        </button>
                      ))}
                   </div>

                   <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm relative overflow-hidden">
                      <div className="relative space-y-10">
                         <div className="min-h-[350px]">
                            {renderCurrentPanelForm()}
                         </div>

                         <div className="pt-8 border-t border-slate-50">
                            <Label className="text-xs font-semibold text-slate-400 mb-3 inline-block">{tx("medicalObservations", lang)}</Label>
                            <textarea value={complaints} onChange={e => setComplaints(e.target.value)} className="w-full h-20 bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-sm font-medium outline-none focus:bg-white focus:ring-2 ring-primary/5 transition-all" placeholder={tx("enterFindings", lang)} />
                         </div>

                         <div className="flex items-center justify-end gap-4">
                            <Button variant="ghost" onClick={() => navigate("/patients")} className="h-12 px-8 font-semibold text-slate-400 hover:text-slate-600">{tx("discard", lang)}</Button>
                            <Button onClick={() => save.mutate()} disabled={!patientId || save.isPending} className="h-12 px-10 bg-primary text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/20">
                               {save.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ClipboardCheck className="w-4 h-4 mr-2" />}
                               {tx("saveRecord", lang)}
                            </Button>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Compact Context Sidebar */}
                <aside className="w-full lg:w-72 shrink-0 space-y-6 lg:sticky lg:top-0">
                   <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm space-y-8">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{tx("calculations", lang)}</p>
                      <div className="space-y-8">
                         <CalculationCard label={tx("bmiIndicator", lang)} value={bmi} unit="kg/m²" />
                         <CalculationCard label={tx("standardMAP", lang)} value={map} unit="mmHg" />
                      </div>
                   </div>

                   <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm space-y-4">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{tx("patientAlerts", lang)}</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {[...(ctx?.allergiesList || []), ...sessionAlerts].length ? (
                          [...(ctx?.allergiesList || []), ...sessionAlerts].map((a, i) => (
                            <div key={i} className="bg-red-50 text-red-500 border border-red-100/50 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-2 group hover:border-red-300 transition-colors">
                              <span>{a}</span>
                              {sessionAlerts.includes(a) && (
                                <button
                                  onClick={() => setSessionAlerts(sessionAlerts.filter(sa => sa !== a))}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-0.5 hover:bg-red-100 rounded"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))
                        ) : (
                          <span className="text-[11px] font-medium text-slate-300 italic">{tx("noData", lang)}</span>
                        )}
                      </div>
                      <div className="pt-3 border-t border-slate-100 flex gap-2">
                        <input
                          type="text"
                          value={newAlert}
                          onChange={(e) => setNewAlert(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && newAlert.trim()) {
                              setSessionAlerts([...sessionAlerts, newAlert.trim()]);
                              setNewAlert("");
                            }
                          }}
                          placeholder="Add alert..."
                          className="flex-1 h-9 px-3 text-xs bg-slate-50 border border-slate-100 rounded-lg outline-none focus:bg-white focus:border-primary/30 focus:ring-1 focus:ring-primary/10 transition-all"
                        />
                        <button
                          onClick={() => {
                            if (newAlert.trim()) {
                              setSessionAlerts([...sessionAlerts, newAlert.trim()]);
                              setNewAlert("");
                            }
                          }}
                          className="h-9 px-3 bg-red-50 border border-red-100 text-red-500 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                   </div>
                </aside>
              </div>
            )}

            {activeView === "table" && (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.02)] overflow-hidden animate-in fade-in duration-500">
                   <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                      <div>
                         <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{tx("medicalRegistry", lang)}</h2>
                         <p className="text-[11px] font-semibold text-slate-400 mt-1 uppercase tracking-widest">{tx("historicalObservations", lang)}</p>
                      </div>
                      <div className="relative w-72">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                         <input 
                          type="text" 
                          placeholder={tx("searchRegistry", lang)} 
                          className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 ring-primary/5 focus:bg-white focus:border-primary/20 transition-all placeholder:text-slate-400"
                         />
                      </div>
                   </div>
                   <div className="overflow-x-auto">
                      <table className="w-full">
                         <thead className="bg-[#fcfdfe] text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                            <tr>
                               <th className="px-10 py-5 text-left">{tx("medicalTime", lang)}</th>
                               <th className="px-8 py-5 text-left">{tx("temp", lang)}</th>
                               <th className="px-8 py-5 text-left">{tx("pulseRate", lang)}</th>
                               <th className="px-8 py-5 text-left">{tx("bp", lang)}</th>
                               <th className="px-8 py-5 text-left">{tx("rr", lang)}</th>
                               <th className="px-8 py-5 text-left">{tx("weight", lang)}</th>
                               <th className="px-8 py-5 text-left">{tx("height", lang)}</th>
                               <th className="px-8 py-5 text-left">{tx("bmiIndicator", lang)}</th>
                               <th className="px-10 py-5 text-left">{tx("attendingNurse", lang)}</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50 font-sans">
                            {history.length > 0 ? history.map((row, i) => (
                               <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                  <td className="px-10 py-6">
                                     <p className="text-sm font-bold text-slate-700 tracking-tight">{row.date}</p>
                                     <p className="text-[10px] font-medium text-slate-400 uppercase">{row.time}</p>
                                  </td>
                                  <td className="px-8 py-6">
                                     <span className="text-sm font-bold text-slate-600">{row.temp}</span>
                                  </td>
                                  <td className="px-8 py-6 font-bold text-primary">
                                     {row.hr}
                                  </td>
                                  <td className="px-8 py-6">
                                     <span className="text-sm font-bold text-slate-800">{row.bp}</span>
                                  </td>
                                  <td className="px-8 py-6 font-bold text-slate-600">{row.rr}</td>
                                  <td className="px-8 py-6">
                                     <span className="text-sm font-bold text-slate-700">{row.weight}</span>
                                  </td>
                                  <td className="px-8 py-6 text-sm font-semibold text-slate-500">
                                     {row.height}
                                  </td>
                                  <td className="px-8 py-6">
                                     <div className={cn("inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold border", 
                                       parseFloat(row.bmi || "0") > 25 ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                     )}>
                                        {row.bmi}
                                     </div>
                                  </td>
                                  <td className="px-10 py-6 text-left">
                                     <div className="flex items-center gap-2.5">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{row.recordedBy}</span>
                                     </div>
                                  </td>
                               </tr>
                            )) : (
                              <tr>
                                <td colSpan={9} className="py-32 text-center">
                                   <div className="flex flex-col items-center gap-3 opacity-20">
                                      <Search className="w-10 h-10" />
                                      <p className="text-xs font-bold uppercase tracking-widest">{tx("noHistoryFound", lang)}</p>
                                   </div>
                                </td>
                              </tr>
                            )}
                         </tbody>
                      </table>
                   </div>
                </div>
            )}

            {activeView === "trends" && (
                <div className="space-y-8 animate-in zoom-in-95 duration-500">
                    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm overflow-hidden h-[450px]">
                        <div className="mb-8">
                           <h2 className="text-xl font-bold text-slate-800 tracking-tight">{tx("tprChart", lang)}</h2>
                           <p className="text-[10px] font-bold uppercase tracking-widest mt-1"><span className="text-[#006b3f]">{tx("temp", lang)}</span> • <span className="text-[#f43f5e]">{tx("pulseRate", lang)}</span> • <span className="text-[#0ea5e9]">{tx("rr", lang)}</span></p>
                        </div>
                        {chartData && (
                            <ResponsiveContainer width="100%" height="75%">
                                <LineChart data={chartData.temperature.map((t, i) => ({ 
                                  date: t.date, 
                                  temp: t.value, 
                                  hr: chartData.heartRate[i]?.value,
                                  rr: chartData.respiratoryRate[i]?.value
                                }))}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" tick={{fontSize: 9, fontWeight: 600}} dy={10} axisLine={false} />
                                    <YAxis tick={{fontSize: 9, fontWeight: 600}} axisLine={false} />
                                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)'}} />
                                    <Line type="monotone" dataKey="temp" stroke="#006b3f" strokeWidth={3} dot={{r: 4, fill: '#006b3f'}} />
                                    <Line type="monotone" dataKey="hr" stroke="#f43f5e" strokeWidth={3} dot={{r: 4, fill: '#f43f5e'}} />
                                    <Line type="monotone" dataKey="rr" stroke="#0ea5e9" strokeWidth={3} dot={{r: 4, fill: '#0ea5e9'}} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm overflow-hidden h-[450px]">
                        <div className="mb-8">
                           <h2 className="text-xl font-bold text-slate-800 tracking-tight">{tx("bpTrends", lang)}</h2>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Systolic vs Diastolic Tracking (mmHg)</p>
                        </div>
                        {chartData && (
                            <ResponsiveContainer width="100%" height="75%">
                                <LineChart data={chartData.bloodPressure.map(b => ({ 
                                  date: b.date, 
                                  sys: b.systolic, 
                                  dia: b.diastolic 
                                }))}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" tick={{fontSize: 9, fontWeight: 600}} dy={10} axisLine={false} />
                                    <YAxis tick={{fontSize: 9, fontWeight: 600}} axisLine={false} />
                                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)'}} />
                                    <Line type="monotone" dataKey="sys" stroke="#6366f1" strokeWidth={3} strokeDasharray="5 5" dot={{r: 4, fill: '#6366f1'}} />
                                    <Line type="monotone" dataKey="dia" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4, fill: '#8b5cf6'}} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            )}
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}

function VitalsInput({ label, value, onChange, unit, placeholder, last }: any) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-0.5">
        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{label}</Label>
        {last !== undefined && <span className="text-[10px] font-semibold text-primary/40">{tx("lastMeasure", lang)}: {last}{unit}</span>}
      </div>
      <div className="relative">
        <input
          type="number"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-50/50 border border-slate-100 py-3 text-lg font-bold text-slate-700 outline-none focus:border-primary focus:bg-white rounded-xl px-4 transition-all"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300">{unit}</span>
      </div>
    </div>
  );
}

function CalculationCard({ label, value, unit }: any) {
  return (
    <div className="space-y-1.5">
       <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
       <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold text-slate-800">{value}</span>
          <span className="text-xs font-semibold text-primary">{unit}</span>
       </div>
    </div>
  );
}
