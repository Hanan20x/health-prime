import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { useLang } from "@/hooks/useLang";
import { tx } from "@/lib/i18n";
import { 
  Brain, 
  Stethoscope, 
  CalendarCheck, 
  Sparkles, 
  Activity, 
  ShieldCheck, 
  Clock, 
  Users 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AiExplanationPage() {
  const { lang } = useLang();

  return (
    <DashboardLayout>
      <PageHeader
        title={tx("howAiWorks", lang)}
        description={tx("howAiWorksDesc", lang)}
      />

      <div className="space-y-8 pb-8">
        {/* Introduction Section */}
        <section className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 border border-primary/20 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="bg-primary text-primary-foreground p-3 rounded-xl shadow-md shrink-0">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {lang === "ar" ? "نظامنا المعتمد على الذكاء الاصطناعي" : "Our AI-Powered Ecosystem"}
              </h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                {lang === "ar" 
                  ? "تستخدم HealthPrime وكلاء ذكاء اصطناعي متقدمين لتقليل الأخطاء وتعزيز الكفاءة ومساعدة الطاقم الطبي. يستخدم النظام حالياً وكيلين متميزين:" 
                  : "HealthPrime utilizes advanced AI agents to reduce errors, boost efficiency, and assist medical staff. The system currently utilizes two distinct AI agents:"}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <Card className="border-primary/20 shadow-sm bg-white/60 dark:bg-slate-900/60 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <CalendarCheck className="w-5 h-5" />
                  {lang === "ar" ? "وكيل الجدولة الذكي" : "Scheduling AI Agent"}
                </CardTitle>
                <CardDescription className="text-slate-500">
                  {lang === "ar" ? "متوفر ونشط الآن" : "Active & Deployed"}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 dark:text-slate-300">
                {lang === "ar" 
                  ? "يعمل كـ 'مساعد ثانٍ' لمديري الصحة الإلكترونية والممرضين، حيث يتحقق من المواعيد المدخلة يدوياً لضمان الدقة والأولوية وعدم وجود تعارضات." 
                  : "Acts as a 'second set of eyes' for E-Health Admins and Nurses, verifying manually entered appointments for accuracy, clinical priority, and load balancing."}
              </CardContent>
            </Card>

            <Card className="border-amber-200 shadow-sm bg-white/60 dark:bg-slate-900/60 backdrop-blur opacity-80">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                  <Stethoscope className="w-5 h-5" />
                  {lang === "ar" ? "وكيل المساعدة التشخيصية" : "Diagnostic Assistance AI Agent"}
                </CardTitle>
                <CardDescription className="text-slate-500">
                  {lang === "ar" ? "مدمج في السجل الطبي" : "Integrated into Patient EMR"}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 dark:text-slate-300">
                {lang === "ar" 
                  ? "يساعد الأطباء في تحليل الملاحظات السريرية لاقتراح رموز التشخيص الطبي الدقيقة (ICD-10) مباشرة في السجل الطبي الإلكتروني." 
                  : "Assists doctors by analyzing clinical notes to suggest accurate ICD-10 diagnostic codes directly within the patient's Electronic Medical Record."}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Scheduling AI Detail Section */}
        <div className="flex items-center gap-2 mb-6 mt-12 px-2">
          <CalendarCheck className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {lang === "ar" ? "تفاصيل: كيف يعمل وكيل الجدولة الذكي" : "Deep Dive: How the Scheduling AI Agent Works"}
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Operating Model */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 h-full">
              <CardHeader>
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg">
                  {lang === "ar" ? "نموذج 'النموذج أولاً، المساعدة ثانياً'" : "Form-First, AI-Assist Second"}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 dark:text-slate-400 space-y-4">
                <p>
                  {lang === "ar" 
                    ? "الوكيل الذكي لا يتخذ قرارات مستقلة. الكادر الطبي دائماً في مركز التحكم." 
                    : "The AI does not make autonomous decisions. Clinical staff are always in control."}
                </p>
                <ul className="space-y-3">
                  <li className="flex gap-2 items-start">
                    <span className="font-bold text-primary">1.</span>
                    <span>{lang === "ar" ? "يقوم الموظف بتعبئة بيانات الموعد بناءً على التقييم المبدئي." : "Staff fills out the appointment form based on their manual triage."}</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="font-bold text-primary">2.</span>
                    <span>{lang === "ar" ? "ينقر الموظف على 'التحسين باستخدام الذكاء الاصطناعي'." : "Staff clicks the 'AI Optimize' magic wand."}</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="font-bold text-primary">3.</span>
                    <span>{lang === "ar" ? "يقوم الذكاء الاصطناعي بتحليل تاريخ المريض في السجل الطبي ويقارنه بالمدخلات." : "AI analyzes the EMR history and runs the 4 optimization dimensions."}</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="font-bold text-primary">4.</span>
                    <span>{lang === "ar" ? "يراجع الموظف مقترحات الذكاء الاصطناعي ويقبلها أو يرفضها قبل التأكيد." : "Staff reviews the interactive Visual Diff and safely accepts/rejects the AI suggestions. Completed bookings are flagged with Gold AI Badges!"}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* 4 Dimensions */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 h-full">
              <CardHeader>
                <CardTitle className="text-lg">
                  {lang === "ar" ? "أبعاد التحسين الأربعة" : "The 4 Dimensions of Optimization"}
                </CardTitle>
                <CardDescription>
                  {lang === "ar" ? "ماذا يحلل الذكاء الاصطناعي في الخلفية؟" : "What does the AI evaluate behind the scenes?"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/50 dark:border-rose-900/30 dark:bg-rose-950/20">
                    <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold mb-2">
                      <Activity className="w-4 h-4" />
                      {lang === "ar" ? "1. محاذاة الأولوية (SLA)" : "1. Priority Alignment (SLA)"}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {lang === "ar" 
                        ? "يتحقق مما إذا كانت الأعراض (مثل ألم الصدر) أو العلامات الحيوية (حمى 39 درجة) تتطلب أولوية 'عاجل' لرؤية الطبيب خلال 4 ساعات بدلاً من موعد روتيني." 
                        : "Checks if symptoms (e.g., chest pain) or vitals (e.g., 39°C fever) warrant an 'Urgent' priority to be seen within 4 hours, rather than a Routine booking."}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-sky-100 bg-sky-50/50 dark:border-sky-900/30 dark:bg-sky-950/20">
                    <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400 font-semibold mb-2">
                      <Users className="w-4 h-4" />
                      {lang === "ar" ? "2. ملاءمة الطبيب" : "2. Doctor Appropriateness"}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {lang === "ar" 
                        ? "يتحقق مما إذا كان لدى المريض طبيب أسرة مسجل في النظام لضمان استمرارية الرعاية، ويتأكد من تطابق تخصص الطبيب مع سبب الزيارة." 
                        : "Verifies if the patient has a registered GP on record to ensure continuity of care, and checks if the doctor's specialty matches the visit reason."}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/20">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold mb-2">
                      <Clock className="w-4 h-4" />
                      {lang === "ar" ? "3. كفاءة الوقت" : "3. Slot Efficiency & Timing"}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {lang === "ar" 
                        ? "يضمن أن وقت الحجز يقع ضمن ساعات العمل الرسمية للعيادة (8 صباحاً - 5 مساءً) ويملأ الفجوات غير الضرورية في جدول الطبيب." 
                        : "Ensures the booking falls within official clinic hours (08:00 - 17:00) and attempts to fill unnecessary gaps in the doctor's schedule."}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold mb-2">
                      <Sparkles className="w-4 h-4" />
                      {lang === "ar" ? "4. موازنة الأحمال" : "4. Load Balancing"}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {lang === "ar" 
                        ? "يمنع تحميل الأطباء أكثر من طاقتهم من خلال التحقق من الحجوزات السابقة، لتجنب تكدس المرضى في نفس الجلسة." 
                        : "Prevents overburdening doctors by checking their session capacity, avoiding bottlenecks where too many patients are booked at the exact same time."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Conflict Resolution */}
        <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 mt-6">
          <CardHeader>
            <CardTitle className="text-lg">
              {lang === "ar" ? "حل التعارضات الذكي" : "Smart Conflict Resolution"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              {lang === "ar" 
                ? "عندما يطلب النظام الموعد المحسن، يتحقق محرك قاعدة البيانات الخاص بنا تلقائياً من التعارضات. إذا كان الوقت المقترح محجوزاً مسبقاً لمريض آخر، فسيقوم النظام بإزاحة الموعد الجديد تلقائياً بمقدار 30 دقيقة (حتى 20 محاولة) للعثور على أقرب وقت متاح بالكامل، مما يضمن عدم وجود حجوزات مزدوجة على الإطلاق." 
                : "When generating automated slots, our database engine strictly checks for overlaps. If a proposed 30-minute window is already taken by another manual or AI booking, the system will automatically shift the slot forward by 30 minutes (up to 20 attempts) to find the nearest completely free slot, ensuring double-bookings never occur."}
            </p>
          </CardContent>
        </Card>

        {/* Technical Architecture */}
        <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              {lang === "ar" ? "تحت الغطاء: معمارية الوكيل الذكي المتعدد (LangGraph)" : "Under the Hood: LangGraph Multi-Agent Architecture"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed space-y-4">
            <p>
              {lang === "ar" 
                ? "يعمل وكيل الجدولة الذكي باستخدام سير عمل قائم على رسم بياني لحالة متقدمة (LangGraph)، مقسماً إلى عقدتين متميزتين:" 
                : "The Scheduling AI Agent operates using an advanced state-based graph workflow (LangGraph), broken down into distinct nodes:"}
            </p>
            <ul className="space-y-3">
              <li className="flex gap-2 items-start">
                <span className="font-bold text-primary">1.</span>
                <span>
                  <strong>{lang === "ar" ? "عقدة جمع البيانات:" : "Data Gathering Node:"}</strong>{" "}
                  {lang === "ar" ? "يجمع السياق الطبي الشامل (العلامات الحيوية، التاريخ الطبي، معلومات الطبيب) لتمريرها كحالة الوكيل (AgentState)." : "Aggregates comprehensive medical context (vitals, medical history, provider data) to pass along as the AgentState."}
                </span>
              </li>
              <li className="flex gap-2 items-start">
                <span className="font-bold text-primary">2.</span>
                <span>
                  <strong>{lang === "ar" ? "عقدة القرار (LLM):" : "Decision Node (LLM):"}</strong>{" "}
                  {lang === "ar" ? "يستخدم نموذجاً لغوياً كبيراً (Gemini 2.5 Flash عبر Google AI) لتحليل الحالة، وموازنة عوامل الأولوية، وإخراج هيكل بيانات (JSON) دقيق للموعد الأمثل." : "Utilizes a Large Language Model (Gemini 2.5 Flash via Google AI) to analyze the state, weigh priority factors, and output a strictly-typed JSON structure for the optimal appointment."}
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Diagnostic AI Detail Section */}
        <div className="flex items-center gap-2 mb-6 mt-16 px-2">
          <Stethoscope className="w-6 h-6 text-amber-600 dark:text-amber-500" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {lang === "ar" ? "تفاصيل: كيف يعمل وكيل المساعدة التشخيصية" : "Deep Dive: How the Diagnostic Assistance AI Agent Works"}
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Diagnostic Operating Model */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 h-full">
              <CardHeader>
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg">
                  {lang === "ar" ? "تحليل مبني على السجلات، قرار بيد الطبيب" : "EMR-Driven Analysis, Physician-Led Decision"}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 dark:text-slate-400 space-y-4">
                <p>
                  {lang === "ar" 
                    ? "يقوم الذكاء الاصطناعي بمعالجة البيانات، لكن الأطباء هم من يضعون التشخيص النهائي بناءً على خبرتهم." 
                    : "The AI processes massive amounts of patient data, but the physician always makes the final diagnostic decision based on their clinical expertise."}
                </p>
                <ul className="space-y-3">
                  <li className="flex gap-2 items-start">
                    <span className="font-bold text-amber-600 dark:text-amber-500">1.</span>
                    <span>{lang === "ar" ? "يقوم النظام بتجميع التاريخ الطبي للمريض بالكامل." : "System aggregates the patient's entire medical history, vitals, and notes."}</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="font-bold text-amber-600 dark:text-amber-500">2.</span>
                    <span>{lang === "ar" ? "يسترجع محرك البحث الإرشادات الطبية المرجعية المتطابقة." : "The RAG engine retrieves matching clinical guidelines from verified medical manuals."}</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="font-bold text-amber-600 dark:text-amber-500">3.</span>
                    <span>{lang === "ar" ? "يقوم Gemini 2.5 Flash (مع وضع التفكير الممتد) بتوليد قائمة بالتشخيصات المحتملة مع نسب الثقة والتبرير السريري." : "Gemini 2.5 Flash (with extended reasoning enabled) generates candidate ICD-10-CM diagnoses with confidence scores and clinical reasoning."}</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="font-bold text-amber-600 dark:text-amber-500">4.</span>
                    <span>{lang === "ar" ? "يراجع الطبيب المقترحات والمصادر الموثقة، ثم يعتمد التشخيص الصحيح في السجل." : "Doctor reviews the proposals and verified sources, then safely confirms the correct diagnosis."}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* 4 Pillars of Diagnostics */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 h-full">
              <CardHeader>
                <CardTitle className="text-lg">
                  {lang === "ar" ? "مراحل المعالجة التشخيصية" : "The Diagnostic Processing Pipeline"}
                </CardTitle>
                <CardDescription>
                  {lang === "ar" ? "كيف يقوم الذكاء الاصطناعي بتوليد وتقييم التشخيصات؟" : "How does the AI generate and score its candidate diagnoses?"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 dark:border-indigo-900/30 dark:bg-indigo-950/20">
                    <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-semibold mb-2">
                      <Activity className="w-4 h-4" />
                      {lang === "ar" ? "1. تجميع بيانات السجل" : "1. EMR Data Aggregation"}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {lang === "ar" 
                        ? "يجمع الملاحظات السريرية، الشكاوى الرئيسية، العلامات الحيوية، والمختبر في ملف سياقي واحد." 
                        : "Compiles Doctor's Notes, Chief Complaints, Vitals, Lab Orders, and comprehensive surgical/medical/medication history into a single contextual profile."}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/50 dark:border-purple-900/30 dark:bg-purple-950/20">
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-semibold mb-2">
                      <Sparkles className="w-4 h-4" />
                      {lang === "ar" ? "2. البحث المدعم بالسياق (RAG)" : "2. Contextual RAG Retrieval"}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {lang === "ar"
                        ? "يستخدم محركين: بحث NLM في قاعدة بيانات ICD-10-CM الرسمية، ومحرك BM25 محلي للبحث في الأدلة السريرية — لضمان توافق الاقتراحات مع البروتوكولات القياسية."
                        : "Uses two retrieval layers: an NLM ICD-10-CM API search for live code lookup, and a local BM25 keyword engine scanning indexed clinical manuals, grounding the AI strictly within evidence-based protocols."}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-fuchsia-100 bg-fuchsia-50/50 dark:border-fuchsia-900/30 dark:bg-fuchsia-950/20">
                    <div className="flex items-center gap-2 text-fuchsia-700 dark:text-fuchsia-400 font-semibold mb-2">
                      <Brain className="w-4 h-4" />
                      {lang === "ar" ? "3. التقييم العيادي للذكاء الاصطناعي" : "3. LLM Clinical Scoring"}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {lang === "ar" 
                        ? "يحسب مستوى الثقة عبر تقييم 5 عوامل: توافق الأعراض، ومطابقة العلامات الحيوية، وتوافق RAG." 
                        : "Calculates an overall confidence score by evaluating 5 strict metrics: Symptom-criteria match (30%), Lab/Vital alignment (25%), RAG Similarity (20%), Consistency, and Comorbidities."}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-950/20">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-semibold mb-2">
                      <ShieldCheck className="w-4 h-4" />
                      {lang === "ar" ? "4. المصادر الطبية والسلامة" : "4. Safety & Verified Sources"}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {lang === "ar" 
                        ? "كل تشخيص مرفق بمصدر طبي معتمد (مثل WHO, CDC) ورمز تشخيصي (ICD-10-CM)." 
                        : "Prohibited from recommending treatments autonomously. Every generated suggestion MUST cite a verified medical source (WHO, CDC, UpToDate) and output precise ICD-10-CM codes."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Scoring Breakdown */}
        <Card className="shadow-sm border-slate-200 dark:border-slate-800 mt-6">
          <CardHeader>
            <CardTitle className="text-lg">
              {lang === "ar" ? "كيف يتم حساب مستوى الثقة؟" : "How is the Confidence Score Calculated?"}
            </CardTitle>
            <CardDescription>
              {lang === "ar" 
                ? "يتحقق كل مقياس من نوع مختلف من الأدلة في سجل المريض، وتعكس الأوزان مدى موثوقية هذا النوع من الأدلة للترميز." 
                : "Each signal checks a different kind of evidence in the patient's record, and the weights reflect how trustworthy that kind of evidence is for ICD-10 coding."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              {/* 1. Symptoms */}
              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                    <Stethoscope className="w-4 h-4" />
                    1. Symptom-criteria match
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 text-[10px] font-black tracking-widest">30%</span>
                </div>
                <p className="text-[11px] font-semibold text-emerald-800/70 dark:text-emerald-300/70 italic mb-2">Does what the doctor wrote match the official criteria?</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">This is the heaviest weight because it's the most direct evidence. The agent compares the symptoms in the Chief Complaints against textbook criteria. If symptoms don't fit, nothing else can save the suggestion.</p>
              </div>

              {/* 2. Labs */}
              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-950/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold">
                    <Activity className="w-4 h-4" />
                    2. Lab and vital alignment
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-[10px] font-black tracking-widest">25%</span>
                </div>
                <p className="text-[11px] font-semibold text-blue-800/70 dark:text-blue-300/70 italic mb-2">Do the numbers back up the story?</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">Symptoms can be subjective, but structured numeric data (labs, vitals) is objective. This checks whether numbers are consistent with the diagnosis, weighted highly because numbers are harder to misinterpret.</p>
              </div>

              {/* 3. RAG */}
              <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 dark:border-indigo-900/30 dark:bg-indigo-950/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold">
                    <Sparkles className="w-4 h-4" />
                    3. RAG similarity score
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300 text-[10px] font-black tracking-widest">20%</span>
                </div>
                <p className="text-[11px] font-semibold text-indigo-800/70 dark:text-indigo-300/70 italic mb-2">How closely does this case resemble reference material?</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">The retrieval step: how well the ICD-10 codes retrieved from the NLM API and BM25 local manual match the patient case. Weighted lower as it measures similarity to general literature, not the specific clinical picture.</p>
              </div>

              {/* 4. Consistency */}
              <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/50 dark:border-purple-900/30 dark:bg-purple-950/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-bold">
                    <Brain className="w-4 h-4" />
                    4. Self-consistency
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-300 text-[10px] font-black tracking-widest">15%</span>
                </div>
                <p className="text-[11px] font-semibold text-purple-800/70 dark:text-purple-300/70 italic mb-2">Does the model give the same answer multiple times?</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">A model-reliability check. High agreement across runs suggests it isn't guessing. Useful as a sanity check on the AI itself, but doesn't independently verify clinical correctness.</p>
              </div>

              {/* 5. Comorbidity */}
              <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/20 lg:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold">
                    <Users className="w-4 h-4" />
                    5. Comorbidity prior
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-300 text-[10px] font-black tracking-widest">10%</span>
                </div>
                <p className="text-[11px] font-semibold text-amber-800/70 dark:text-amber-300/70 italic mb-2">Does this make epidemiological sense?</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">A base-rate adjustment. A patient with obesity and hypertension is statistically more likely to have type 2 diabetes. Weighted lowest as it's correlation, not direct observation.</p>
              </div>
            </div>

            <div className="p-4 mt-2 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-slate-700 dark:text-slate-300 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <span className="font-bold">Why the weighting works this way overall:</span> The system prioritizes direct clinical evidence (symptoms, labs) over indirect evidence (literature similarity, statistical priors), and treats the model's own self-consistency as a smaller, separate trust signal layered on top.
              </p>
            </div>
          </CardContent>
        </Card>
        {/* Fallback AI Mode */}
        <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/10 mt-6">
          <CardHeader>
            <CardTitle className="text-lg text-amber-800 dark:text-amber-500 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {lang === "ar" ? "آلية الطوارئ (الوضع الاحتياطي)" : "Deterministic Fallback Engine"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              {lang === "ar" 
                ? "لضمان عمل العيادة دون انقطاع، إذا واجه الذكاء الاصطناعي الرئيسي عطلاً، يتحول النظام فوراً إلى 'محرك الطوارئ المحلي' الذي يستخدم خوارزميات الكلمات المفتاحية لتقديم تشخيصات أولية موثوقة محلياً." 
                : "To ensure 100% uptime, if the primary LLM cloud engine experiences API latency or downtime, the system instantly hot-swaps to a local Deterministic Fallback Engine. This engine uses symptom-keyword overlap detection and algorithms to provide baseline, clinical-grade suggestions entirely locally without internet access."}
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
