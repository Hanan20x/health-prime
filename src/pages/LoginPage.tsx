import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { HeartPulse, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, Globe, ShieldCheck, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { apiFetch, setToken } from "@/api/client";
import type { AuthResponse } from "@/api/types";
import { useLang } from "@/hooks/useLang";
import { tx } from "@/lib/i18n";

const EMAIL_OTP_TTL = 300; // 5 minutes in seconds

function OtpCountdown({ onExpire }: { onExpire: () => void }) {
  const [seconds, setSeconds] = useState(EMAIL_OTP_TTL);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          onExpireRef.current();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const pct = (seconds / EMAIL_OTP_TTL) * 100;
  const isUrgent = seconds <= 60;

  return (
    <div className="flex flex-col items-center gap-2 mt-3">
      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? "bg-destructive" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`text-xs font-mono ${isUrgent ? "text-destructive" : "text-muted-foreground"}`}>
        {mins}:{secs.toString().padStart(2, "0")}
      </p>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || "/dashboard";
  const { lang, toggleLang, isArabic } = useLang();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [otpMethod, setOtpMethod] = useState<"email" | "totp" | null>(null);
  const [otpExpired, setOtpExpired] = useState(false);

  const login = useMutation({
    mutationFn: (body: { email: string; password: string; otp?: string }) =>
      apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      if (data.requiresOtp) {
        setRequiresOtp(true);
        setOtpMethod((data.otpMethod as "email" | "totp") ?? "email");
        setOtpExpired(false);
        setOtp("");
      } else if (data.accessToken) {
        setToken(data.accessToken);
        navigate(from, { replace: true });
      }
    },
    onError: (e: Error) => {
      setError(e.message || tx("loginFailed", lang));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError(tx("enterBothFields", lang)); return; }
    if (password.length < 8) { setError(tx("passwordTooShort", lang)); return; }
    login.mutate({ email: email.trim(), password });
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!otp || otp.length !== 6) return;
    login.mutate({ email: email.trim(), password, otp });
  };

  const handleResend = () => {
    setError("");
    setOtp("");
    setOtpExpired(false);
    login.mutate({ email: email.trim(), password });
  };

  return (
    <div className="min-h-screen bg-background flex" dir={isArabic ? "rtl" : "ltr"}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full border-2 border-primary-foreground/30" />
          <div className="absolute bottom-32 right-16 w-48 h-48 rounded-full border-2 border-primary-foreground/20" />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full border border-primary-foreground/15" />
        </div>
        <div className="relative z-10 text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-primary-foreground/15 flex items-center justify-center mx-auto mb-8">
            <HeartPulse className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-primary-foreground mb-3">{tx("appTitle", lang)}</h1>
          <p className="text-primary-foreground/80 text-base leading-relaxed">
            {lang === "ar" ? "مركز الريث للرعاية الصحية الأولية" : "Alraith Primary Healthcare Center"}
          </p>
          <p className="text-primary-foreground/60 text-sm mt-2">{tx("secureSystem", lang)}</p>
          <div className="mt-8 pt-8 border-t border-primary-foreground/15">
            <p className="text-primary-foreground/60 text-sm">{tx("ministryOfHealth", lang)}</p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <HeartPulse className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-primary">{tx("appTitle", lang)}</span>
          </div>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold">{tx("welcomeBack", lang)}</h2>
              <p className="text-sm text-muted-foreground mt-1">{tx("enterCredentials", lang)}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground text-xs border border-border rounded-md"
              onClick={toggleLang}
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === "en" ? "عربي" : "EN"}
            </Button>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-md">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          {login.isSuccess && !requiresOtp && (
            <div className="mb-4 flex items-center gap-2 text-sm text-primary bg-primary/10 px-4 py-3 rounded-md">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {tx("signedInSuccess", lang)}
            </div>
          )}

          {requiresOtp ? (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div className="flex flex-col items-center gap-3">
                {/* Method badge */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                  otpMethod === "totp"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-primary/10 text-primary border border-primary/20"
                }`}>
                  {otpMethod === "totp"
                    ? <><ShieldCheck className="w-3.5 h-3.5" /> {lang === "ar" ? "تطبيق المصادقة" : "Authenticator App"}</>
                    : <><Mail className="w-3.5 h-3.5" /> {lang === "ar" ? "رمز البريد الإلكتروني" : "Email Code"}</>
                  }
                </div>

                <Label className="text-sm">
                  {otpMethod === "totp"
                    ? (lang === "ar" ? "أدخل الرمز من تطبيق المصادقة" : "Enter the code from your authenticator app")
                    : (lang === "ar" ? "أدخل رمز التحقق المرسل لبريدك" : "Enter OTP code sent to your email")}
                </Label>

                <InputOTP maxLength={6} value={otp} onChange={setOtp} dir="ltr" disabled={otpExpired}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>

                {otpMethod === "email" && !otpExpired && (
                  <>
                    <p className="text-xs text-muted-foreground">{tx("otpSentHint", lang)}</p>
                    <OtpCountdown onExpire={() => setOtpExpired(true)} />
                  </>
                )}

                {otpMethod === "totp" && (
                  <p className="text-xs text-muted-foreground text-center">
                    {lang === "ar"
                      ? "افتح تطبيق المصادقة وأدخل الرمز الحالي"
                      : "Open your authenticator app and enter the current code"}
                  </p>
                )}

                {otpExpired && (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-xs text-destructive">{lang === "ar" ? "انتهت صلاحية الرمز" : "Code expired"}</p>
                    <Button type="button" variant="outline" size="sm" onClick={handleResend} disabled={login.isPending}>
                      {login.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (lang === "ar" ? "إعادة الإرسال" : "Resend Code")}
                    </Button>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full h-11" disabled={login.isPending || otp.length !== 6 || otpExpired}>
                {login.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{tx("verifying", lang)}</>
                ) : (
                  tx("verifyOTP", lang)
                )}
              </Button>

              <button
                type="button"
                className="w-full text-xs text-muted-foreground hover:text-foreground text-center"
                onClick={() => { setRequiresOtp(false); setOtp(""); setError(""); setOtpExpired(false); }}
              >
                {lang === "ar" ? "← العودة لتسجيل الدخول" : "← Back to login"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email">{tx("emailAddress", lang)}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@healthprime.sa"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">{tx("password", lang)}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={tx("enterPassword", lang)}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute ${isArabic ? "left-3" : "right-3"} top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-11" disabled={login.isPending}>
                {login.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{tx("signingIn", lang)}</>
                ) : (
                  tx("signIn", lang)
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
