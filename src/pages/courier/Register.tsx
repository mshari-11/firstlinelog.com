/**
 * صفحة تسجيل المناديب - فيرست لاين لوجستيكس
 * يملأ المندوب بياناته ويُنشأ له حساب تلقائياً
 */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  User, Phone, CreditCard, MapPin, Lock, Eye, EyeOff,
  CheckCircle2, AlertCircle, Truck, ArrowLeft
} from "lucide-react";

const CITIES = [
  "الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "الدمام",
  "الخبر", "الظهران", "الأحساء", "الطائف", "تبوك", "بريدة",
  "خميس مشيط", "أبها", "نجران", "جازان", "ينبع", "حائل",
  "القطيف", "الجبيل", "حفر الباطن", "أخرى"
];

function generateUsername(name: string, phone: string): string {
  const clean = name.trim().split(" ")[0].toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, "");
  const last4 = phone.replace(/\D/g, "").slice(-4);
  return `fl_${clean}_${last4}`;
}

export default function CourierRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", phone: "", nationalId: "", city: "", password: "", confirmPassword: ""
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [generatedUsername, setGeneratedUsername] = useState("");

  const set = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // التحقق
    if (!form.name || !form.phone || !form.nationalId || !form.city || !form.password) {
      setError("يرجى تعبئة جميع الحقول"); return;
    }
    if (form.phone.length < 10) { setError("رقم الجوال يجب أن يكون 10 أرقام على الأقل"); return; }
    if (form.nationalId.length < 10) { setError("رقم الهوية يجب أن يكون 10 أرقام"); return; }
    if (form.password.length < 6) { setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    if (form.password !== form.confirmPassword) { setError("كلمة المرور وتأكيدها غير متطابقتين"); return; }

    setLoading(true);
    try {
      if (!supabase) throw new Error("خطأ في الاتصال");

      const username = generateUsername(form.name, form.phone);
      const email = `${username}@fll.sa`;

      // إنشاء حساب في Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: { data: { full_name: form.name, role: "courier" } }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("فشل إنشاء الحساب");

      // إضافة في جدول المستخدمين
      await supabase.from("users_2026_02_17_21_00").insert({
        id: authData.user.id,
        email,
        name: form.name,
        role: "courier",
        phone: form.phone,
      });

      // إضافة في جدول المناديب
      await supabase.from("couriers_2026_02_17_21_00").insert({
        user_id: authData.user.id,
        full_name: form.name,
        phone: form.phone,
        national_id: form.nationalId,
        city: form.city,
        username,
        status: "pending",
      });

      setGeneratedUsername(username);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء التسجيل");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir="rtl"
        style={{ background: "linear-gradient(135deg, oklch(0.10 0.06 220), oklch(0.14 0.08 200))" }}>
        <div className="w-full max-w-md bg-blue-950/60 backdrop-blur-xl border border-blue-700/30 rounded-2xl p-8 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">تم التسجيل بنجاح!</h2>
          <div className="space-y-3 text-right">
            <div className="bg-blue-900/40 rounded-xl p-4 space-y-2">
              <p className="text-sm text-blue-300">اسم المستخدم الخاص بك:</p>
              <p className="text-lg font-mono text-cyan-400 font-bold" dir="ltr">{generatedUsername}</p>
            </div>
            <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-3">
              <p className="text-sm text-amber-300">
                ⚠️ احفظ اسم المستخدم. ستحتاجه لتسجيل الدخول.
                <br />حسابك بانتظار موافقة الإدارة للتفعيل.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/admin/login")}
            className="w-full h-12 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-colors"
          >
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" dir="rtl"
      style={{ background: "linear-gradient(135deg, oklch(0.10 0.06 220), oklch(0.14 0.08 200))" }}>
      
      {/* خلفية */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-60 -right-60 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-60 -left-60 w-96 h-96 bg-cyan-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-blue-950/60 backdrop-blur-xl border border-blue-700/30 rounded-2xl p-8">
          {/* الرأس */}
          <div className="text-center mb-8 space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/20 flex items-center justify-center">
              <Truck className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">تسجيل مندوب جديد</h1>
            <p className="text-sm text-blue-300/70">فيرست لاين لوجستيكس</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-300 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* الاسم */}
            <div className="space-y-1.5">
              <label className="block text-sm text-blue-100 font-medium">الاسم الكامل</label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/60"><User size={17} /></div>
                <input
                  value={form.name} onChange={e => set("name", e.target.value)}
                  placeholder="أدخل اسمك الكامل"
                  className="w-full h-11 bg-blue-950/70 border border-blue-700/40 rounded-xl text-white text-sm placeholder:text-blue-300/40 pr-10 pl-4 outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400 transition-all"
                />
              </div>
            </div>

            {/* الجوال */}
            <div className="space-y-1.5">
              <label className="block text-sm text-blue-100 font-medium">رقم الجوال</label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/60"><Phone size={17} /></div>
                <input
                  value={form.phone} onChange={e => set("phone", e.target.value)}
                  placeholder="05XXXXXXXX" dir="ltr" type="tel"
                  className="w-full h-11 bg-blue-950/70 border border-blue-700/40 rounded-xl text-white text-sm placeholder:text-blue-300/40 pr-10 pl-4 outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400 transition-all text-right"
                />
              </div>
            </div>

            {/* الهوية */}
            <div className="space-y-1.5">
              <label className="block text-sm text-blue-100 font-medium">رقم الهوية / الإقامة</label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/60"><CreditCard size={17} /></div>
                <input
                  value={form.nationalId} onChange={e => set("nationalId", e.target.value)}
                  placeholder="أدخل رقم الهوية" dir="ltr" type="text"
                  className="w-full h-11 bg-blue-950/70 border border-blue-700/40 rounded-xl text-white text-sm placeholder:text-blue-300/40 pr-10 pl-4 outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400 transition-all text-right"
                />
              </div>
            </div>

            {/* المدينة */}
            <div className="space-y-1.5">
              <label className="block text-sm text-blue-100 font-medium">المدينة</label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/60"><MapPin size={17} /></div>
                <select
                  value={form.city} onChange={e => set("city", e.target.value)}
                  className="w-full h-11 bg-blue-950/70 border border-blue-700/40 rounded-xl text-white text-sm pr-10 pl-4 outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400 transition-all appearance-none"
                >
                  <option value="" className="bg-blue-950">اختر المدينة</option>
                  {CITIES.map(c => <option key={c} value={c} className="bg-blue-950">{c}</option>)}
                </select>
              </div>
            </div>

            {/* كلمة المرور */}
            <div className="space-y-1.5">
              <label className="block text-sm text-blue-100 font-medium">كلمة المرور</label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/60"><Lock size={17} /></div>
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password} onChange={e => set("password", e.target.value)}
                  placeholder="6 أحرف على الأقل"
                  className="w-full h-11 bg-blue-950/70 border border-blue-700/40 rounded-xl text-white text-sm placeholder:text-blue-300/40 pr-10 pl-10 outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400 transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300/60 hover:text-blue-200">
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* تأكيد كلمة المرور */}
            <div className="space-y-1.5">
              <label className="block text-sm text-blue-100 font-medium">تأكيد كلمة المرور</label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/60"><Lock size={17} /></div>
                <input
                  type={showPass ? "text" : "password"}
                  value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)}
                  placeholder="أعد إدخال كلمة المرور"
                  className="w-full h-11 bg-blue-950/70 border border-blue-700/40 rounded-xl text-white text-sm placeholder:text-blue-300/40 pr-10 pl-4 outline-none focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400 transition-all"
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full h-12 bg-gradient-to-l from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:opacity-50 text-white rounded-xl font-bold text-base transition-all mt-2"
            >
              {loading ? "جارٍ التسجيل..." : "تسجيل"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/admin/login" className="text-sm text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1">
              <ArrowLeft size={14} /> لديك حساب؟ تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
