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
        <section className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="bg-indigo-600 text-white p-3 rounded-xl shadow-md shrink-0">
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
            <Card className="border-indigo-200 shadow-sm bg-white/60 dark:bg-slate-900/60 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
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

            <Card className="border-teal-200 shadow-sm bg-white/60 dark:bg-slate-900/60 backdrop-blur opacity-80">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-teal-700 dark:text-teal-400">
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
          <CalendarCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {lang === "ar" ? "تفاصيل: كيف يعمل وكيل الجدولة الذكي" : "Deep Dive: How the Scheduling AI Agent Works"}
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Operating Model */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 h-full">
              <CardHeader>
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center mb-4">
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
                    <span className="font-bold text-emerald-600">1.</span>
                    <span>{lang === "ar" ? "يقوم الموظف بتعبئة بيانات الموعد بناءً على التقييم المبدئي." : "Staff fills out the appointment form based on their triage."}</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="font-bold text-emerald-600">2.</span>
                    <span>{lang === "ar" ? "ينقر الموظف على 'التحسين باستخدام الذكاء الاصطناعي'." : "Staff clicks 'Optimize with AI'."}</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="font-bold text-emerald-600">3.</span>
                    <span>{lang === "ar" ? "يقوم الذكاء الاصطناعي بتحليل تاريخ المريض في السجل الطبي ويقارنه بالمدخلات." : "AI analyzes the patient's EMR history and compares it with the inputs."}</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="font-bold text-emerald-600">4.</span>
                    <span>{lang === "ar" ? "يراجع الموظف مقترحات الذكاء الاصطناعي ويقبلها أو يرفضها قبل التأكيد." : "Staff reviews the AI's 'Diff' suggestions and accepts or rejects them before confirming."}</span>
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
      </div>
    </DashboardLayout>
  );
}
