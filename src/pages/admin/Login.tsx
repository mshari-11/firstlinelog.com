/**
 * صفحة تسجيل الدخول — لوحة إدارة فيرست لاين
 * AWS Cognito: اسم المستخدم + كلمة المرور → رمز التحقق (EMAIL_OTP) → لوحة التحكم
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/admin/auth";
import type { CognitoLoginResult } from "@/lib/admin/auth";
import {
  Lock, Eye, EyeOff, ArrowRight, User,
  ShieldCheck, RefreshCw, LogIn, AlertCircle,
  CheckCircle2, KeyRound,
} from "lucide-react";

type Screen = "credentials" | "otp" | "new-password" | "success";

/* ─── Inline keyframes (no external CSS needed) ─────────────────────────── */
const keyframesCSS = `
@keyframes fll-spin { to { transform: rotate(360deg); } }
@keyframes fll-fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fll-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes fll-shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-4px); } 40%, 80% { transform: translateX(4px); } }
`;

/* ─── Shared atoms ──────────────────────────────────────────────────────── */

function ErrorBanner({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div
      style={{
        display: "flex", alignItems: "flex-start", gap: "0.5rem",
        padding: "0.625rem 0.875rem",
        background: "var(--con-danger-subtle)",
        border: "1px solid var(--con-danger)",
        borderRadius: "var(--con-radius)",
        fontSize: "13px", color: "var(--con-danger)",
        animation: "fll-shake 0.35s ease-out",
      }}
    >
      <AlertCircle size={15} style={{ flexShrink: 0, marginTop: "1px" }} />
      <span>{msg}</span>
    </div>
  );
}

function Field({
  label, id, type = "text", value, onChange, placeholder,
  autoComplete, icon, rightSlot, autoFocus, dir,
}: {
  label: string; id: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  autoComplete?: string; icon?: React.ReactNode;
  rightSlot?: React.ReactNode; autoFocus?: boolean; dir?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <label htmlFor={id} style={{
        fontSize: "13px", fontWeight: 500,
        color: "var(--con-text-secondary)", letterSpacing: "-0.01em",
      }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        {icon && (
          <div style={{
            position: "absolute", right: "0.75rem", top: "50%",
            transform: "translateY(-50%)", color: "var(--con-text-muted)",
            pointerEvents: "none", display: "flex",
          }}>
            {icon}
          </div>
        )}
        <input
          id={id} type={type} value={value} autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} autoFocus={autoFocus}
          dir={dir}
          className="con-input"
          style={{
            width: "100%",
            paddingRight: icon ? "2.5rem" : undefined,
            paddingLeft: rightSlot ? "2.5rem" : undefined,
          }}
        />
        {rightSlot && (
          <div style={{
            position: "absolute", left: "0.625rem", top: "50%",
            transform: "translateY(-50%)", display: "flex",
          }}>
            {rightSlot}
          </div>
        )}
      </div>
    </div>
  );
}

function Btn({
  children, loading, disabled, onClick, type = "submit", variant = "primary",
}: {
  children: React.ReactNode; loading?: boolean; disabled?: boolean;
  onClick?: () => void; type?: "submit" | "button";
  variant?: "primary" | "ghost";
}) {
  const cls = variant === "primary" ? "con-btn-primary" : "con-btn-ghost";
  return (
    <button
      type={type} disabled={loading || disabled} onClick={onClick}
      className={cls}
      style={{
        width: "100%", display: "flex", alignItems: "center",
        justifyContent: "center", gap: "0.5rem",
        opacity: (loading || disabled) ? 0.55 : 1,
        transition: "opacity 0.15s",
      }}
    >
      {loading ? (
        <>
          <div style={{
            width: "14px", height: "14px",
            border: "2px solid rgba(255,255,255,0.25)",
            borderTopColor: "#fff", borderRadius: "50%",
            animation: "fll-spin 0.6s linear infinite",
          }} />
          <span>جارٍ التحميل...</span>
        </>
      ) : children}
    </button>
  );
}

/* ─── OTP digit boxes ───────────────────────────────────────────────────── */

function OtpInput({ value, onChange, error }: {
  value: string; onChange: (v: string) => void; error?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKey = useCallback((i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
  }, [value]);

  const handleChange = useCallback((i: number, v: string) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    const arr = value.padEnd(6, " ").split("");
    arr[i] = digit || " ";
    const next = arr.join("").trimEnd();
    onChange(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
  }, [value, onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) { onChange(pasted); refs.current[Math.min(pasted.length, 5)]?.focus(); }
    e.preventDefault();
  }, [onChange]);

  const filled = (i: number) => value[i] && value[i] !== " ";

  return (
    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", direction: "ltr" }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text" inputMode="numeric" maxLength={1}
          value={filled(i) ? value[i] : ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          autoFocus={i === 0}
          style={{
            width: "46px", height: "54px",
            background: "var(--con-bg-elevated)",
            border: `1.5px solid ${
              error ? "var(--con-danger)" :
              filled(i) ? "var(--con-brand)" : "var(--con-border-strong)"
            }`,
            borderRadius: "var(--con-radius)",
            color: "var(--con-text-primary)",
            fontSize: "22px", fontWeight: 700, textAlign: "center",
            fontFamily: "var(--con-font-mono)",
            outline: "none",
            transition: "border-color 0.15s, box-shadow 0.15s",
            boxShadow: filled(i) ? "0 0 0 2px var(--con-brand-subtle)" : "none",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--con-brand)";
            e.currentTarget.style.boxShadow = "0 0 0 3px var(--con-brand-subtle)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = filled(i) ? "var(--con-brand)" : "var(--con-border-strong)";
            e.currentTarget.style.boxShadow = filled(i) ? "0 0 0 2px var(--con-brand-subtle)" : "none";
          }}
        />
      ))}
    </div>
  );
}

/* ─── Screen transition wrapper ─────────────────────────────────────────── */
function ScreenWrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ animation: "fll-fadein 0.25s ease-out" }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export default function AdminLogin() {
  const { cognitoLogin, cognitoVerifyOtp, user } = useAuth();
  const navigate = useNavigate();

  const [screen, setScreen] = useState<Screen>("credentials");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Credentials
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  // OTP state
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [mfaSession, setMfaSession] = useState("");
  const [mfaChallenge, setMfaChallenge] = useState<string>("EMAIL_OTP");
  const [otpMessage, setOtpMessage] = useState("");

  // New password (for NEW_PASSWORD_REQUIRED challenge)
  const [newPassword, setNewPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      if (user.role === "courier") navigate("/courier/portal", { replace: true });
      else navigate("/admin-panel/dashboard", { replace: true });
    }
  }, [user, navigate]);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function go(s: Screen) { setError(""); setScreen(s); }

  /* ── Step 1: Login with username + password ── */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const u = username.trim();
    const p = password;
    if (!u) { setError("أدخل اسم المستخدم أو البريد الإلكتروني"); return; }
    if (!p) { setError("أدخل كلمة المرور"); return; }

    setError(""); setLoading(true);
    const res: CognitoLoginResult = await cognitoLogin(u, p);
    setLoading(false);

    if (res.error) { setError(res.error); return; }

    // MFA challenge → go to OTP screen
    if (res.challenge === "EMAIL_OTP" || res.challenge === "SMS_MFA") {
      setMfaSession(res.session || "");
      setMfaChallenge(res.challenge);
      setOtpMessage(res.message || "تم إرسال رمز التحقق");
      setOtp("");
      go("otp");
      setCooldown(60);
      return;
    }

    // NEW_PASSWORD_REQUIRED
    if (res.challenge === "NEW_PASSWORD_REQUIRED") {
      setMfaSession(res.session || "");
      go("new-password");
      return;
    }

    // Direct login (no MFA) — tokens already stored by auth context
    if (res.token) {
      go("success");
      setTimeout(() => redirectAfterAuth(res), 800);
    }
  }

  /* ── Step 2: Verify OTP ── */
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.replace(/\s/g, "");
    if (code.length < 6) { setError("أدخل رمز التحقق كاملاً (6 أرقام)"); return; }

    setError(""); setLoading(true);
    const res = await cognitoVerifyOtp(username.trim(), code, mfaSession, mfaChallenge);
    setLoading(false);

    if (res.error) { setError(res.error); return; }

    if (res.token) {
      go("success");
      setTimeout(() => redirectAfterAuth(res), 800);
    }
  }

  /* ── Resend OTP: re-login to trigger new challenge ── */
  async function resendOtp() {
    if (cooldown > 0) return;
    setError(""); setLoading(true);
    const res = await cognitoLogin(username.trim(), password);
    setLoading(false);

    if (res.error) { setError(res.error); return; }
    if (res.session) {
      setMfaSession(res.session);
      setOtp("");
      setCooldown(60);
    }
  }

  function redirectAfterAuth(res: CognitoLoginResult) {
    const groups = res.user?.groups || [];
    if (groups.includes("courier") || groups.includes("driver")) {
      navigate("/courier/portal", { replace: true });
    } else {
      navigate("/admin-panel/dashboard", { replace: true });
    }
  }

  /* ═══ RENDER ═══════════════════════════════════════════════════════════ */
  return (
    <div
      className="fll-console"
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "var(--con-bg-app)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1.5rem",
        fontFamily: "var(--con-font-primary)",
        position: "relative", overflow: "hidden",
      }}
    >
      <style>{keyframesCSS}</style>

      {/* Subtle ambient glow */}
      <div style={{
        position: "absolute", top: "-120px", left: "50%", transform: "translateX(-50%)",
        width: "500px", height: "500px",
        background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: "400px", position: "relative", zIndex: 1 }}>

        {/* ── Logo block ── */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: "52px", height: "52px",
            borderRadius: "var(--con-radius-md)",
            background: "var(--con-bg-elevated)",
            border: "1px solid var(--con-border-strong)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 0.875rem",
            boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
          }}>
            <img
              src="/images/first_line_professional_english_1.png"
              alt="FL"
              style={{ width: "36px", height: "36px", objectFit: "contain" }}
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                el.style.display = "none";
                (el.parentElement as HTMLElement).innerHTML =
                  '<span style="font-size:16px;font-weight:800;color:var(--con-brand);letter-spacing:-0.5px">FL</span>';
              }}
            />
          </div>
          <h1 style={{
            fontSize: "17px", fontWeight: 700,
            color: "var(--con-text-primary)",
            marginBottom: "0.25rem", letterSpacing: "-0.02em",
          }}>
            First Line Logistics
          </h1>
          <p style={{ fontSize: "12px", color: "var(--con-text-muted)" }}>
            لوحة الإدارة التشغيلية
          </p>
        </div>

        {/* ── Card ── */}
        <div className="con-card" style={{
          padding: "1.75rem",
          boxShadow: "var(--con-shadow-panel)",
        }}>

          {/* ══════════════ CREDENTIALS SCREEN ══════════════ */}
          {screen === "credentials" && (
            <ScreenWrap>
              <div style={{ marginBottom: "1.25rem" }}>
                <h2 style={{
                  fontSize: "15px", fontWeight: 700,
                  color: "var(--con-text-primary)", marginBottom: "0.25rem",
                }}>
                  تسجيل الدخول
                </h2>
                <p style={{ fontSize: "12px", color: "var(--con-text-muted)" }}>
                  أدخل بيانات حسابك للوصول إلى لوحة التحكم
                </p>
              </div>

              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <Field
                  label="اسم المستخدم أو البريد الإلكتروني"
                  id="username" type="text"
                  value={username} onChange={setUsername}
                  placeholder="admin@fll.sa"
                  autoComplete="username"
                  icon={<User size={16} />}
                  autoFocus
                  dir="ltr"
                />

                <Field
                  label="كلمة المرور"
                  id="password"
                  type={showPass ? "text" : "password"}
                  value={password} onChange={setPassword}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  icon={<Lock size={16} />}
                  dir="ltr"
                  rightSlot={
                    <button
                      type="button" onClick={() => setShowPass(!showPass)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--con-text-muted)", display: "flex", padding: 0,
                      }}
                      tabIndex={-1}
                    >
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                />

                <ErrorBanner msg={error} />

                <Btn loading={loading}>
                  <LogIn size={15} /> تسجيل الدخول
                </Btn>
              </form>

              {/* Footer links */}
              <div style={{
                marginTop: "1rem", paddingTop: "1rem",
                borderTop: "1px solid var(--con-border-default)",
                textAlign: "center",
              }}>
                <Link
                  to="/courier/register"
                  style={{ fontSize: "12px", color: "var(--con-text-muted)", textDecoration: "none" }}
                >
                  مندوب جديد؟{" "}
                  <span style={{ color: "var(--con-success)", fontWeight: 600 }}>سجّل هنا</span>
                </Link>
              </div>
            </ScreenWrap>
          )}

          {/* ══════════════ OTP SCREEN ══════════════ */}
          {screen === "otp" && (
            <ScreenWrap>
              <button
                type="button"
                onClick={() => { go("credentials"); setPassword(""); }}
                style={{
                  display: "flex", alignItems: "center", gap: "0.375rem",
                  fontSize: "12px", color: "var(--con-text-muted)",
                  background: "none", border: "none", cursor: "pointer",
                  marginBottom: "1.25rem", padding: 0,
                }}
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
                <h2 style={{
                  fontSize: "15px", fontWeight: 700,
                  color: "var(--con-text-primary)", marginBottom: "0.25rem",
                }}>
                  أدخل رمز التحقق
                </h2>
                <p style={{ fontSize: "12px", color: "var(--con-text-muted)", marginBottom: "0.25rem" }}>
                  {otpMessage || "أُرسل رمز مكوّن من 6 أرقام إلى بريدك"}
                </p>
                <p style={{
                  fontSize: "13px", fontWeight: 600,
                  color: "var(--con-brand)",
                  fontFamily: "var(--con-font-mono)",
                  direction: "ltr", display: "inline-block",
                }}>
                  {username}
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <OtpInput value={otp} onChange={setOtp} error={!!error} />
                <ErrorBanner msg={error} />
                <Btn loading={loading} disabled={otp.replace(/\s/g, "").length < 6}>
                  <ShieldCheck size={15} /> تأكيد الدخول
                </Btn>
              </form>

              {/* Resend */}
              <div style={{
                marginTop: "1rem", display: "flex", flexDirection: "column",
                alignItems: "center", gap: "0.5rem",
              }}>
                {cooldown > 0 ? (
                  <p style={{ fontSize: "12px", color: "var(--con-text-muted)" }}>
                    إعادة الإرسال بعد{" "}
                    <span style={{
                      fontFamily: "var(--con-font-mono)",
                      color: "var(--con-brand)", fontWeight: 600,
                    }}>
                      {cooldown}s
                    </span>
                  </p>
                ) : (
                  <button
                    type="button" onClick={resendOtp}
                    disabled={loading}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.375rem",
                      fontSize: "12px", color: "var(--con-brand)",
                      background: "none", border: "none", cursor: "pointer",
                      opacity: loading ? 0.5 : 1,
                    }}
                  >
                    <RefreshCw size={12} /> إعادة إرسال الرمز
                  </button>
                )}
              </div>
            </ScreenWrap>
          )}

          {/* ══════════════ NEW PASSWORD SCREEN ══════════════ */}
          {screen === "new-password" && (
            <ScreenWrap>
              <button
                type="button"
                onClick={() => { go("credentials"); setPassword(""); }}
                style={{
                  display: "flex", alignItems: "center", gap: "0.375rem",
                  fontSize: "12px", color: "var(--con-text-muted)",
                  background: "none", border: "none", cursor: "pointer",
                  marginBottom: "1.25rem", padding: 0,
                }}
              >
                <ArrowRight size={14} /> رجوع
              </button>

              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <div style={{
                  width: "48px", height: "48px",
                  background: "var(--con-warning-subtle)",
                  border: "1px solid var(--con-warning)",
                  borderRadius: "var(--con-radius-md)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 0.875rem",
                }}>
                  <KeyRound size={22} style={{ color: "var(--con-warning)" }} />
                </div>
                <h2 style={{
                  fontSize: "15px", fontWeight: 700,
                  color: "var(--con-text-primary)", marginBottom: "0.25rem",
                }}>
                  يجب تغيير كلمة المرور
                </h2>
                <p style={{ fontSize: "12px", color: "var(--con-text-muted)" }}>
                  أدخل كلمة مرور جديدة للمتابعة
                </p>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newPassword || newPassword.length < 8) {
                    setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
                    return;
                  }
                  setError("أمر تغيير كلمة المرور غير مدعوم حالياً. تواصل مع مدير النظام.");
                }}
                style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
              >
                <Field
                  label="كلمة المرور الجديدة"
                  id="new-password"
                  type={showNewPass ? "text" : "password"}
                  value={newPassword} onChange={setNewPassword}
                  placeholder="8 أحرف على الأقل"
                  autoComplete="new-password"
                  icon={<Lock size={16} />}
                  dir="ltr"
                  autoFocus
                  rightSlot={
                    <button
                      type="button" onClick={() => setShowNewPass(!showNewPass)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--con-text-muted)", display: "flex", padding: 0,
                      }}
                      tabIndex={-1}
                    >
                      {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                />

                <ErrorBanner msg={error} />

                <Btn loading={loading}>
                  <KeyRound size={15} /> تحديث كلمة المرور
                </Btn>
              </form>
            </ScreenWrap>
          )}

          {/* ══════════════ SUCCESS SCREEN ══════════════ */}
          {screen === "success" && (
            <ScreenWrap>
              <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                <div style={{
                  width: "56px", height: "56px",
                  background: "var(--con-success-subtle)",
                  border: "1px solid var(--con-success)",
                  borderRadius: "var(--con-radius-md)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 1rem",
                }}>
                  <CheckCircle2 size={28} style={{ color: "var(--con-success)" }} />
                </div>
                <h2 style={{
                  fontSize: "15px", fontWeight: 700,
                  color: "var(--con-text-primary)", marginBottom: "0.375rem",
                }}>
                  تم التحقق بنجاح
                </h2>
                <p style={{
                  fontSize: "12px", color: "var(--con-text-muted)",
                  animation: "fll-pulse 1.2s ease-in-out infinite",
                }}>
                  جارٍ تحويلك إلى لوحة التحكم...
                </p>
              </div>
            </ScreenWrap>
          )}
        </div>

        {/* ── Copyright ── */}
        <p style={{
          textAlign: "center", fontSize: "11px",
          color: "var(--con-text-muted)", marginTop: "1.25rem",
        }}>
          &copy; {new Date().getFullYear()} First Line Logistics — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
