import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";

type Step = 1 | 2 | 3 | 4;

export default function RegisterPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

  // Step 1
  const [username, setUsername] = useState("");
    const [email, setEmail]       = useState("");
    // Step 2
  const [password, setPassword]         = useState("");
    const [confirmPass, setConfirmPass]   = useState("");
    const [showPass, setShowPass]         = useState(false);
    // Step 3
  const [otp, setOtp] = useState("");

  // ── مؤشر قوة كلمة المرور ──────────────────────────────────────
  const passChecks = [
    { label: "8 أحرف على الأقل", pass: password.length >= 8 },
    { label: "حرف كبير",          pass: /[A-Z]/.test(password) },
    { label: "حرف صغير",          pass: /[a-z]/.test(password) },
    { label: "رقم",               pass: /[0-9]/.test(password) },
    { label: "رمز خاص",           pass: /[^A-Za-z0-9]/.test(password) },
      ];
    const passScore = passChecks.filter(c => c.pass).length;
    const passColor = passScore <= 2 ? "bg-red-500" : passScore <= 3 ? "bg-yellow-500" : "bg-green-500";

  // ── الخطوة 1: التحقق من اسم المستخدم والإيميل ────────────────
  async function handleStep1() {
        if (!username.trim() || !email.trim()) {
                setError("يرجى ملء جميع الحقول"); return;
        }
        if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
                setError("اسم المستخدم: 3-30 حرف (أحرف إنجليزية وأرقام و_)"); return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                setError("يرجى إدخال بريد إلكتروني صحيح"); return;
        }
        setLoading(true); setError("");
        try {
                if (!supabase) throw new Error("الاتصال غير متاح");
                const { data } = await supabase
                  .from("users_2026_02_17_21_00")
                  .select("id")
                  .eq("username", username)
                  .single();
                if (data) { setError("اسم المستخدم مستخدم بالفعل"); return; }
                setStep(2);
        } catch (err: any) {
                if (err?.message?.includes("JSON object requested")) setStep(2);
                else setError("حدث خطأ. يرجى المحاولة.");
        } finally { setLoading(false); }
  }

  // ── الخطوة 2: إنشاء الحساب وإرسال OTP ───────────────────────
  async function handleStep2() {
        if (!password || !confirmPass) { setError("يرجى ملء جميع الحقول"); return; }
        if (passScore < 3) { setError("كلمة المرور ضعيفة جداً"); return; }
        if (password !== confirmPass) { setError("كلمتا المرور غير متطابقتين"); return; }
        setLoading(true); setError("");
        try {
                if (!supabase) throw new Error("الاتصال غير متاح");
                const { error: signUpErr } = await supabase.auth.signUp({
                          email,
                          password,
                          options: {
                                      data: { username, full_name: username, role: "courier" },
                                      emailRedirectTo: undefined,
                          },
                });
                if (signUpErr) throw signUpErr;
                setStep(3);
        } catch (err: any) {
                const msg = err?.message ?? "";
                if (msg.includes("already registered")) setError("هذا البريد الإلكتروني مسجل مسبقاً");
                else setError("حدث خطأ في إنشاء الحساب.");
        } finally { setLoading(false); }
  }

  // ── الخطوة 3: التحقق من رمز OTP ─────────────────────────────
  async function handleStep3() {
        if (otp.length < 6) { setError("يرجى إدخال رمز التحقق كاملاً"); return; }
        setLoading(true); setError("");
        try {
                if (!supabase) throw new Error("الاتصال غير متاح");
                const { error: verifyErr } = await supabase.auth.verifyOtp({
                          email,
                          token: otp,
                          type: "signup",
                });
                if (verifyErr) throw verifyErr;
                setStep(4);
        } catch (err: any) {
                const msg = err?.message ?? "";
                if (msg.includes("Token has expired")) setError("انتهت صلاحية الرمز. اطلب رمزاً جديداً.");
                else if (msg.includes("Invalid")) setError("رمز التحقق غير صحيح.");
                else setError("حدث خطأ. تأكد من الرمز وحاول مجدداً.");
        } finally { setLoading(false); }
  }

  // ── إعادة إرسال OTP ──────────────────────────────────────────
  async function resendOtp() {
        setError("");
        if (!supabase) return;
        await supabase.auth.resend({ type: "signup", email });
        alert("تم إعادة إرسال رمز التحقق إلى " + email);
  }

  const steps = [
    { n: 1, label: "الهوية"  },
    { n: 2, label: "الأمان"  },
    { n: 3, label: "التحقق"  },
    { n: 4, label: "النجاح"  },
      ];

  return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4" dir="rtl">
              <div className="w-full max-w-sm">
              
                {/* Logo */}
                      <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl mb-3 shadow-xl">
                                            <span className="text-white font-black text-xl">FL</span>span>
                                </div>div>
                                <h1 className="text-xl font-bold text-white">تسجيل مندوب جديد</h1>h1>
                      </div>div>
              
                {/* Progress Steps */}
                {step !== 4 && (
                    <div className="flex items-center gap-1 mb-6">
                      {steps.slice(0, 3).map(({ n, label }, i) => (
                                    <div key={n} className="flex items-center flex-1">
                                                    <div className="flex flex-col items-center flex-1">
                                                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                                                                                          ${step > n ? "bg-green-600 text-white" : step === n ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-400"}`}>
                                                                        {step > n ? "✓" : n}
                                                                      </div>div>
                                                                      <span className="text-xs text-gray-500 mt-1">{label}</span>span>
                                                    </div>div>
                                      {i < 2 && <div className={`h-0.5 flex-1 mx-1 mb-4 ${step > n ? "bg-green-600" : "bg-gray-700"}`} />}
                                    </div>div>
                                  ))}
                    </div>div>
                      )}
              
                      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                      
                        {/* ═══ الخطوة 1: اسم المستخدم + الإيميل ═══ */}
                        {step === 1 && (
                      <div className="space-y-4">
                                    <h2 className="text-white font-semibold text-center mb-2">معلومات الحساب</h2>h2>
                                    <div>
                                                    <label className="block text-sm text-gray-400 mb-1">اسم المستخدم <span className="text-red-400">*</span>span></label>label>
                                                    <input
                                                                        type="text"
                                                                        value={username}
                                                                        onChange={e => setUsername(e.target.value)}
                                                                        placeholder="مثال: ahmed_driver"
                                                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                                                      />
                                                    <p className="text-xs text-gray-500 mt-1">أحرف إنجليزية وأرقام و _ فقط</p>p>
                                    </div>div>
                                    <div>
                                                    <label className="block text-sm text-gray-400 mb-1">البريد الإلكتروني <span className="text-red-400">*</span>span></label>label>
                                                    <input
                                                                        type="email"
                                                                        value={email}
                                                                        onChange={e => setEmail(e.target.value)}
                                                                        placeholder="example@email.com"
                                                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                                                      />
                                    </div>div>
                        {error && <ErrorBox msg={error} />}
                                    <button onClick={handleStep1} disabled={loading}
                                                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition text-sm">
                                      {loading ? "جاري التحقق..." : "التالي ←"}
                                    </button>button>
                      </div>div>
                                )}
                      
                        {/* ═══ الخطوة 2: كلمة المرور ═══ */}
                        {step === 2 && (
                      <div className="space-y-4">
                                    <h2 className="text-white font-semibold text-center mb-2">كلمة المرور</h2>h2>
                                    <div>
                                                    <label className="block text-sm text-gray-400 mb-1">كلمة المرور <span className="text-red-400">*</span>span></label>label>
                                                    <div className="relative">
                                                                      <input
                                                                                            type={showPass ? "text" : "password"}
                                                                                            value={password}
                                                                                            onChange={e => setPassword(e.target.value)}
                                                                                            placeholder="8 أحرف على الأقل"
                                                                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition pl-10"
                                                                                          />
                                                                      <button type="button" onClick={() => setShowPass(!showPass)}
                                                                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition text-xs">
                                                                        {showPass ? "إخفاء" : "إظهار"}
                                                                      </button>button>
                                                    </div>div>
                                      {password && (
                                          <div className="mt-2 space-y-1">
                                                              <div className="flex gap-1">
                                                                {passChecks.map((_, i) => (
                                                                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < passScore ? passColor : "bg-gray-700"}`} />
                                                                  ))}
                                                              </div>div>
                                                              <div className="grid grid-cols-2 gap-x-4">
                                                                {passChecks.map(({ label, pass }) => (
                                                                    <p key={label} className={`text-xs ${pass ? "text-green-400" : "text-gray-600"}`}>
                                                                      {pass ? "✓" : "○"} {label}
                                                                    </p>p>
                                                                  ))}
                                                              </div>div>
                                          </div>div>
                                                    )}
                                    </div>div>
                                    <div>
                                                    <label className="block text-sm text-gray-400 mb-1">تأكيد كلمة المرور <span className="text-red-400">*</span>span></label>label>
                                                    <input
                                                                        type={showPass ? "text" : "password"}
                                                                        value={confirmPass}
                                                                        onChange={e => setConfirmPass(e.target.value)}
                                                                        placeholder="أعد إدخال كلمة المرور"
                                                                        className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 transition
                                                                                            ${confirmPass && confirmPass !== password ? "border-red-600 focus:ring-red-500" : confirmPass && confirmPass === password ? "border-green-600 focus:ring-green-500" : "border-gray-700 focus:ring-blue-500"}`}
                                                                      />
                                      {confirmPass && confirmPass === password && (
                                          <p className="text-xs text-green-400 mt-1">✓ كلمتا المرور متطابقتان</p>p>
                                                    )}
                                    </div>div>
                        {error && <ErrorBox msg={error} />}
                                    <div className="flex gap-2">
                                                    <button onClick={() => { setStep(1); setError(""); }}
                                                                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg text-sm transition">
                                                                      → السابق
                                                    </button>button>
                                                    <button onClick={handleStep2} disabled={loading}
                                                                        className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition text-sm">
                                                      {loading ? "جاري الإرسال..." : "إنشاء الحساب ←"}
                                                    </button>button>
                                    </div>div>
                      </div>div>
                                )}
                      
                        {/* ═══ الخطوة 3: رمز التحقق ═══ */}
                        {step === 3 && (
                      <div className="space-y-4">
                                    <div className="text-center">
                                                    <div className="text-4xl mb-2">📧</div>div>
                                                    <h2 className="text-white font-semibold">تحقق من بريدك</h2>h2>
                                                    <p className="text-sm text-gray-400 mt-1">
                                                                      أرسلنا رمز التحقق إلى<br />
                                                                      <span className="text-blue-400 font-medium">{email}</span>span>
                                                    </p>p>
                                    </div>div>
                                    <div>
                                                    <label className="block text-sm text-gray-400 mb-1 text-center">رمز التحقق (6 أرقام)</label>label>
                                                    <input
                                                                        type="text"
                                                                        inputMode="numeric"
                                                                        maxLength={6}
                                                                        value={otp}
                                                                        onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                                                        placeholder="_ _ _ _ _ _"
                                                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-4 text-white text-2xl font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                                                      />
                                    </div>div>
                        {error && <ErrorBox msg={error} />}
                                    <button onClick={handleStep3} disabled={loading || otp.length < 6}
                                                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition text-sm">
                                      {loading ? "جاري التحقق..." : "تأكيد ←"}
                                    </button>button>
                                    <p className="text-center text-xs text-gray-500">
                                                    لم تستلم الرمز؟{" "}
                                                    <button onClick={resendOtp} className="text-blue-400 hover:text-blue-300 transition underline">
                                                                      إعادة الإرسال
                                                    </button>button>
                                    </p>p>
                      </div>div>
                                )}
                      
                        {/* ═══ الخطوة 4: نجاح ═══ */}
                        {step === 4 && (
                      <div className="text-center space-y-4 py-2">
                                    <div className="text-6xl">🎉</div>div>
                                    <h2 className="text-xl font-bold text-white">تم التسجيل بنجاح!</h2>h2>
                                    <p className="text-sm text-gray-400">
                                                    مرحباً <span className="text-blue-400 font-semibold">{username}</span>span>،<br />
                                                    حسابك جاهز الآن.
                                    </p>p>
                                    <button onClick={() => navigate("/login?role=driver")}
                                                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-semibold py-3 rounded-lg transition text-sm">
                                                    الذهاب لتسجيل الدخول
                                    </button>button>
                      </div>div>
                                )}
                      
                      </div>div>
              
                {step === 1 && (
                    <p className="text-center text-sm text-gray-500 mt-4">
                                لديك حساب؟{" "}
                                <Link to="/login" className="text-blue-400 hover:text-blue-300 transition">
                                              سجّل دخولك
                                </Link>Link>
                    </p>p>
                      )}
              
              </div>div>
        </div>div>
      );
}

function ErrorBox({ msg }: { msg: string }) {
    return (
          <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3">
                <p className="text-sm text-red-400 text-center">{msg}</p>p>
          </div>div>
        );
}</div>
