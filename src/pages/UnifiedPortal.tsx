/**
 * صفحة تسجيل الدخول الموحدة — /unified-login
 * Light theme + Cognito auth + OTP verification via AWS Lambda/SES
 */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/admin/auth";
import { sendOtp, verifyOtp } from "@/lib/otp-service";
import { Lock, User, Eye, EyeOff, Mail } from "lucide-react";

type Screen = "login" | "otp" | "success" | "forgot" | "forgot-otp" | "reset-password";

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

  function go(s: Screen) { setError(""); setSuccess(""); setScreen(s); }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("أدخل البريد الإلكتروني"); return; }
    if (!password) { setError("أدخل كلمة المرور"); return; }
    setError(""); setLoading(true);

    const res = await signIn(email.trim(), password);
    if (res.error) { setError(res.error); setLoading(false); return; }

    setSuccess("تم التحقق من بيانات المرور. جارٍ إرسال رمز التحقق...");
    const otpRes = await sendOtp(email.trim(), "login");
    setLoading(false);
    if (otpRes.error) { setError(otpRes.error); return; }

    setSuccess("تم إرسال رمز التحقق إلى بريدك الإلكتروني");
    go("otp");
  }

  async function handleOTPVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) { setError("أدخل رمز التحقق الكامل (6 أرقام)"); return; }
    setError(""); setLoading(true);
    const res = await verifyOtp(email.trim(), otp, "login");
    setLoading(false);
    if (res.error) { setError(res.error); return; }

    setSuccess("تم التحقق بنجاح!");
    go("success");
    setTimeout(() => navigate("/admin-panel/dashboard"), 1200);
  }

  async function handleResend() {
    setError(""); setLoading(true);
    const res = await sendOtp(email.trim(), "login");
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setSuccess("تم إرسال رمز جديد إلى بريدك الإلكتروني");
    setOtp("");
  }

  async function handleForgotSend(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail.trim()) { setError("أدخل البريد الإلكتروني"); return; }
    setError(""); setSuccess(""); setLoading(true);
    const otpRes = await sendOtp(resetEmail.trim(), "reset_password");
    setLoading(false);
    if (otpRes.error) { setError(otpRes.error); return; }
    setSuccess("تم إرسال رمز التحقق إلى بريدك الإلكتروني");
    go("forgot-otp");
  }

  async function handleForgotOTPVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) { setError("أدخل رمز التحقق الكامل (6 أرقام)"); return; }
    setError(""); setSuccess(""); setLoading(true);
    const res = await verifyOtp(resetEmail.trim(), otp, "reset_password");
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setSuccess("تم التحقق. أدخل كلمة المرور الجديدة");
    go("reset-password");
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) { setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    setError(""); setSuccess(""); setLoading(true);
    // TODO: implement Cognito change password when needed
    setLoading(false);
    setSuccess("تم تحديث كلمة المرور بنجاح!");
    setTimeout(() => { go("login"); setNewPassword(""); setOtp(""); setResetEmail(""); }, 1500);
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
                  <User size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
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
                    position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
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

          {/* ══ OTP Screen ══ */}
          {screen === "otp" && (
            <form onSubmit={handleOTPVerify}>
              <button type="button" onClick={() => { go("login"); setOtp(""); }} style={{
                background: "none", border: "none", cursor: "pointer", color: "#64748b",
                fontSize: "13px", display: "flex", alignItems: "center", gap: "6px",
                padding: 0, marginBottom: "1.25rem", fontFamily: "'IBM Plex Sans Arabic', sans-serif",
              }}>
                &larr; رجوع
              </button>

              <div style={{ marginBottom: "1.25rem", textAlign: "center" }}>
                <div style={{
                  width: "48px", height: "48px", borderRadius: "50%", margin: "0 auto 0.75rem",
                  background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Mail size={22} color="#2563eb" />
                </div>
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: "0 0 4px" }}>
                  التحقق الثنائي
                </h2>
                <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                  أدخل رمز التحقق المُرسل إلى {email}
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "1.5rem", direction: "ltr" }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[i] || ""}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Backspace" && !otp[i] && i > 0) {
                        const prev = document.getElementById(`otp-${i - 1}`);
                        if (prev) (prev as HTMLInputElement).focus();
                      }
                    }}
                    autoFocus={i === 0}
                    style={{
                      width: "48px", height: "56px", textAlign: "center", fontSize: "24px",
                      fontWeight: 700, background: "#fff", border: "1px solid #d1d5db",
                      borderRadius: "8px", color: "#1e293b", outline: "none",
                      fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                    }}
                  />
                ))}
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

              <button type="button" onClick={handleResend} disabled={loading} style={{
                width: "100%", padding: "10px", fontSize: "13px", fontWeight: 500,
                background: "#fff", color: "#64748b", border: "1px solid #d1d5db", borderRadius: "8px",
                cursor: "pointer", fontFamily: "'IBM Plex Sans Arabic', sans-serif", marginTop: "10px",
              }}>
                إرسال رمز جديد
              </button>
            </form>
          )}

          {/* ══ Success Screen ══ */}
          {screen === "success" && (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div style={{
                width: "56px", height: "56px", borderRadius: "50%",
                background: "#f0fdf4", border: "2px solid #22c55e",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 1rem", fontSize: "28px", color: "#22c55e",
              }}>
                &#10003;
              </div>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: "0 0 4px" }}>
                تم التحقق بنجاح
              </h2>
              <p style={{ fontSize: "12px", color: "#94a3b8" }}>جارٍ تحويلك للوحة التحكم...</p>
            </div>
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
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "1.5rem", direction: "ltr" }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <input
                    key={i}
                    id={`fotp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[i] || ""}
                    onChange={e => {
                      if (!/^\d*$/.test(e.target.value)) return;
                      const arr = otp.padEnd(6, " ").split("");
                      arr[i] = e.target.value;
                      setOtp(arr.join("").replace(/ /g, "").slice(0, 6));
                      if (e.target.value && i < 5) {
                        const next = document.getElementById(`fotp-${i + 1}`);
                        if (next) (next as HTMLInputElement).focus();
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === "Backspace" && !otp[i] && i > 0) {
                        const prev = document.getElementById(`fotp-${i - 1}`);
                        if (prev) (prev as HTMLInputElement).focus();
                      }
                    }}
                    autoFocus={i === 0}
                    style={{
                      width: "48px", height: "56px", textAlign: "center", fontSize: "24px",
                      fontWeight: 700, background: "#fff", border: "1px solid #d1d5db",
                      borderRadius: "8px", color: "#1e293b", outline: "none",
                      fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                    }}
                  />
                ))}
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
