/**
 * صفحة تسجيل دخول السائقين — /login
 * تبويبان: تسجيل دخول | إنشاء حساب جديد
 * Midnight Operations theme + OTP verification via Lambda
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/admin/auth";
import { supabase } from "@/lib/supabase";
import { sendOtp, verifyOtp } from "@/lib/otp-service";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";

type Tab = "login" | "register";
type Screen = "form" | "otp" | "success" | "forgot" | "forgot-otp" | "reset-password";

export default function DriverLogin() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("login");
  const [screen, setScreen] = useState<Screen>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [otp, setOtp] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  function reset() { setError(""); setSuccess(""); }
  function go(s: Screen) { reset(); setScreen(s); }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("أدخل البريد الإلكتروني"); return; }
    if (!password) { setError("أدخل كلمة المرور"); return; }
    reset(); setLoading(true);

    const res = await signIn(email.trim(), password);
    if (res.error) { setError(res.error); setLoading(false); return; }

    setSuccess("تم التحقق. جارٍ إرسال رمز التحقق...");
    const otpRes = await sendOtp(email.trim(), "login");
    setLoading(false);
    if (otpRes.error) { setError(otpRes.error); return; }

    setSuccess("تم إرسال رمز التحقق إلى بريدك الإلكتروني");
    go("otp");
  }

  async function handleOTPVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) { setError("أدخل رمز التحقق الكامل (6 أرقام)"); return; }
    reset(); setLoading(true);
    const res = await verifyOtp(email.trim(), otp, "login");
    setLoading(false);
    if (res.error) { setError(res.error); return; }

    setSuccess("تم التحقق بنجاح!");
    go("success");
    setTimeout(() => {
      navigate("/courier/portal");
    }, 1200);
  }

  async function handleResend() {
    reset(); setLoading(true);
    const res = await sendOtp(email.trim(), "login");
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setSuccess("تم إرسال رمز جديد"); setOtp("");
  }

  async function handleForgotSend(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail.trim()) { setError("أدخل البريد الإلكتروني"); return; }
    reset(); setLoading(true);
    const otpRes = await sendOtp(resetEmail.trim(), "reset_password");
    setLoading(false);
    if (otpRes.error) { setError(otpRes.error); return; }
    setSuccess("تم إرسال رمز التحقق إلى بريدك الإلكتروني");
    go("forgot-otp");
  }

  async function handleForgotOTPVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) { setError("أدخل رمز التحقق الكامل (6 أرقام)"); return; }
    reset(); setLoading(true);
    const res = await verifyOtp(resetEmail.trim(), otp, "reset_password");
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setSuccess("تم التحقق. أدخل كلمة المرور الجديدة");
    go("reset-password");
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) { setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    reset(); setLoading(true);
    if (supabase) {
      const { error: resetError } = await supabase.auth.updateUser({ password: newPassword });
      setLoading(false);
      if (resetError) { setError("تعذّر تحديث كلمة المرور"); return; }
    } else { setLoading(false); }
    setSuccess("تم تحديث كلمة المرور بنجاح!");
    setTimeout(() => { go("form"); setNewPassword(""); setOtp(""); setResetEmail(""); }, 1500);
  }

  function switchTab(t: Tab) {
    if (t === "register") {
      navigate("/courier/register");
      return;
    }
    setTab(t); reset(); setScreen("form");
    setEmail(""); setPassword(""); setOtp("");
  }

  function handleOtpChange(index: number, val: string) {
    if (!/^\d*$/.test(val)) return;
    const arr = otp.padEnd(6, " ").split("");
    arr[index] = val;
    setOtp(arr.join("").replace(/ /g, "").slice(0, 6));
    if (val && index < 5) {
      const next = document.getElementById(`dotp-${index + 1}`);
      if (next) (next as HTMLInputElement).focus();
    }
  }

  // ── Styles ──
  const S = {
    page: {
      minHeight: "100vh",
      background: "#0b1622",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1.5rem",
      fontFamily: "'IBM Plex Sans Arabic', sans-serif",
      direction: "rtl" as const,
    },
    wrapper: { width: "100%", maxWidth: "420px" },
    logoWrap: { textAlign: "center" as const, marginBottom: "2rem" },
    logo: {
      width: "80px", height: "80px", objectFit: "contain" as const,
      borderRadius: "16px", margin: "0 auto 1rem", display: "block",
    },
    title: { fontSize: "20px", fontWeight: 700, color: "#e2e8f0", margin: "0 0 4px" },
    subtitle: { fontSize: "13px", color: "#7e8ca2", margin: 0 },
    card: {
      background: "rgba(15, 25, 40, 0.9)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "12px",
      padding: "2rem",
      backdropFilter: "blur(12px)",
    },
    tabs: {
      display: "flex", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)",
    },
    tab: (active: boolean) => ({
      flex: 1, padding: "10px", textAlign: "center" as const,
      fontSize: "14px", fontWeight: active ? 600 : 400,
      color: active ? "#c9a84c" : "#7e8ca2",
      background: "none", border: "none",
      borderBottom: active ? "2px solid #c9a84c" : "2px solid transparent",
      cursor: "pointer",
      fontFamily: "'IBM Plex Sans Arabic', sans-serif",
      transition: "all 0.2s",
    }),
    label: { display: "block", fontSize: "13px", fontWeight: 500, color: "#94a3b8", marginBottom: "6px" },
    inputWrap: { marginBottom: "1rem" },
    input: {
      width: "100%", padding: "10px 14px", fontSize: "14px",
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "8px", color: "#e2e8f0", outline: "none",
      fontFamily: "'IBM Plex Sans Arabic', sans-serif",
      boxSizing: "border-box" as const,
    },
    btn: {
      width: "100%", padding: "12px", fontSize: "15px", fontWeight: 600,
      background: "linear-gradient(135deg, #c9a84c, #b8963f)",
      color: "#0b1622", border: "none", borderRadius: "8px", cursor: "pointer",
      fontFamily: "'IBM Plex Sans Arabic', sans-serif",
    },
    btnDisabled: { opacity: 0.5, pointerEvents: "none" as const },
    btnSecondary: {
      width: "100%", padding: "10px", fontSize: "13px", fontWeight: 500,
      background: "transparent", color: "#7e8ca2",
      border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
      cursor: "pointer", fontFamily: "'IBM Plex Sans Arabic', sans-serif",
      marginTop: "10px",
    },
    error: {
      padding: "10px 14px", background: "rgba(239,68,68,0.1)",
      border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px",
      fontSize: "13px", color: "#ef4444", marginBottom: "1rem",
    },
    success: {
      padding: "10px 14px", background: "rgba(34,197,94,0.1)",
      border: "1px solid rgba(34,197,94,0.3)", borderRadius: "8px",
      fontSize: "13px", color: "#22c55e", marginBottom: "1rem",
    },
    eyeBtn: {
      position: "absolute" as const, insetInlineStart: "12px", top: "50%", transform: "translateY(-50%)",
      background: "none", border: "none", cursor: "pointer", color: "#7e8ca2",
      padding: 0, display: "flex",
    },
    otpBox: {
      display: "flex", gap: "10px", justifyContent: "center", marginBottom: "1.5rem",
      direction: "ltr" as const,
    },
    otpDigit: {
      width: "48px", height: "56px", textAlign: "center" as const, fontSize: "24px",
      fontWeight: 700, background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
      color: "#e2e8f0", outline: "none",
      fontFamily: "'IBM Plex Sans Arabic', sans-serif",
    },
    backBtn: {
      background: "none", border: "none", cursor: "pointer", color: "#7e8ca2",
      fontSize: "13px", display: "flex", alignItems: "center", gap: "6px",
      padding: 0, marginBottom: "1.25rem",
      fontFamily: "'IBM Plex Sans Arabic', sans-serif",
    },
    footer: { textAlign: "center" as const, marginTop: "1.5rem", fontSize: "11px", color: "#4a5568" },
  };

  return (
    <div style={S.page}>
      <div style={S.wrapper}>

        {/* Logo */}
        <div style={S.logoWrap}>
          <img
            src="/images/first_line_professional_english_1.png"
            alt="First Line Logistics"
            style={S.logo}
            onError={(e) => { (e.target as HTMLImageElement).src = "/images/logo.webp"; }}
          />
          <h1 style={S.title}>First Line Logistics</h1>
          <p style={S.subtitle}>نظام المناديب</p>
        </div>

        {/* Card */}
        <div style={S.card}>

          {/* Tabs */}
          {screen === "form" && (
            <div style={S.tabs}>
              <button style={S.tab(tab === "login")} onClick={() => switchTab("login")}>
                تسجيل الدخول
              </button>
              <button style={S.tab(tab === "register")} onClick={() => switchTab("register")}>
                حساب جديد
              </button>
            </div>
          )}

          {/* ══ Login Form ══ */}
          {screen === "form" && tab === "login" && (
            <form onSubmit={handleLogin}>
              <div style={S.inputWrap}>
                <label style={S.label}>البريد الإلكتروني</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="driver@email.com" autoComplete="email" autoFocus
                  style={S.input}
                />
              </div>

              <div style={S.inputWrap}>
                <label style={S.label}>كلمة المرور</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPass ? "text" : "password"} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" autoComplete="current-password"
                    style={{ ...S.input, paddingLeft: "40px" }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={S.eyeBtn}>
                    {showPass ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              {error && <div style={S.error}>{error}</div>}
              {success && <div style={S.success}>{success}</div>}

              <button type="submit" style={{ ...S.btn, ...(loading ? S.btnDisabled : {}) }} disabled={loading}>
                {loading ? "جارٍ التحميل..." : "تسجيل الدخول"}
              </button>

              <div style={{ marginTop: "1rem", textAlign: "center" }}>
                <button type="button" onClick={() => { go("forgot"); setResetEmail(email); setOtp(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#c9a84c", fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                  نسيت كلمة المرور؟
                </button>
              </div>
            </form>
          )}

          {/* ══ OTP Screen ══ */}
          {screen === "otp" && (
            <form onSubmit={handleOTPVerify}>
              <button type="button" onClick={() => { go("form"); setOtp(""); }} style={S.backBtn}>
                → رجوع
              </button>

              <div style={{ marginBottom: "1.25rem", textAlign: "center" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#e2e8f0", margin: "0 0 4px" }}>
                  التحقق الثنائي
                </h2>
                <p style={{ fontSize: "12px", color: "#7e8ca2", margin: 0 }}>
                  أدخل رمز التحقق المُرسل إلى {email}
                </p>
              </div>

              <div dir="ltr" style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
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

              {error && <div style={S.error}>{error}</div>}
              {success && <div style={S.success}>{success}</div>}

              <button
                type="submit"
                style={{ ...S.btn, ...(loading || otp.length !== 6 ? S.btnDisabled : {}) }}
                disabled={loading || otp.length !== 6}
              >
                {loading ? "جارٍ التحقق..." : "تحقق"}
              </button>

              <button type="button" onClick={handleResend} disabled={loading} style={S.btnSecondary}>
                إرسال رمز جديد
              </button>
            </form>
          )}

          {/* ══ Success Screen ══ */}
          {screen === "success" && (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{
                width: "56px", height: "56px", borderRadius: "50%",
                background: "rgba(34,197,94,0.15)", border: "2px solid #22c55e",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 1rem", fontSize: "28px",
              }}>
                ✓
              </div>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#e2e8f0", margin: "0 0 4px" }}>
                تم التحقق بنجاح
              </h2>
              <p style={{ fontSize: "12px", color: "#7e8ca2" }}>جارٍ تحويلك لبوابة المندوب...</p>
            </div>
          )}

          {/* ══ Forgot Password — Enter Email ══ */}
          {screen === "forgot" && (
            <form onSubmit={handleForgotSend}>
              <button type="button" onClick={() => go("form")} style={S.backBtn}>
                → رجوع لتسجيل الدخول
              </button>
              <div style={{ marginBottom: "1.25rem" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#e2e8f0", margin: "0 0 4px" }}>
                  نسيت كلمة المرور
                </h2>
                <p style={{ fontSize: "12px", color: "#7e8ca2", margin: 0 }}>
                  أدخل بريدك الإلكتروني وسنرسل لك رمز تحقق
                </p>
              </div>
              <div style={S.inputWrap}>
                <label style={S.label}>البريد الإلكتروني</label>
                <input
                  type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                  placeholder="driver@email.com" autoComplete="email" autoFocus
                  style={S.input}
                />
              </div>
              {error && <div style={S.error}>{error}</div>}
              {success && <div style={S.success}>{success}</div>}
              <button type="submit" style={{ ...S.btn, ...(loading ? S.btnDisabled : {}) }} disabled={loading}>
                {loading ? "جارٍ الإرسال..." : "إرسال رمز التحقق"}
              </button>
            </form>
          )}

          {/* ══ Forgot Password — Verify OTP ══ */}
          {screen === "forgot-otp" && (
            <form onSubmit={handleForgotOTPVerify}>
              <button type="button" onClick={() => { go("forgot"); setOtp(""); }} style={S.backBtn}>
                → رجوع
              </button>
              <div style={{ marginBottom: "1.25rem", textAlign: "center" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#e2e8f0", margin: "0 0 4px" }}>
                  التحقق من البريد
                </h2>
                <p style={{ fontSize: "12px", color: "#7e8ca2", margin: 0 }}>
                  أدخل رمز التحقق المُرسل إلى {resetEmail}
                </p>
              </div>
              <div dir="ltr" style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
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
              {error && <div style={S.error}>{error}</div>}
              {success && <div style={S.success}>{success}</div>}
              <button type="submit" style={{ ...S.btn, ...(loading || otp.length !== 6 ? S.btnDisabled : {}) }} disabled={loading || otp.length !== 6}>
                {loading ? "جارٍ التحقق..." : "تحقق"}
              </button>
            </form>
          )}

          {/* ══ Reset Password — New Password ══ */}
          {screen === "reset-password" && (
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: "1.25rem" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#e2e8f0", margin: "0 0 4px" }}>
                  كلمة مرور جديدة
                </h2>
                <p style={{ fontSize: "12px", color: "#7e8ca2", margin: 0 }}>
                  أدخل كلمة المرور الجديدة (6 أحرف على الأقل)
                </p>
              </div>
              <div style={S.inputWrap}>
                <label style={S.label}>كلمة المرور الجديدة</label>
                <input
                  type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••" autoComplete="new-password" autoFocus
                  style={S.input}
                />
              </div>
              {error && <div style={S.error}>{error}</div>}
              {success && <div style={S.success}>{success}</div>}
              <button type="submit" style={{ ...S.btn, ...(loading ? S.btnDisabled : {}) }} disabled={loading}>
                {loading ? "جارٍ التحديث..." : "تحديث كلمة المرور"}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div style={S.footer}>
          <p style={{ margin: "0 0 6px" }}>
            <a href="/unified-login" style={{ color: "#c9a84c", textDecoration: "none", fontSize: "12px" }}>
              دخول الموظفين
            </a>
          </p>
          <p style={{ margin: 0 }}>© {new Date().getFullYear()} First Line Logistics</p>
        </div>
      </div>
    </div>
  );
}
