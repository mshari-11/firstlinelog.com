/**
 * صفحة تسجيل الدخول - لوحة إدارة فيرست لاين
 * تدعم: تسجيل دخول | إنشاء حساب | نسيت كلمة المرور | OTP
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/admin/auth";
import { supabase } from "@/lib/supabase";
import {
  Eye, EyeOff, LogIn, AlertCircle, Mail, Lock,
  User, Phone, ArrowRight, CheckCircle2, RefreshCw,
  KeyRound, ShieldCheck
} from "lucide-react";

/* ─── أنواع الشاشات ─── */
type Screen = "login" | "register" | "forgot" | "otp" | "success";

/* ─── ألوان الخلفية الديكورية ─── */
const BG = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute -top-60 -right-60 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl" />
    <div className="absolute -bottom-60 -left-60 w-96 h-96 bg-cyan-600/8 rounded-full blur-3xl" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-3xl" />
  </div>
);

/* ─── حقل إدخال موحد ─── */
function Field({
  label, id, type = "text", value, onChange, placeholder, icon: Icon,
  rightSlot, error, autoComplete
}: {
  label: string; id: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  icon: React.ElementType; rightSlot?: React.ReactNode;
  error?: string; autoComplete?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm text-blue-100 font-medium">{label}</label>
      <div className="relative">
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/60">
          <Icon size={17} />
        </div>
        <input
          id={id} type={type} value={value} autoComplete={autoComplete}
          onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className={`w-full h-11 bg-blue-950/70 border rounded-xl text-white text-sm
            placeholder:text-blue-300/40 pr-10 pl-4 outline-none transition-all
            focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400
            ${error ? "border-red-500/60" : "border-blue-700/40"}`}
        />
        {rightSlot && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
      {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={12}/>{error}</p>}
    </div>
  );
}

/* ─── رسالة خطأ عامة ─── */
function ErrorMsg({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
      <AlertCircle size={16} className="shrink-0 mt-0.5" />
      <span>{msg}</span>
    </div>
  );
}

/* ─── زر رئيسي ─── */
function Btn({ children, loading, disabled, onClick, type = "submit", variant = "primary" }: {
  children: React.ReactNode; loading?: boolean; disabled?: boolean;
  onClick?: () => void; type?: "submit"|"button"; variant?: "primary"|"ghost";
}) {
  return (
    <button type={type} disabled={loading || disabled} onClick={onClick}
      className={`w-full h-11 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50
        ${variant === "primary"
          ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20"
          : "bg-slate-700/60 hover:bg-slate-700 text-blue-100 border border-slate-600/60"}`}>
      {loading
        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/><span>يرجى الانتظار...</span></>
        : children}
    </button>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function AdminLogin() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [screen, setScreen] = useState<Screen>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // حقول تسجيل الدخول
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  // حقول التسجيل
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regPassConfirm, setRegPassConfirm] = useState("");
  const [showRegPass, setShowRegPass] = useState(false);

  // نسيت كلمة المرور
  const [forgotEmail, setForgotEmail] = useState("");

  // OTP
  const [otpCode, setOtpCode] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);

  /* ── عداد إعادة الإرسال ── */
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = setTimeout(() => setOtpCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCooldown]);

  function go(s: Screen) { setError(""); setScreen(s); }

  /* ══ تسجيل الدخول ══ */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await signIn(email, password);
    if (res.error) { setError(res.error); setLoading(false); }
    else navigate("/admin/dashboard");
  }

  /* ══ إنشاء حساب ══ */
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (regPass !== regPassConfirm) { setError("كلمة المرور وتأكيدها غير متطابقتين"); return; }
    if (regPass.length < 8) { setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل"); return; }
    setLoading(true);
    if (!supabase) { setError("الاتصال بقاعدة البيانات غير متاح"); setLoading(false); return; }

    const { error: authErr } = await supabase.auth.signUp({
      email: regEmail, password: regPass,
      options: { data: { full_name: regName, phone: regPhone } }
    });

    if (authErr) { setError(authErr.message); setLoading(false); return; }

    setLoading(false);
    go("success");
  }

  /* ══ نسيت كلمة المرور ══ */
  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    if (!supabase) { setError("الاتصال غير متاح"); setLoading(false); return; }

    const { error: err } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });

    setLoading(false);
    if (err) { setError(err.message); return; }
    go("otp");
    setOtpCooldown(60);
  }

  /* ══ التحقق من OTP ══ */
  async function handleOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    if (!supabase) { setError("الاتصال غير متاح"); setLoading(false); return; }

    const { error: err } = await supabase.auth.verifyOtp({
      email: forgotEmail, token: otpCode, type: "recovery"
    });

    setLoading(false);
    if (err) { setError("رمز التحقق غير صحيح أو منتهي الصلاحية"); return; }
    navigate("/admin/dashboard");
  }

  /* ══ إعادة إرسال OTP ══ */
  async function resendOtp() {
    if (otpCooldown > 0 || !supabase) return;
    await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    setOtpCooldown(60);
  }

  /* ════════════════ RENDER ════════════════ */
  return (
    <div className="min-h-screen bg-[oklch(0.10_0.06_220)] flex items-center justify-center p-4" dir="rtl">
      <BG />

      <div className="relative w-full max-w-md">

        {/* ── الشعار ── */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl mb-3 shadow-xl shadow-cyan-500/30">
            <span className="text-white font-black text-xl tracking-tight">FL</span>
          </div>
          <h1 className="text-xl font-bold text-white">First Line Logistics</h1>
          <p className="text-blue-300/60 text-xs mt-0.5">لوحة إدارة المناديب</p>
        </div>

        {/* ── البطاقة ── */}
        <div className="bg-blue-950/50 backdrop-blur-xl border border-blue-700/30 rounded-2xl p-7 shadow-2xl">

          {/* ════ شاشة تسجيل الدخول ════ */}
          {screen === "login" && (
            <>
              <h2 className="text-base font-semibold text-white text-center mb-6">تسجيل الدخول</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <Field label="البريد الإلكتروني" id="email" type="email"
                  value={email} onChange={setEmail} placeholder="example@fll.sa"
                  icon={Mail} autoComplete="email" />

                <Field label="كلمة المرور" id="password" type={showPass ? "text" : "password"}
                  value={password} onChange={setPassword} placeholder="••••••••"
                  icon={Lock} autoComplete="current-password"
                  rightSlot={
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="text-blue-300/60 hover:text-blue-100 transition-colors">
                      {showPass ? <EyeOff size={17}/> : <Eye size={17}/>}
                    </button>
                  }
                />

                <div className="flex justify-end">
                  <button type="button" onClick={() => go("forgot")}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                    نسيت كلمة المرور؟
                  </button>
                </div>

                <ErrorMsg msg={error} />

                <Btn loading={loading}>
                  <LogIn size={16}/> دخول
                </Btn>
              </form>

              <div className="mt-4 pt-4 border-t border-blue-700/30 text-center">
                <p className="text-xs text-blue-300/60">
                  ليس لديك حساب؟{" "}
                  <button onClick={() => go("register")}
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                    إنشاء حساب جديد
                  </button>
                </p>
              </div>
            </>
          )}

          {/* ════ شاشة إنشاء حساب ════ */}
          {screen === "register" && (
            <>
              <div className="flex items-center gap-2 mb-6">
                <button onClick={() => go("login")}
                  className="text-blue-300/60 hover:text-white transition-colors">
                  <ArrowRight size={18}/>
                </button>
                <h2 className="text-base font-semibold text-white">إنشاء حساب جديد</h2>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <Field label="الاسم الكامل" id="reg-name" value={regName}
                  onChange={setRegName} placeholder="محمد العمري" icon={User} />

                <Field label="البريد الإلكتروني" id="reg-email" type="email"
                  value={regEmail} onChange={setRegEmail}
                  placeholder="example@fll.sa" icon={Mail} autoComplete="email" />

                <Field label="رقم الجوال" id="reg-phone" type="tel"
                  value={regPhone} onChange={setRegPhone}
                  placeholder="05xxxxxxxx" icon={Phone} autoComplete="tel" />

                <Field label="كلمة المرور" id="reg-pass"
                  type={showRegPass ? "text" : "password"}
                  value={regPass} onChange={setRegPass}
                  placeholder="8 أحرف على الأقل" icon={Lock}
                  rightSlot={
                    <button type="button" onClick={() => setShowRegPass(!showRegPass)}
                      className="text-blue-300/60 hover:text-blue-100 transition-colors">
                      {showRegPass ? <EyeOff size={17}/> : <Eye size={17}/>}
                    </button>
                  }
                />

                <Field label="تأكيد كلمة المرور" id="reg-pass-confirm"
                  type={showRegPass ? "text" : "password"}
                  value={regPassConfirm} onChange={setRegPassConfirm}
                  placeholder="أعد كتابة كلمة المرور" icon={Lock} />

                {/* مقياس قوة كلمة المرور */}
                {regPass.length > 0 && (
                  <PasswordStrength password={regPass} />
                )}

                <ErrorMsg msg={error} />

                <Btn loading={loading}>
                  <User size={16}/> إنشاء الحساب
                </Btn>
              </form>

              <p className="text-xs text-blue-300/40 text-center mt-4">
                بالتسجيل أنت توافق على سياسة الخصوصية وشروط الاستخدام
              </p>
            </>
          )}

          {/* ════ شاشة نسيت كلمة المرور ════ */}
          {screen === "forgot" && (
            <>
              <div className="flex items-center gap-2 mb-6">
                <button onClick={() => go("login")}
                  className="text-blue-300/60 hover:text-white transition-colors">
                  <ArrowRight size={18}/>
                </button>
                <h2 className="text-base font-semibold text-white">استعادة كلمة المرور</h2>
              </div>

              <div className="bg-blue-900/30 rounded-xl p-4 mb-5 flex gap-3">
                <KeyRound size={18} className="text-cyan-400 shrink-0 mt-0.5"/>
                <p className="text-blue-200/70 text-xs leading-relaxed">
                  أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق لإعادة تعيين كلمة المرور.
                </p>
              </div>

              <form onSubmit={handleForgot} className="space-y-4">
                <Field label="البريد الإلكتروني" id="forgot-email" type="email"
                  value={forgotEmail} onChange={setForgotEmail}
                  placeholder="example@fll.sa" icon={Mail} autoComplete="email" />

                <ErrorMsg msg={error} />

                <Btn loading={loading}>
                  <Mail size={16}/> إرسال رمز التحقق
                </Btn>

                <Btn type="button" variant="ghost" onClick={() => go("login")}>
                  العودة لتسجيل الدخول
                </Btn>
              </form>
            </>
          )}

          {/* ════ شاشة OTP ════ */}
          {screen === "otp" && (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck size={26} className="text-cyan-400"/>
                </div>
                <h2 className="text-base font-semibold text-white">أدخل رمز التحقق</h2>
                <p className="text-blue-300/60 text-xs mt-1">
                  أُرسل رمز إلى <span className="text-cyan-400">{forgotEmail}</span>
                </p>
              </div>

              <form onSubmit={handleOtp} className="space-y-4">
                {/* حقل OTP الكبير */}
                <div className="space-y-1.5">
                  <label className="block text-sm text-blue-100 font-medium">رمز التحقق (6 أرقام)</label>
                  <input
                    type="text" inputMode="numeric" maxLength={6}
                    value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="_ _ _ _ _ _"
                    className="w-full h-14 bg-blue-950/70 border border-blue-700/40 rounded-xl text-white text-2xl font-mono text-center tracking-[0.5em] outline-none transition-all focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400"
                  />
                </div>

                <ErrorMsg msg={error} />

                <Btn loading={loading} disabled={otpCode.length < 6}>
                  <ShieldCheck size={16}/> تأكيد
                </Btn>

                {/* إعادة إرسال */}
                <div className="text-center">
                  {otpCooldown > 0 ? (
                    <p className="text-xs text-blue-300/60">
                      إعادة الإرسال بعد <span className="text-cyan-400 font-mono">{otpCooldown}s</span>
                    </p>
                  ) : (
                    <button type="button" onClick={resendOtp}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mx-auto transition-colors">
                      <RefreshCw size={12}/> إعادة إرسال الرمز
                    </button>
                  )}
                </div>
              </form>
            </>
          )}

          {/* ════ شاشة نجاح التسجيل ════ */}
          {screen === "success" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-green-400"/>
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">تم إنشاء الحساب!</h2>
              <p className="text-blue-200/70 text-sm mb-1">
                تحقق من بريدك الإلكتروني لتفعيل الحساب.
              </p>
              <p className="text-blue-300/60 text-xs mb-6">
                {regEmail}
              </p>
              <button onClick={() => go("login")}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors">
                <LogIn size={15}/> الذهاب لتسجيل الدخول
              </button>
            </div>
          )}

        </div>

        <p className="text-center text-slate-700 text-xs mt-5">
          © {new Date().getFullYear()} First Line Logistics — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}

/* ── مقياس قوة كلمة المرور ── */
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8 أحرف على الأقل", pass: password.length >= 8 },
    { label: "حرف كبير",         pass: /[A-Z]/.test(password) },
    { label: "رقم",              pass: /\d/.test(password) },
    { label: "رمز خاص",          pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const colors = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-green-500"];
  const labels = ["", "ضعيفة", "مقبولة", "جيدة", "قوية"];

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[1,2,3,4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : "bg-blue-800"}`}/>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {checks.map(c => (
            <span key={c.label} className={`text-xs flex items-center gap-1 ${c.pass ? "text-green-400" : "text-blue-300/40"}`}>
              <span>{c.pass ? "✓" : "○"}</span>{c.label}
            </span>
          ))}
        </div>
        {score > 0 && <span className={`text-xs font-medium ${colors[score].replace("bg-", "text-")}`}>{labels[score]}</span>}
      </div>
    </div>
  );
}
