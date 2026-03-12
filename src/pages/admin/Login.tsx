/**
 * صفحة تسجيل الدخول — لوحة إدارة فيرست لاين
 * Username/Password login only
 * OTP temporarily disabled — will be re-enabled later
 * Styled with .fll-console tokens — clean, professional, no gaming aesthetics
 */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/admin/auth";
import { supabase } from "@/lib/supabase";
import {
  Mail, Lock, Eye, EyeOff, LogIn, AlertCircle,
} from "lucide-react";

type Screen = "login" | "success";

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

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminLogin() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [screen, setScreen] = useState<Screen>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  function go(s: Screen) { setError(""); setScreen(s); }

  // ── Password login ──
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("أدخل البريد الإلكتروني"); return; }
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

          {/* ══ Screen: login ══ */}
          {screen === "login" && (
            <>
              <div style={{ marginBottom: "1.25rem" }}>
                <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--con-text-primary)", marginBottom: "0.25rem" }}>
                  تسجيل الدخول
                </h2>
                <p style={{ fontSize: "12px", color: "var(--con-text-muted)" }}>
                  أدخل بريدك الإلكتروني وكلمة المرور
                </p>
              </div>

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

                <ErrorBanner msg={error} />

                <PrimaryBtn loading={loading}>
                  <LogIn size={15} /> دخول
                </PrimaryBtn>
              </form>

              <div style={{ marginTop: "1rem", textAlign: "center" }}>
                <Link to="/courier/register" style={{ fontSize: "12px", color: "var(--con-text-muted)", textDecoration: "none" }}>
                  مندوب جديد؟ <span style={{ color: "var(--con-success)" }}>سجّل هنا</span>
                </Link>
              </div>
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
                <span style={{ fontSize: "24px" }}>✓</span>
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
