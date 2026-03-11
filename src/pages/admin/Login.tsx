/**
 * صفحة تسجيل الدخول — لوحة إدارة فيرست لاين
 * Enterprise edition: Email OTP (primary) + Password (fallback)
 * Styled with .fll-console tokens — clean, professional, no gaming aesthetics
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/admin/auth";
import { supabase } from "@/lib/supabase";
import {
  Mail, Lock, Eye, EyeOff, ArrowRight,
  ShieldCheck, RefreshCw, LogIn, AlertCircle,
  KeyRound, CheckCircle2,
} from "lucide-react";

type Screen = "email" | "otp" | "password" | "success";

// ─── Shared sub-components ────────────────────────────────────────────────────

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

function InputField({
  label, id, type = "text", value, onChange, placeholder, autoComplete,
  rightSlot, autoFocus,
}: {
  label: string; id: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  autoComplete?: string; rightSlot?: React.ReactNode; autoFocus?: boolean;
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

function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button" onClick={onClick}
      className="con-btn-ghost"
      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
    >
      {children}
    </button>
  );
}

// ─── OTP digit boxes ──────────────────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
  }

  function handleChange(i: number, v: string) {
    const digit = v.replace(/\D/g, "").slice(-1);
    const arr = value.padEnd(6, " ").split("");
    arr[i] = digit || " ";
    const next = arr.join("").trimEnd();
    onChange(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) { onChange(pasted); refs.current[Math.min(pasted.length, 5)]?.focus(); }
    e.preventDefault();
  }

  return (
    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", direction: "ltr" }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text" inputMode="numeric" maxLength={1}
          value={value[i] && value[i] !== " " ? value[i] : ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          autoFocus={i === 0}
          style={{
            width: "44px", height: "52px",
            background: "var(--con-bg-elevated)",
            border: `1.5px solid ${value[i] && value[i] !== " " ? "var(--con-brand)" : "var(--con-border-strong)"}`,
            borderRadius: "var(--con-radius)",
            color: "var(--con-text-primary)",
            fontSize: "20px", fontWeight: 700, textAlign: "center",
            fontFamily: "var(--con-font-mono)",
            outline: "none",
            transition: "border-color 0.15s",
          }}
        />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminLogin() {
  const { signIn, signInWithOtp, verifyEmailOtp } = useAuth();
  const navigate = useNavigate();

  const [screen, setScreen] = useState<Screen>("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Email-OTP flow
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Password fallback
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function go(s: Screen) { setError(""); setScreen(s); }

  // ── Step 1: send OTP to email ──
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("أدخل البريد الإلكتروني"); return; }
    setError(""); setLoading(true);
    const res = await signInWithOtp(email.trim());
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setOtp("");
    go("otp");
    setCooldown(60);
  }

  // ── Step 2: verify OTP ──
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.replace(/\s/g, "");
    if (code.length < 6) { setError("أدخل رمز التحقق كاملاً (6 أرقام)"); return; }
    setError(""); setLoading(true);
    const res = await verifyEmailOtp(email.trim(), code);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    await redirectAfterAuth();
  }

  // ── Password fallback ──
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!password) { setError("أدخل كلمة المرور"); return; }
    setError(""); setLoading(true);
    const res = await signIn(email.trim(), password);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    await redirectAfterAuth();
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

  async function resendOtp() {
    if (cooldown > 0) return;
    await signInWithOtp(email.trim());
    setCooldown(60);
  }

  // ─────────────────────────────────────────────────────
  return (
    <div className="fll-console" style={{
      minHeight: "100vh",
      background: "var(--con-bg-app)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1.5rem",
      fontFamily: "var(--con-font-primary)",
    }} dir="rtl">

      {/* CSS for spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ width: "100%", maxWidth: "400px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: "48px", height: "48px",
            borderRadius: "var(--con-radius-md)",
            background: "var(--con-bg-elevated)",
            border: "1px solid var(--con-border-strong)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 0.875rem",
          }}>
            <img
              src="/images/first_line_professional_english_1.png"
              alt="FL"
              style={{ width: "34px", height: "34px", objectFit: "contain" }}
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                el.style.display = "none";
                (el.parentElement as HTMLElement).innerHTML =
                  '<span style="font-size:15px;font-weight:800;color:var(--con-brand)">FL</span>';
              }}
            />
          </div>
          <h1 style={{ fontSize: "16px", fontWeight: 700, color: "var(--con-text-primary)", marginBottom: "0.25rem" }}>
            First Line Logistics
          </h1>
          <p style={{ fontSize: "12px", color: "var(--con-text-muted)" }}>لوحة الإدارة التشغيلية</p>
        </div>

        {/* Card */}
        <div className="con-card" style={{ padding: "1.75rem" }}>

          {/* ══ Screen: email ══ */}
          {screen === "email" && (
            <>
              <div style={{ marginBottom: "1.25rem" }}>
                <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--con-text-primary)", marginBottom: "0.25rem" }}>
                  تسجيل الدخول
                </h2>
                <p style={{ fontSize: "12px", color: "var(--con-text-muted)" }}>
                  سيُرسَل رمز تحقق إلى بريدك الإلكتروني
                </p>
              </div>

              <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <InputField
                  label="البريد الإلكتروني"
                  id="email" type="email"
                  value={email} onChange={setEmail}
                  placeholder="admin@fll.sa"
                  autoComplete="email"
                  autoFocus
                />
                <ErrorBanner msg={error} />
                <PrimaryBtn loading={loading}>
                  <Mail size={15} /> إرسال رمز التحقق
                </PrimaryBtn>
              </form>

              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--con-border-default)", textAlign: "center" }}>
                <button
                  type="button"
                  onClick={() => { setError(""); go("password"); }}
                  style={{ fontSize: "12px", color: "var(--con-brand)", background: "none", border: "none", cursor: "pointer" }}
                >
                  تسجيل الدخول بكلمة المرور بدلاً من ذلك
                </button>
              </div>
              <div style={{ marginTop: "0.625rem", textAlign: "center" }}>
                <Link to="/courier/register" style={{ fontSize: "12px", color: "var(--con-text-muted)", textDecoration: "none" }}>
                  مندوب جديد؟ <span style={{ color: "var(--con-success)" }}>سجّل هنا</span>
                </Link>
              </div>
            </>
          )}

          {/* ══ Screen: OTP ══ */}
          {screen === "otp" && (
            <>
              <button
                type="button" onClick={() => go("email")}
                style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "12px", color: "var(--con-text-muted)", background: "none", border: "none", cursor: "pointer", marginBottom: "1.25rem", padding: 0 }}
              >
                <ArrowRight size={14} /> تغيير البريد الإلكتروني
              </button>

              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <div style={{
                  width: "48px", height: "48px",
                  background: "var(--con-brand-subtle)",
                  border: "1px solid var(--con-brand-border)",
                  borderRadius: "var(--con-radius-md)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 0.875rem",
                }}>
                  <ShieldCheck size={22} style={{ color: "var(--con-brand)" }} />
                </div>
                <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--con-text-primary)", marginBottom: "0.25rem" }}>
                  أدخل رمز التحقق
                </h2>
                <p style={{ fontSize: "12px", color: "var(--con-text-muted)" }}>
                  أُرسل رمز مكوّن من 6 أرقام إلى
                </p>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--con-brand)", marginTop: "0.25rem" }}>
                  {email}
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <OtpInput value={otp} onChange={setOtp} />
                <ErrorBanner msg={error} />
                <PrimaryBtn loading={loading} disabled={otp.replace(/\s/g, "").length < 6}>
                  <ShieldCheck size={15} /> تأكيد الدخول
                </PrimaryBtn>
              </form>

              {/* Resend + password fallback */}
              <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                {cooldown > 0 ? (
                  <p style={{ fontSize: "12px", color: "var(--con-text-muted)" }}>
                    إعادة الإرسال بعد{" "}
                    <span style={{ fontFamily: "var(--con-font-mono)", color: "var(--con-brand)" }}>{cooldown}s</span>
                  </p>
                ) : (
                  <button
                    type="button" onClick={resendOtp}
                    style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "12px", color: "var(--con-brand)", background: "none", border: "none", cursor: "pointer" }}
                  >
                    <RefreshCw size={12} /> إعادة إرسال الرمز
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setError(""); go("password"); }}
                  style={{ fontSize: "12px", color: "var(--con-text-muted)", background: "none", border: "none", cursor: "pointer" }}
                >
                  تسجيل الدخول بكلمة المرور
                </button>
              </div>
            </>
          )}

          {/* ══ Screen: password ══ */}
          {screen === "password" && (
            <>
              <button
                type="button" onClick={() => go("email")}
                style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "12px", color: "var(--con-text-muted)", background: "none", border: "none", cursor: "pointer", marginBottom: "1.25rem", padding: 0 }}
              >
                <ArrowRight size={14} /> رجوع
              </button>

              <div style={{ marginBottom: "1.25rem" }}>
                <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--con-text-primary)", marginBottom: "0.25rem" }}>
                  تسجيل الدخول بكلمة المرور
                </h2>
                <p style={{ fontSize: "12px", color: "var(--con-text-muted)" }}>
                  {email || "أدخل بياناتك"}
                </p>
              </div>

              <form onSubmit={handlePasswordLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {!email && (
                  <InputField
                    label="البريد الإلكتروني" id="pw-email" type="email"
                    value={email} onChange={setEmail}
                    placeholder="admin@fll.sa" autoComplete="email"
                  />
                )}
                <InputField
                  label="كلمة المرور" id="password"
                  type={showPass ? "text" : "password"}
                  value={password} onChange={setPassword}
                  placeholder="••••••••" autoComplete="current-password"
                  autoFocus
                  rightSlot={
                    <button
                      type="button" onClick={() => setShowPass(!showPass)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--con-text-muted)", display: "flex", padding: 0 }}
                    >
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                />

                <ErrorBanner msg={error} />

                <PrimaryBtn loading={loading}>
                  <LogIn size={15} /> دخول
                </PrimaryBtn>

                <GhostBtn onClick={() => { setError(""); go("email"); }}>
                  <KeyRound size={14} /> استخدام رمز التحقق عبر البريد
                </GhostBtn>
              </form>
            </>
          )}

          {/* ══ Screen: success ══ */}
          {screen === "success" && (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{
                width: "52px", height: "52px",
                background: "var(--con-success-subtle)",
                border: "1px solid var(--con-success)",
                borderRadius: "var(--con-radius-md)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 1rem",
              }}>
                <CheckCircle2 size={26} style={{ color: "var(--con-success)" }} />
              </div>
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--con-text-primary)", marginBottom: "0.375rem" }}>
                تم التحقق بنجاح
              </h2>
              <p style={{ fontSize: "12px", color: "var(--con-text-muted)" }}>جارٍ تحويلك...</p>
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", fontSize: "11px", color: "var(--con-text-muted)", marginTop: "1.25rem" }}>
          © {new Date().getFullYear()} First Line Logistics — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
