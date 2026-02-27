// Unified Login - Email + Password + Email OTP (no-reply@fll.sa)
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { User, Mail, Lock, Shield, CheckCircle, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";

const ROLE_ROUTES: Record<string, string> = {
  admin: "/admin/dashboard",
  finance: "/admin/dashboard",
  hr: "/admin/dashboard",
  fleet: "/admin/dashboard",
  ops: "/admin/dashboard",
  staff: "/admin/dashboard",
  courier: "/courier/portal",
};

export default function UnifiedLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role");
  const { toast } = useToast();
  const [screen, setScreen] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleCredentials = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) { setError("الرجاء إدخال البريد وكلمة المرور"); return; }
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) { setError("البريد أو كلمة المرور غير صحيحة"); return; }
      await supabase.auth.signOut();
      const { error: otpError } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false } });
      if (otpError) { setError("خطأ إرسال رمز التحقق"); return; }
      setScreen("otp");
      setCountdown(60);
      toast({ title: "تم إرسال رمز التحقق", description: email });
    } catch (err: unknown) {
      setError((err as Error)?.message || "خطأ");
    } finally { setLoading(false); }
  }, [email, password, toast]);

  const handleOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) { setError("الرجاء إدخال 6 أرقام"); return; }
    setLoading(true);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({ email: email.trim(), token: otp, type: "email" });
      if (verifyError || !data.user) { setError("رمز غير صحيح أو منتهي الصلاحية"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
      navigate(ROLE_ROUTES[profile?.role ?? role ?? "staff"] ?? "/admin/dashboard");
    } catch (err: unknown) {
      setError((err as Error)?.message || "خطأ");
    } finally { setLoading(false); }
  }, [email, otp, role, navigate]);

  const handleResend = useCallback(async () => {
    setLoading(true);
    try { await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false } }); setCountdown(60); }
    finally { setLoading(false); }
  }, [email]);

  const roleLabels: Record<string, string> = {
    admin: "إدارة", staff: "موظف", courier: "مندوب",
    finance: "مالية", hr: "موارد بشرية", fleet: "أسطول", ops: "عمليات",
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <User className="w-8 h-8 text-slate-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-800">تسجيل الدخول</CardTitle>
              <CardDescription className="text-slate-500">
                {screen === "credentials" ? "أدخل بياناتك للدخول إلى منصة فيرست لاين" : `أدخل رمز التحقق المرسل إلى ${email}`}
              </CardDescription>
              {role && <span className="inline-block mt-1 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">{roleLabels[role] ?? role}</span>}
            </CardHeader>
            <CardContent className="pt-4">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4" /><span>{error}</span>
                </div>
              )}
              {screen === "credentials" && (
                <form onSubmit={handleCredentials} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@fll.sa" className="pr-10" dir="ltr" disabled={loading} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="password">كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pr-10 pl-10" dir="ltr" disabled={loading} />
                      <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-white" disabled={loading}>
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin ml-2" /> جاري...</> : "متابعة"}
                  </Button>
                </form>
              )}
              {screen === "otp" && (
                <form onSubmit={handleOtp} className="space-y-5">
                  <div className="text-center">
                    <Mail className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">تم إرسال كود نو-ريبلاي إلى: <span className="font-mono font-bold">{email}</span></p>
                    <p className="text-xs text-slate-400">المُرسِل: no-reply@fll.sa</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-center block">كود نو-ريبلاي (رمز التحقق)</Label>
                    <div className="flex justify-center" dir="ltr">
                      <InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={loading}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
                          <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-white" disabled={loading || otp.length !== 6}>
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin ml-2" /> جاري...</> : <><CheckCircle className="w-4 h-4 ml-2" /> تأكيد الدخول</>}
                  </Button>
                  <div className="flex items-center justify-between text-sm">
                    <button type="button" onClick={() => { setScreen("credentials"); setOtp(""); setError(""); }} className="text-slate-500 underline">تغيير البيانات</button>
                    {countdown > 0 ? <span className="text-slate-400">إعادة خلال {countdown}ث</span> : (
                      <button type="button" onClick={handleResend} disabled={loading} className="text-blue-600 underline">إعادة إرسال</button>
                    )}
                  </div>
                </form>
              )}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <p className="text-center text-xs text-slate-400 mb-3">نقطة دخول واحدة لجميع المستخدمين</p>
                <div className="flex justify-center gap-6 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> تشفير متقدم</span>
                  <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> تحقق ثنائي</span>
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> OTP بريدي</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}