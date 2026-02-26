import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const ROLE_ROUTES: Record<string, string> = {
    admin:   "/admin/dashboard",
    finance: "/admin/dashboard",
    hr:      "/admin/dashboard",
    fleet:   "/admin/dashboard",
    ops:     "/admin/dashboard",
    staff:   "/admin/dashboard",
    courier: "/courier/portal",
};

export default function LoginPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const role = searchParams.get("role");

    const [email,    setEmail]    = useState("");
    const [password, setPassword] = useState("");
    const [error,    setError]    = useState("");
    const [loading,  setLoading]  = useState(false);
    const [showPass, setShowPass] = useState(false);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        if (!email || !password) {
            setError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
            return;
        }
        setLoading(true);
        setError("");
        try {
            if (!supabase) throw new Error("الاتصال بقاعدة البيانات غير متاح");
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (authError) throw authError;

            const { data: profile } = await supabase
                .from("users_2026_02_17_21_00")
                .select("role")
                .eq("id", data.user?.id)
                .single();

            const userRole = profile?.role ?? "staff";
        let destination: string;
                    if (roleFromQuery === "admin" || roleFromQuery === "staff") {
                                  destination = "/admin/dashboard";
                    } else if (roleFromQuery === "driver") {
                                  destination = "/courier/portal";
                    } else {
                                  destination = ROLE_ROUTES[userRole] ?? "/admin/dashboard";
                    }
            navigate(destination);
        } catch (err: any) {
            const msg = err?.message ?? "";
            if (msg.includes("Invalid login credentials")) {
                setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
            } else if (msg.includes("Email not confirmed")) {
                setError("البريد الإلكتروني غير مفعّل. تحقق من صندوق البريد.");
            } else {
                setError("حدث خطأ. يرجى المحاولة مجدداً.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4" dir="rtl">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl mb-3 shadow-xl">
                        <span className="text-white font-black text-xl">FL</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">تسجيل الدخول</h1>
                    {role && (
                        <p className="text-sm text-gray-400 mt-1">
                            {role === "admin"  && "لوحة الإدارة"}
                            {role === "staff"  && "بوابة الموظفين"}
                            {role === "driver" && "بوابة المندوبين"}
                        </p>
                    )}
                </div>
                <form onSubmit={handleLogin} className="bg-gray-900 rounded-2xl p-6 space-y-4 border border-gray-800">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">البريد الإلكتروني</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="example@fll.sa"
                            autoComplete="email"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">كلمة المرور</label>
                        <div className="relative">
                            <input
                                type={showPass ? "text" : "password"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition pr-4 pl-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                            >
                                {showPass ? "🙈" : "👁"}
                            </button>
                        </div>
                        <div className="flex justify-end mt-1">
                            <Link to="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition">
                                نسيت كلمة المرور؟
                            </Link>
                        </div>
                    </div>
                    {error && (
                        <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3">
                            <p className="text-sm text-red-400 text-center">{error}</p>
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition text-sm"
                    >
                        {loading ? "جاري الدخول..." : "دخول"}
                    </button>
                </form>
                {(!role || role === "driver") && (
                    <p className="text-center text-sm text-gray-500 mt-4">
                        مندوب جديد؟{" "}
                        <Link to="/register" className="text-blue-400 hover:text-blue-300 transition">
                            سجّل هنا
                        </Link>
                    </p>
                )}
            </div>
        </div>
    );
}
