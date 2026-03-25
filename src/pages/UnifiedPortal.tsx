/**
 * صفحة تسجيل الدخول الموحدة — /unified-login
 */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/admin/auth";
import { Lock, User, Eye, EyeOff, Mail } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://djebhztfewjfyyoortvv.supabase.co";

type Screen = "login" | "forgot" | "forgot-otp" | "reset-password";

const NAV_LINKS = [
  { label: "الرئيسية", href: "/" },
  { label: "من نحن", href: "/about" },
  { label: "خدماتنا", href: "/services" },
  { label: "الأخبار", href: "/news" },
  { label: "المستثمرين", href: "/investors" },
  { label: "اتصل بنا", href: "/contact" },
];

export default function UnifiedPortal() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [screen, setScreen] = useState<Screen>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetUserId, setResetUserId] = useState("");

  function go(s: Screen) { setError(""); setSuccess(""); setScreen(s); }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("أدخل البريد الإلكتروني"); return; }
    if (!password) { setError("أدخل كلمة المرور"); return; }
    setError(""); setLoading(true);

    const res = await signIn(email.trim(), password);
    setLoading(false);
    if (res.error) { setError(res.error); return; }

    navigate("/admin-panel/dashboard");
  }

  async function handleForgotSend(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail.trim()) { setError("أدخل البريد الإلكتروني"); return; }
    setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim(), purpose: "password_reset" }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok || data.error) { setError(data.error || "تعذّر إرسال رمز التحقق"); return; }
      setSuccess("تم إرسال رمز التحقق إلى بريدك الإلكتروني");
      go("forgot-otp");
    } catch { setLoading(false); setError("تعذّر الاتصال بالخادم"); }
  }

  async function handleForgotOTPVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) { setError("أدخل رمز التحقق الكامل (6 أرقام)"); return; }
    setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim(), otp_code: otp, purpose: "password_reset" }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok || !data.success) { setError(data.error || "رمز التحقق غير صحيح"); return; }
      setResetUserId(data.user_id);
      go("reset-password");
    } catch { setLoading(false); setError("تعذّر الاتصال بالخادم"); }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) { setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: resetUserId, password: newPassword }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok || !data.success) { setError(data.error || "فشل تحديث كلمة المرور"); return; }
      setSuccess("تم تحديث كلمة المرور بنجاح!");
      setTimeout(() => { go("login"); setNewPassword(""); setOtp(""); setResetEmail(""); setResetUserId(""); }, 1500);
    } catch { setLoading(false); setError("تعذّر الاتصال بالخادم"); }
  }

  function handleOtpChange(index: number, val: string) {
    if (!/^\d*$/.test(val)) return;
    const arr = otp.padEnd(6, " ").split("");
    arr[index] = val;
    const newOtp = arr.join("").replace(/ /g, "").slice(0, 6);
    setOtp(newOtp);
    if (val && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      if (next) (next as HTMLInputElement).focus();
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fb", fontFamily: "'IBM Plex Sans Arabic', sans-serif", direction: "rtl" }}>

      {/* ── Navigation Bar ── */}
      <nav style={{
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
        padding: "0 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "64px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}>
            <img
              src="/images/first_line_professional_english_1.png"
              alt="First Line Logistics"
              style={{ height: "40px", objectFit: "contain" }}
              onError={(e) => { (e.target as HTMLImageElement).src = "/images/logo.webp"; }}
            />
          </Link>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                style={{ fontSize: "14px", color: "#374151", textDecoration: "none", fontWeight: 500 }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link to="/unified-login" style={{
            padding: "6px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: 600,
            background: "#1e3a5f", color: "#fff", textDecoration: "none",
            display: "flex", alignItems: "center", gap: "6px",
          }}>
            <Lock size={13} /> للموظفين
          </Link>
          <Link to="/login" style={{
            padding: "6px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: 500,
            background: "#f3f4f6", color: "#374151", textDecoration: "none", border: "1px solid #d1d5db",
            display: "flex", alignItems: "center", gap: "6px",
          }}>
            <User size={13} /> نظام السائقين
          </Link>
        </div>
      </nav>

      {/* ── Page Content ── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "3rem 1.5rem" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <img
            src="/images/first_line_professional_english_1.png"
            alt="First Line Logistics"
            style={{ height: "80px", objectFit: "contain", marginBottom: "1rem" }}
            onError={(e) => { (e.target as HTMLImageElement).src = "/images/logo.webp"; }}
          />
          <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#1e3a5f", margin: "0 0 0.75rem", letterSpacing: "1px" }}>
            FIRST LINE LOGISTICS PORTAL
          </h1>
          <div style={{
            display: "inline-block", padding: "6px 20px", borderRadius: "8px",
            border: "2px solid #e11d48", color: "#e11d48", fontSize: "14px", fontWeight: 700,
          }}>
            النظام الإداري الداخلي
          </div>
        </div>

        {/* Card */}
        <div style={{
          width: "100%", maxWidth: "440px",
          background: "#fff", borderRadius: "12px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          padding: "2rem",
        }}>

          {/* ══ Login Screen ══ */}
          {screen === "login" && (
            <form onSubmit={handleLogin}>
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "50%", margin: "0 auto 0.75rem",
                  background: "#f0f4f8", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <User size={20} color="#64748b" />
                </div>
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: "0 0 4px" }}>
                  تسجيل الدخول
                </h2>
                <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                  أدخل بيانات الدخول الخاصة بك
                </p>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#475569", marginBottom: "6px" }}>
                  اسم المستخدم
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="M.Z@FLL.SA" autoComplete="email" autoFocus
                    style={{
                      width: "100%", padding: "10px 14px 10px 40px", fontSize: "14px",
                      background: "#fff", border: "1px solid #d1d5db", borderRadius: "8px",
                      color: "#1e293b", outline: "none", boxSizing: "border-box",
                      fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                    }}
                  />
                  <User size={16} color="#94a3b8" style={{ position: "absolute", insetInlineStart: "12px", top: "50%", transform: "translateY(-50%)" }} />
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#475569", marginBottom: "6px" }}>
                  كلمة المرور
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPass ? "text" : "password"} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" autoComplete="current-password"
                    style={{
                      width: "100%", padding: "10px 14px 10px 40px", fontSize: "14px",
                      background: "#fff", border: "1px solid #d1d5db", borderRadius: "8px",
                      color: "#1e293b", outline: "none", boxSizing: "border-box",
                      fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                    }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{
                    position: "absolute", insetInlineStart: "12px", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex",
                  }}>
                    {showPass ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{
                  padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca",
                  borderRadius: "8px", fontSize: "13px", color: "#dc2626", marginBottom: "1rem",
                  display: "flex", alignItems: "center", gap: "8px",
                }}>
                  <span style={{ fontSize: "16px" }}>&#9888;</span> {error}
                </div>
              )}
              {success && (
                <div style={{
                  padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0",
                  borderRadius: "8px", fontSize: "13px", color: "#16a34a", marginBottom: "1rem",
                }}>
                  {success}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width: "100%", padding: "12px", fontSize: "15px", fontWeight: 600,
                background: "#1e3a5f", color: "#fff", border: "none", borderRadius: "8px",
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
                fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}>
                {loading ? "جارٍ التحميل..." : <><Lock size={15} /> تسجيل الدخول</>}
              </button>

              <div style={{ marginTop: "1rem", textAlign: "center" }}>
                <button type="button" onClick={() => { go("forgot"); setResetEmail(email); setOtp(""); }} style={{
                  background: "none", border: "none", cursor: "pointer", fontSize: "13px",
                  color: "#64748b", fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                  display: "inline-flex", alignItems: "center", gap: "4px",
                }}>
                  <Lock size={12} /> نسيت كلمة المرور؟
                </button>
              </div>
            </form>
          )}

          {/* ══ Forgot Password — Enter Email ══ */}
          {screen === "forgot" && (
            <form onSubmit={handleForgotSend}>
              <button type="button" onClick={() => go("login")} style={{
                background: "none", border: "none", cursor: "pointer", color: "#64748b",
                fontSize: "13px", display: "flex", alignItems: "center", gap: "6px",
                padding: 0, marginBottom: "1.25rem", fontFamily: "'IBM Plex Sans Arabic', sans-serif",
              }}>
                &larr; رجوع لتسجيل الدخول
              </button>
              <div style={{ marginBottom: "1.25rem" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: "0 0 4px" }}>
                  نسيت كلمة المرور
                </h2>
                <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                  أدخل بريدك الإلكتروني وسنرسل لك رمز تحقق
                </p>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#475569", marginBottom: "6px" }}>
                  البريد الإلكتروني
                </label>
                <input
                  type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                  placeholder="employee@fll.sa" autoComplete="email" autoFocus
                  style={{
                    width: "100%", padding: "10px 14px", fontSize: "14px",
                    background: "#fff", border: "1px solid #d1d5db", borderRadius: "8px",
                    color: "#1e293b", outline: "none", boxSizing: "border-box",
                    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                  }}
                />
              </div>
              {error && (
                <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", fontSize: "13px", color: "#dc2626", marginBottom: "1rem" }}>
                  {error}
                </div>
              )}
              {success && (
                <div style={{ padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", fontSize: "13px", color: "#16a34a", marginBottom: "1rem" }}>
                  {success}
                </div>
              )}
              <button type="submit" disabled={loading} style={{
                width: "100%", padding: "12px", fontSize: "15px", fontWeight: 600,
                background: "#1e3a5f", color: "#fff", border: "none", borderRadius: "8px",
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
                fontFamily: "'IBM Plex Sans Arabic', sans-serif",
              }}>
                {loading ? "جارٍ الإرسال..." : "إرسال رمز التحقق"}
              </button>
            </form>
          )}

          {/* ══ Forgot Password — Verify OTP ══ */}
          {screen === "forgot-otp" && (
            <form onSubmit={handleForgotOTPVerify}>
              <button type="button" onClick={() => { go("forgot"); setOtp(""); }} style={{
                background: "none", border: "none", cursor: "pointer", color: "#64748b",
                fontSize: "13px", display: "flex", alignItems: "center", gap: "6px",
                padding: 0, marginBottom: "1.25rem", fontFamily: "'IBM Plex Sans Arabic', sans-serif",
              }}>
                &larr; رجوع
              </button>
              <div style={{ marginBottom: "1.25rem", textAlign: "center" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: "0 0 4px" }}>
                  التحقق من البريد
                </h2>
                <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
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
              {error && (
                <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", fontSize: "13px", color: "#dc2626", marginBottom: "1rem" }}>
                  {error}
                </div>
              )}
              {success && (
                <div style={{ padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", fontSize: "13px", color: "#16a34a", marginBottom: "1rem" }}>
                  {success}
                </div>
              )}
              <button type="submit" disabled={loading || otp.length !== 6} style={{
                width: "100%", padding: "12px", fontSize: "15px", fontWeight: 600,
                background: "#1e3a5f", color: "#fff", border: "none", borderRadius: "8px",
                cursor: (loading || otp.length !== 6) ? "not-allowed" : "pointer",
                opacity: (loading || otp.length !== 6) ? 0.5 : 1,
                fontFamily: "'IBM Plex Sans Arabic', sans-serif",
              }}>
                {loading ? "جارٍ التحقق..." : "تحقق"}
              </button>
            </form>
          )}

          {/* ══ Reset Password — New Password ══ */}
          {screen === "reset-password" && (
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: "1.25rem" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: "0 0 4px" }}>
                  كلمة مرور جديدة
                </h2>
                <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                  أدخل كلمة المرور الجديدة (6 أحرف على الأقل)
                </p>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#475569", marginBottom: "6px" }}>
                  كلمة المرور الجديدة
                </label>
                <input
                  type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••" autoComplete="new-password" autoFocus
                  style={{
                    width: "100%", padding: "10px 14px", fontSize: "14px",
                    background: "#fff", border: "1px solid #d1d5db", borderRadius: "8px",
                    color: "#1e293b", outline: "none", boxSizing: "border-box",
                    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                  }}
                />
              </div>
              {error && (
                <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", fontSize: "13px", color: "#dc2626", marginBottom: "1rem" }}>
                  {error}
                </div>
              )}
              {success && (
                <div style={{ padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", fontSize: "13px", color: "#16a34a", marginBottom: "1rem" }}>
                  {success}
                </div>
              )}
              <button type="submit" disabled={loading} style={{
                width: "100%", padding: "12px", fontSize: "15px", fontWeight: 600,
                background: "#1e3a5f", color: "#fff", border: "none", borderRadius: "8px",
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
                fontFamily: "'IBM Plex Sans Arabic', sans-serif",
              }}>
                {loading ? "جارٍ التحديث..." : "تحديث كلمة المرور"}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "2rem", padding: "1.5rem", background: "#1e293b", borderRadius: "8px", width: "100%", maxWidth: "440px" }}>
          <p style={{ margin: "0 0 6px", fontSize: "13px", color: "#94a3b8" }}>هل تحتاج مساعدة؟</p>
          <a href="mailto:Support@fll.sa" style={{ color: "#fff", textDecoration: "none", fontSize: "14px", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Mail size={14} /> Support@fll.sa
          </a>
        </div>

        <p style={{ textAlign: "center", fontSize: "11px", color: "#94a3b8", marginTop: "1rem" }}>
          &copy; {new Date().getFullYear()} First Line Logistics — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
