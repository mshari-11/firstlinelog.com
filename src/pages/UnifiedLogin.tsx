import { useState, useRef, useEffect, useCallback } from "react";

const API = "https://xr7wsfym5k.execute-api.me-south-1.amazonaws.com";

const REDIRECT: Record<string, string> = {
  SystemAdmin: "/admin-panel/dashboard",
  admin: "/admin-panel/dashboard",
  finance: "/admin-panel/finance",
  hr: "/admin-panel/staff",
  ops: "/admin-panel/orders",
  fleet: "/admin-panel/couriers",
  staff: "/admin-panel/dashboard",
  executive: "/admin-panel/dashboard",
  driver: "/courier/portal",
};

function getRedirect(groups: string[]) {
  for (const g of groups) {
    if (REDIRECT[g]) return REDIRECT[g];
  }
  return "/";
}

function saveSession(data: any) {
  try {
    localStorage.setItem("fll_token", data.token || data.accessToken || "");
    localStorage.setItem(
      "fll_user",
      JSON.stringify({
        username: data.user?.email || data.username || "",
        email: data.user?.email || data.email || "",
        name: data.user?.name || data.name || "",
        groups: data.user?.groups || data.groups || [],
      })
    );
  } catch {}
}

export default function UnifiedLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [step, setStep] = useState<"login" | "otp" | "forgot" | "reset">("login");
  const [otpCode, setOtpCode] = useState("");
  const [session, setSession] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotNewPw, setForgotNewPw] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const otpRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  // Auto-redirect if already logged in
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("fll_user") || "null");
      const t = localStorage.getItem("fll_token");
      if (u && t) {
        const dest = getRedirect(u.groups || []);
        if (dest !== "/") window.location.href = dest;
      }
    } catch {}
  }, []);

  const showToast = useCallback((msg: string, type = "info") => {
    setToast({ msg, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Login ──
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      showToast("الرجاء إدخال البيانات المطلوبة", "error");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await r.json();

      if (data.challenge === "EMAIL_OTP") {
        setSession(data.session);
        setStep("otp");
        showToast("تم إرسال رمز التحقق إلى بريدك الإلكتروني", "success");
        setTimeout(() => otpRef.current?.focus(), 200);
      } else if (data.token) {
        saveSession(data);
        showToast(`مرحباً ${data.user?.name || username}! جاري التحويل...`, "success");
        const dest = getRedirect(data.user?.groups || data.groups || []);
        setTimeout(() => (window.location.href = dest), 1200);
      } else {
        showToast(data.message || "بيانات الدخول غير صحيحة", "error");
      }
    } catch {
      showToast("خطأ في الاتصال بالخادم", "error");
    } finally {
      setLoading(false);
    }
  }

  // ── OTP verify ──
  async function handleOTP() {
    const code = otpCode.replace(/\D/g, "");
    if (code.length !== 6) {
      showToast("الرجاء إدخال الرمز المكون من 6 أرقام", "error");
      return;
    }
    setOtpLoading(true);
    try {
      const r = await fetch(`${API}/auth/respond-mfa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), code, session, challenge: "EMAIL_OTP" }),
      });
      const data = await r.json();
      if (data.token) {
        saveSession(data);
        showToast(`مرحباً ${data.user?.name || username}! جاري التحويل...`, "success");
        const dest = getRedirect(data.user?.groups || data.groups || []);
        setTimeout(() => (window.location.href = dest), 1200);
      } else {
        showToast(data.message || "رمز التحقق غير صحيح", "error");
        setOtpCode("");
        otpRef.current?.focus();
      }
    } catch {
      showToast("خطأ في الاتصال", "error");
    } finally {
      setOtpLoading(false);
    }
  }

  // ── Forgot password ──
  async function handleForgotSend() {
    if (!forgotEmail.trim()) {
      showToast("أدخل البريد الإلكتروني", "error");
      return;
    }
    setForgotLoading(true);
    try {
      await fetch(`${API}/auth/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim(), identifier: forgotEmail.trim() }),
      });
      showToast("تم إرسال رمز التحقق إلى بريدك", "success");
      setStep("reset");
    } catch {
      showToast("خطأ في الاتصال", "error");
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleResetPw() {
    if (!forgotCode || !forgotNewPw) {
      showToast("أدخل الرمز وكلمة المرور الجديدة", "error");
      return;
    }
    setForgotLoading(true);
    try {
      const r = await fetch(`${API}/auth/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim(), identifier: forgotEmail.trim(), code: forgotCode, password: forgotNewPw }),
      });
      const data = await r.json();
      if (r.ok) {
        showToast("تم تغيير كلمة المرور بنجاح!", "success");
        setStep("login");
        setForgotEmail("");
        setForgotCode("");
        setForgotNewPw("");
      } else {
        showToast(data.message || "خطأ", "error");
      }
    } catch {
      showToast("خطأ في الاتصال", "error");
    } finally {
      setForgotLoading(false);
    }
  }

  // ── Toast ──
  const toastColors: Record<string, string> = {
    success: "#059669",
    error: "#dc2626",
    info: "#0f2744",
    warning: "#d97706",
  };

  return (
    <div style={styles.page}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            ...styles.toast,
            background: toastColors[toast.type] || toastColors.info,
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logoArea}>
            <img
              src="/public/images/first_line_professional_english_1.png"
              alt="First Line Logistics"
              style={styles.logo}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <nav style={styles.nav}>
            <a href="/" style={styles.navLink}>الرئيسية</a>
            <a href="/about" style={styles.navLink}>من نحن</a>
            <a href="/services" style={styles.navLink}>خدماتنا</a>
            <a href="/news" style={styles.navLink}>الأخبار</a>
            <a href="/investors" style={styles.navLink}>المستثمرين</a>
            <a href="/contact" style={styles.navLink}>اتصل بنا</a>
          </nav>
        </div>
      </header>

      <main style={styles.main}>
        {/* Title badge */}
        <h1 style={styles.portalTitle}>FIRST LINE LOGISTICS PORTAL</h1>
        <div style={styles.badge}>النظام الإداري الداخلي</div>

        {/* ═══ Login Step ═══ */}
        {step === "login" && (
          <div style={styles.card}>
            <div style={styles.avatar}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h2 style={styles.cardTitle}>تسجيل الدخول</h2>
            <p style={styles.cardSub}>أدخل بيانات الدخول الخاصة بك</p>

            <form onSubmit={handleLogin} style={styles.form}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>اسم المستخدم</label>
                <div style={styles.inputWrap}>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="M.Z@FLL.SA"
                    style={styles.input}
                    autoComplete="username"
                    dir="ltr"
                  />
                  <svg style={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>كلمة المرور</label>
                <div style={styles.inputWrap}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    style={styles.input}
                    autoComplete="current-password"
                    dir="ltr"
                  />
                  {/* Lock icon (right side) */}
                  <svg style={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  {/* Eye toggle (left side) */}
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={styles.eyeBtn}
                    tabIndex={-1}
                    aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}>
                {loading ? (
                  <span style={styles.spinner} />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 8 }}>
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 16 16 12 12 8" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                )}
                {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => { setForgotEmail(username); setStep("forgot"); }}
              style={styles.forgotLink}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              نسيت كلمة المرور؟
            </button>
          </div>
        )}

        {/* ═══ OTP Step ═══ */}
        {step === "otp" && (
          <div style={styles.card}>
            <div style={{ ...styles.avatar, background: "linear-gradient(135deg, #0f2744, #1e3a5f)" }}>
              <span style={{ fontSize: 28, lineHeight: 1 }}>&#x2709;&#xFE0E;</span>
            </div>
            <h2 style={styles.cardTitle}>رمز التحقق</h2>
            <p style={styles.cardSub}>
              تم إرسال رمز التحقق من <strong style={{ color: "#0f2744" }}>no-reply@fll.sa</strong> إلى بريدك الإلكتروني
              <br />
              <strong style={{ color: "#0f2744" }}>{username}</strong>
            </p>

            <div style={styles.form}>
              <input
                ref={otpRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  setOtpCode(v);
                  if (v.length === 6) setTimeout(() => handleOTP(), 100);
                }}
                onKeyDown={(e) => { if (e.key === "Enter") handleOTP(); }}
                placeholder="------"
                style={styles.otpInput}
                autoFocus
              />
              <button
                type="button"
                onClick={handleOTP}
                disabled={otpLoading}
                style={{ ...styles.submitBtn, opacity: otpLoading ? 0.7 : 1 }}
              >
                {otpLoading ? "جاري التحقق..." : "تأكيد الرمز"}
              </button>
              <p style={{ color: "#94a3b8", fontSize: 12, margin: "12px 0 0", textAlign: "center" }}>
                الرمز صالح لمدة 3 دقائق
              </p>
              <button
                type="button"
                onClick={() => { setStep("login"); setOtpCode(""); }}
                style={styles.backLink}
              >
                العودة لتسجيل الدخول
              </button>
            </div>
          </div>
        )}

        {/* ═══ Forgot Password Step ═══ */}
        {step === "forgot" && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>استعادة كلمة المرور</h2>
            <p style={styles.cardSub}>أدخل بريدك الإلكتروني لاستلام رمز التحقق</p>
            <div style={styles.form}>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="البريد الإلكتروني"
                style={styles.input}
                dir="ltr"
              />
              <button
                type="button"
                onClick={handleForgotSend}
                disabled={forgotLoading}
                style={{ ...styles.submitBtn, opacity: forgotLoading ? 0.7 : 1, marginTop: 12 }}
              >
                {forgotLoading ? "جاري الإرسال..." : "إرسال الرمز"}
              </button>
              <button type="button" onClick={() => setStep("login")} style={styles.backLink}>
                العودة لتسجيل الدخول
              </button>
            </div>
          </div>
        )}

        {/* ═══ Reset Password Step ═══ */}
        {step === "reset" && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>تغيير كلمة المرور</h2>
            <p style={styles.cardSub}>أدخل رمز التحقق وكلمة المرور الجديدة</p>
            <div style={styles.form}>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={forgotCode}
                onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ""))}
                placeholder="رمز التحقق"
                style={{ ...styles.input, textAlign: "center", letterSpacing: 6, fontFamily: "monospace" }}
                dir="ltr"
              />
              <input
                type="password"
                value={forgotNewPw}
                onChange={(e) => setForgotNewPw(e.target.value)}
                placeholder="كلمة المرور الجديدة"
                style={{ ...styles.input, marginTop: 12 }}
                dir="ltr"
              />
              <button
                type="button"
                onClick={handleResetPw}
                disabled={forgotLoading}
                style={{ ...styles.submitBtn, opacity: forgotLoading ? 0.7 : 1, marginTop: 12 }}
              >
                {forgotLoading ? "جاري التغيير..." : "تغيير كلمة المرور"}
              </button>
              <button type="button" onClick={() => setStep("login")} style={styles.backLink}>
                العودة لتسجيل الدخول
              </button>
            </div>
          </div>
        )}

        {/* Footer help */}
        <div style={styles.helpBox}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>هل تحتاج مساعدة؟</p>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
            <span style={{ marginLeft: 4 }}>&#x2709;&#xFE0E;</span> تواصل Support@fll.sa
          </p>
        </div>

        <a href="/login" style={styles.driverLink}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          نظام السائقين
        </a>
      </main>
    </div>
  );
}

// ── Styles ──
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0b1622",
    fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, sans-serif",
    direction: "rtl",
    color: "#1e293b",
  },
  toast: {
    position: "fixed",
    top: 24,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 99999,
    padding: "14px 32px",
    borderRadius: 12,
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    boxShadow: "0 8px 32px rgba(0,0,0,.3)",
    maxWidth: "90%",
    textAlign: "center",
    direction: "rtl",
    animation: "fadeIn .3s ease-out",
  },
  header: {
    background: "#0f2744",
    borderBottom: "1px solid rgba(255,255,255,.08)",
    padding: "12px 24px",
  },
  headerInner: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
  },
  logo: {
    height: 48,
    objectFit: "contain",
  },
  nav: {
    display: "flex",
    gap: 24,
    alignItems: "center",
  },
  navLink: {
    color: "#cbd5e1",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 500,
    transition: "color .2s",
  },
  main: {
    maxWidth: 520,
    margin: "0 auto",
    padding: "40px 20px 60px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  portalTitle: {
    color: "#e2e8f0",
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: 2,
    margin: "0 0 16px",
    textAlign: "center",
    fontFamily: "'IBM Plex Sans', sans-serif",
  },
  badge: {
    display: "inline-block",
    padding: "8px 24px",
    border: "1px solid #ef4444",
    borderRadius: 6,
    color: "#fca5a5",
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 28,
    background: "rgba(239,68,68,.08)",
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: "32px 28px",
    width: "100%",
    maxWidth: 440,
    boxShadow: "0 8px 40px rgba(0,0,0,.25)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    color: "#fff",
  },
  cardTitle: {
    margin: "0 0 4px",
    fontSize: 22,
    fontWeight: 700,
    color: "#0f2744",
  },
  cardSub: {
    margin: "0 0 24px",
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 1.7,
  },
  form: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
  },
  fieldGroup: {
    marginBottom: 16,
    width: "100%",
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 6,
    textAlign: "right",
  },
  inputWrap: {
    position: "relative",
    width: "100%",
  },
  input: {
    width: "100%",
    padding: "12px 40px 12px 40px",
    fontSize: 15,
    border: "2px solid #e2e8f0",
    borderRadius: 10,
    outline: "none",
    background: "#fff",
    transition: "border-color .2s",
    boxSizing: "border-box",
    fontFamily: "inherit",
    textAlign: "right",
  },
  inputIcon: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
  },
  eyeBtn: {
    position: "absolute",
    left: 10,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    zIndex: 2,
  },
  submitBtn: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #0f2744, #1e3a5f)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "opacity .2s",
  },
  spinner: {
    display: "inline-block",
    width: 18,
    height: 18,
    border: "2px solid rgba(255,255,255,.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite",
    marginLeft: 8,
  },
  forgotLink: {
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "inherit",
    marginTop: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  backLink: {
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "inherit",
    marginTop: 16,
    textDecoration: "underline",
    textAlign: "center",
  },
  otpInput: {
    width: "100%",
    padding: 16,
    textAlign: "center",
    fontSize: 28,
    letterSpacing: 12,
    border: "2px solid #d1d5db",
    borderRadius: 12,
    outline: "none",
    fontFamily: "monospace",
    direction: "ltr" as const,
    boxSizing: "border-box",
    transition: "border-color .2s",
    marginBottom: 16,
  },
  helpBox: {
    marginTop: 28,
    padding: "16px 24px",
    background: "rgba(255,255,255,.06)",
    borderRadius: 12,
    textAlign: "center",
    color: "#e2e8f0",
    width: "100%",
    maxWidth: 440,
  },
  driverLink: {
    marginTop: 16,
    padding: "12px 24px",
    background: "rgba(255,255,255,.06)",
    borderRadius: 12,
    color: "#cbd5e1",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 440,
    transition: "background .2s",
  },
};
