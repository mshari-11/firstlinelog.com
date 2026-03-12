/**
 * Unified Login Portal — Staff & Courier Selection
 * 
 * Shows:
 * 1. Header with logo and nav (matching fll.sa style)
 * 2. Two portal buttons: Staff (الموظفين) and Courier System (نظام السائقين)
 * 3. Inline staff login form with OTP verification
 * 4. Footer with support contact
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/admin/auth";
import { supabase } from "@/lib/supabase";
import { sendOtp, verifyOtp } from "@/lib/otp-service";
import {
  Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, ArrowRight, ArrowLeft, Smartphone,
} from "lucide-react";

type Portal = "none" | "staff" | "otp";

function ErrorBanner({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: "0.5rem",
      padding: "0.625rem 0.875rem",
      background: "var(--con-danger-subtle)",
      border: "1px solid var(--con-danger)",
      borderRadius: "var(--con-radius)",
      fontSize: "13px",
      color: "var(--con-danger)",
    }}>
      <AlertCircle size={15} style={{ flexShrink: 0, marginTop: "1px" }} />
      <span>{msg}</span>
    </div>
  );
}

function SuccessBanner({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: "0.5rem",
      padding: "0.625rem 0.875rem",
      background: "var(--con-success-subtle)",
      border: "1px solid var(--con-success)",
      borderRadius: "var(--con-radius)",
      fontSize: "13px",
      color: "var(--con-success)",
    }}>
      <span>{msg}</span>
    </div>
  );
}

function InputField({
  label, id, type = "text", value, onChange, placeholder, autoComplete,
  rightSlot, autoFocus, maxLength,
}: {
  label: string; id: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  autoComplete?: string; rightSlot?: React.ReactNode; autoFocus?: boolean;
  maxLength?: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <label htmlFor={id} style={{ fontSize: "13px", fontWeight: 500, color: "var(--con-text-secondary)" }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          id={id} type={type} value={value} autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          maxLength={maxLength}
          className="con-input"
          style={{ width: "100%", ...(rightSlot ? { paddingLeft: "2.5rem" } : {}) }}
        />
        {rightSlot && (
          <div style={{ position: "absolute", left: "0.625rem", top: "50%", transform: "translateY(-50%)" }}>
            {rightSlot}
          </div>
        )}
      </div>
    </div>
  );
}

function PrimaryBtn({ children, loading, disabled, onClick, type = "submit" }: {
  children: React.ReactNode; loading?: boolean; disabled?: boolean;
  onClick?: () => void; type?: "submit" | "button";
}) {
  return (
    <button
      type={type} disabled={loading || disabled} onClick={onClick}
      className="con-btn-primary"
      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", opacity: (loading || disabled) ? 0.55 : 1 }}
    >
      {loading
        ? <><div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /><span>جارٍ التحميل...</span></>
        : children}
    </button>
  );
}

function SecondaryBtn({ children, onClick, disabled }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled}
      className="con-btn-secondary"
      style={{ width: "100%", opacity: disabled ? 0.55 : 1 }}
    >
      {children}
    </button>
  );
}

function OTPInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const handleChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newValue = value.split("");
    newValue[index] = val;
    onChange(newValue.join("").slice(0, 6));
  };

  const digits = value.padEnd(6, "").split("");

  return (
    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginBottom: "1.5rem" }}>
      {digits.map((digit, i) => (
        <input
          key={i}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          autoFocus={i === 0}
          className="con-input"
          style={{
            width: "50px", height: "50px", textAlign: "center", fontSize: "24px", fontWeight: "bold",
            borderRadius: "var(--con-radius)",
          }}
        />
      ))}
    </div>
  );
}

function PortalButton({
  icon, title, subtitle, onClick, selected,
}: {
  icon: string; title: string; subtitle: string; onClick: () => void; selected: boolean;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        padding: "1.5rem",
        border: selected ? "2px solid var(--con-brand)" : "2px solid var(--con-border-strong)",
        borderRadius: "var(--con-radius-lg)",
        background: selected ? "var(--con-brand-subtle)" : "transparent",
        cursor: "pointer",
        transition: "all 0.3s ease",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.75rem",
        flex: 1,
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--con-brand)";
          (e.currentTarget as HTMLButtonElement).style.background = "var(--con-bg-hover)";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--con-border-strong)";
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        }
      }}
    >
      <div style={{ fontSize: "2rem" }}>{icon}</div>
      <div>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--con-text-primary)", margin: "0 0 0.25rem" }}>{title}</h3>
        <p style={{ fontSize: "12px", color: "var(--con-text-muted)", margin: 0 }}>{subtitle}</p>
      </div>
    </button>
  );
}

export default function UnifiedPortal() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [portal, setPortal] = useState<Portal>("none");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  function goPortal(p: Portal) { setError(""); setSuccess(""); setPortal(p); }

  // Password login for staff
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("أدخل البريد الإلكتروني"); return; }
    if (!password) { setError("أدخل كلمة المرور"); return; }
    setError(""); setLoading(true);
    const res = await signIn(email.trim(), password);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    
    setSuccess("تم التحقق من بيانات المرور. جارٍ إرسال رمز التحقق...");
    setTimeout(async () => {
      const otpRes = await sendOtp(email.trim(), "login");
      if (otpRes.error) {
        setError(otpRes.error);
        return;
      }
      setSuccess("تم إرسال رمز التحقق إلى بريدك الإلكتروني");
      setOtpSent(true);
      goPortal("otp");
    }, 500);
  }

  async function handleOTPVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) { setError("أدخل رمز التحقق الكامل (6 أرقام)"); return; }
    setError(""); setLoading(true);
    const res = await verifyOtp(email.trim(), otp, "login");
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    
    setSuccess("تم التحقق بنجاح!");
    setTimeout(() => redirectAfterAuth(), 1000);
  }

  async function handleOTPResend() {
    setError(""); setLoading(true);
    const res = await sendOtp(email.trim(), "login");
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setSuccess("تم إرسال رمز جديد إلى بريدك الإلكتروني");
    setOtp("");
  }

  async function redirectAfterAuth() {
    if (!supabase) { navigate("/admin-panel/dashboard"); return; }
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data: profile } = await supabase
        .from("users").select("role").eq("id", authUser.id).single();
      if (profile?.role === "courier") { navigate("/courier/portal"); return; }
    }
    navigate("/admin-panel/dashboard");
  }

  return (
    <div className="fll-console" style={{
      minHeight: "100vh",
      background: "var(--con-bg-app)",
      display: "flex",
      flexDirection: "column",
      fontFamily: "var(--con-font-primary)",
    }} dir="rtl">

      {/* CSS for animations */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .fll-portal-enter { animation: slideIn 0.4s ease-out; }
      `}</style>

      {/* Header */}
      <header style={{
        padding: "1.5rem",
        borderBottom: "1px solid var(--con-border)",
        background: "var(--con-bg-elevated)",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <img
              src="/images/first_line_professional_english_1.png"
              alt="First Line Logistics"
              style={{ width: "32px", height: "32px", objectFit: "contain" }}
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                el.style.display = "none";
              }}
            />
            <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--con-text-primary)" }}>
              First Line Logistics
            </span>
          </div>

          <nav style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
            <a href="/" style={{ fontSize: "13px", color: "var(--con-text-secondary)", textDecoration: "none" }}>
              الرئيسية
            </a>
            <a href="/about" style={{ fontSize: "13px", color: "var(--con-text-secondary)", textDecoration: "none" }}>
              من نحن
            </a>
            <a href="/services" style={{ fontSize: "13px", color: "var(--con-text-secondary)", textDecoration: "none" }}>
              خدماتنا
            </a>
            <a href="/news" style={{ fontSize: "13px", color: "var(--con-text-secondary)", textDecoration: "none" }}>
              الأخبار
            </a>
            <a href="/investors" style={{ fontSize: "13px", color: "var(--con-text-secondary)", textDecoration: "none" }}>
              المستثمرين
            </a>
            <a href="/contact" style={{ fontSize: "13px", color: "var(--con-text-secondary)", textDecoration: "none" }}>
              اتصل بنا
            </a>
            <button style={{
              background: "none",
              border: "none",
              color: "var(--con-text-secondary)",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
            }}>
              EN
            </button>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
      }}>

        {/* Portal buttons or login form */}
        {portal === "none" ? (
          <div className="fll-portal-enter" style={{ width: "100%", maxWidth: "600px" }}>
            <div style={{ marginBottom: "3rem", textAlign: "center" }}>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--con-text-primary)", marginBottom: "0.5rem" }}>
                بوابة تسجيل الدخول الموحدة
              </h1>
              <p style={{ fontSize: "14px", color: "var(--con-text-muted)" }}>
                اختر النظام المناسب للدخول
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
              <PortalButton
                icon="🔒"
                title="الموظفين"
                subtitle="Staff Login"
                onClick={() => { goPortal("staff"); setEmail(""); setPassword(""); setOtp(""); setOtpSent(false); }}
                selected={false}
              />
              <PortalButton
                icon="👤+"
                title="نظام السائقين"
                subtitle="Courier System"
                onClick={() => navigate("/courier/register")}
                selected={false}
              />
            </div>
          </div>
        ) : portal === "staff" ? (
          <div className="fll-portal-enter" style={{ width: "100%", maxWidth: "400px" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <button
                type="button"
                onClick={() => { goPortal("none"); setEmail(""); setPassword(""); }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--con-text-secondary)",
                  cursor: "pointer",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: 0,
                  marginBottom: "1rem",
                }}
              >
                <ArrowRight size={15} />
                العودة للخيارات
              </button>

              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--con-text-primary)", marginBottom: "0.5rem" }}>
                تسجيل دخول الموظفين
              </h2>
              <p style={{ fontSize: "12px", color: "var(--con-text-muted)" }}>
                أدخل بريدك الإلكتروني وكلمة المرور
              </p>
            </div>

            <div className="con-card" style={{ padding: "1.75rem" }}>
              <form onSubmit={handlePasswordLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <InputField
                  label="البريد الإلكتروني"
                  id="email" type="email"
                  value={email} onChange={setEmail}
                  placeholder="admin@fll.sa"
                  autoComplete="email"
                  autoFocus
                />
                <InputField
                  label="كلمة المرور" id="password"
                  type={showPass ? "text" : "password"}
                  value={password} onChange={setPassword}
                  placeholder="••••••••" autoComplete="current-password"
                  rightSlot={
                    <button
                      type="button" onClick={() => setShowPass(!showPass)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--con-text-muted)", display: "flex", padding: 0 }}
                    >
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                />

                {error && <ErrorBanner msg={error} />}
                {success && <SuccessBanner msg={success} />}

                <PrimaryBtn loading={loading}>
                  <LogIn size={15} /> دخول
                </PrimaryBtn>
              </form>

              <div style={{ marginTop: "1rem", textAlign: "center" }}>
                <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: "12px", color: "var(--con-text-muted)", textDecoration: "none" }}>
                  <span style={{ color: "var(--con-warning)" }}>نسيت كلمة المرور؟</span>
                </a>
              </div>
            </div>
          </div>
        ) : portal === "otp" ? (
          <div className="fll-portal-enter" style={{ width: "100%", maxWidth: "400px" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <button
                type="button"
                onClick={() => { goPortal("staff"); setOtp(""); setOtpSent(false); }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--con-text-secondary)",
                  cursor: "pointer",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: 0,
                  marginBottom: "1rem",
                }}
              >
                <ArrowLeft size={15} /> رجوع
              </button>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--con-text-primary)", marginBottom: "0.375rem" }}>
                التحقق الثنائي
              </h2>
              <p style={{ fontSize: "12px", color: "var(--con-text-muted)" }}>
                أدخل رمز التحقق المُرسل إلى {email}
              </p>
            </div>

            <div className="con-card" style={{ padding: "1.75rem" }}>
              <form onSubmit={handleOTPVerify} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <Smartphone size={16} style={{ color: "var(--con-text-muted)" }} />
                  <span style={{ fontSize: "13px", color: "var(--con-text-muted)" }}>رمز من 6 أرقام</span>
                </div>

                <OTPInput value={otp} onChange={setOtp} />

                {error && <ErrorBanner msg={error} />}
                {success && <SuccessBanner msg={success} />}

                <PrimaryBtn loading={loading} disabled={otp.length !== 6}>
                  تحقق
                </PrimaryBtn>

                <SecondaryBtn onClick={handleOTPResend} disabled={loading}>
                  إرسال رمز جديد
                </SecondaryBtn>
              </form>
            </div>
          </div>
        ) : null}

      </div>

      {/* Footer */}
      <footer style={{
        padding: "1.5rem",
        borderTop: "1px solid var(--con-border)",
        background: "var(--con-bg-elevated)",
        textAlign: "center",
      }}>
        <p style={{ fontSize: "12px", color: "var(--con-text-muted)", margin: 0, marginBottom: "0.5rem" }}>
          هل تحتاج مساعدة؟
        </p>
        <p style={{ fontSize: "12px", color: "var(--con-text-secondary)", margin: 0 }}>
          تواصل معنا:{" "}
          <a href="mailto:Support@fll.sa" style={{ color: "var(--con-brand)", textDecoration: "none" }}>
            Support@fll.sa
          </a>
        </p>
        <p style={{ fontSize: "11px", color: "var(--con-text-muted)", marginTop: "1rem", marginBottom: 0 }}>
          © {new Date().getFullYear()} First Line Logistics
        </p>
      </footer>
    </div>
  );
}
