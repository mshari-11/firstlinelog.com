import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Mail, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { API_BASE } from "@/lib/api";

type Step = "email" | "reset";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return setError("يرجى إدخال البريد الإلكتروني");
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حدث خطأ");
      setStep("reset");
      setSuccess("تم إرسال رمز التحقق إلى بريدك الإلكتروني");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء إرسال رمز التحقق");
    }
    setLoading(false);
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim()) return setError("يرجى إدخال رمز التحقق");
    if (!password || !confirmPassword) return setError("يرجى تعبئة جميع الحقول");
    if (password.length < 6) return setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    if (password !== confirmPassword) return setError("كلمتا المرور غير متطابقتين");
    setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: otp.trim(), newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حدث خطأ");
      setSuccess("تم تغيير كلمة المرور بنجاح! جارٍ التحويل...");
      setTimeout(() => navigate("/unified-login"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء تغيير كلمة المرور");
    }
    setLoading(false);
  }

  return (
    <div className="fll-console" dir="rtl" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 54, height: 54, margin: "0 auto 0.875rem", borderRadius: 12, background: "var(--con-bg-elevated)", border: "1px solid var(--con-border-default)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--con-brand)" }}>
            <KeyRound size={24} />
          </div>
          <h1 style={{ margin: 0, fontSize: 18, color: "var(--con-text-primary)", fontWeight: 700 }}>
            {step === "email" ? "نسيت كلمة المرور" : "إعادة تعيين كلمة المرور"}
          </h1>
          <p style={{ margin: "0.4rem 0 0", fontSize: 12, color: "var(--con-text-muted)" }}>
            {step === "email" ? "أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق" : `أدخل رمز التحقق المُرسل إلى ${email}`}
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: "1.5rem" }}>
          {(["email", "reset"] as Step[]).map((s, i) => (
            <div key={s} style={{ width: 48, height: 4, borderRadius: 2, background: (["email", "reset"].indexOf(step) >= i) ? "var(--con-brand)" : "var(--con-border-default)" }} />
          ))}
        </div>

        <div className="con-card" style={{ padding: "1.75rem" }}>
          {step === "email" && (
            <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, color: "var(--con-text-secondary)" }}>البريد الإلكتروني</label>
                <input className="con-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@fll.sa" type="email" autoFocus />
              </div>
              {error && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "var(--con-danger-subtle)", border: "1px solid var(--con-danger)", borderRadius: 8, color: "var(--con-danger)", fontSize: 13 }}><AlertCircle size={15} /> {error}</div>}
              <button className="con-btn-primary" type="submit" style={{ width: "100%", justifyContent: "center", opacity: loading ? 0.6 : 1 }} disabled={loading}>
                {loading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> جارٍ الإرسال...</> : <><Mail size={14} /> إرسال رمز التحقق</>}
              </button>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, color: "var(--con-text-secondary)" }}>رمز التحقق</label>
                <div dir="ltr" style={{ display: "flex", justifyContent: "center" }}>
                  <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} value={otp} onChange={setOtp} autoFocus>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, color: "var(--con-text-secondary)" }}>كلمة المرور الجديدة</label>
                <input className="con-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="6 أحرف على الأقل" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, color: "var(--con-text-secondary)" }}>تأكيد كلمة المرور</label>
                <input className="con-input" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="أعد إدخال كلمة المرور" />
              </div>
              {error && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "var(--con-danger-subtle)", border: "1px solid var(--con-danger)", borderRadius: 8, color: "var(--con-danger)", fontSize: 13 }}><AlertCircle size={15} /> {error}</div>}
              {success && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "rgba(34,197,94,0.08)", border: "1px solid var(--con-success)", borderRadius: 8, color: "var(--con-success)", fontSize: 13 }}><CheckCircle2 size={15} /> {success}</div>}
              <button className="con-btn-primary" type="submit" style={{ width: "100%", justifyContent: "center", opacity: loading ? 0.6 : 1 }} disabled={loading}>
                {loading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> جارٍ التغيير...</> : <><ShieldCheck size={14} /> تغيير كلمة المرور</>}
              </button>
              <button type="button" className="con-btn-ghost" style={{ width: "100%", justifyContent: "center", fontSize: 12 }} onClick={() => { setStep("email"); setError(""); setSuccess(""); setOtp(""); }}>
                تغيير البريد الإلكتروني
              </button>
            </form>
          )}

          <div style={{ marginTop: 14, textAlign: "center" }}>
            <button type="button" onClick={() => navigate("/unified-login")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--con-brand)", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <ArrowRight size={12} /> العودة لتسجيل الدخول
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
