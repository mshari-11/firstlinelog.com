import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { User, Phone, Shield, CheckCircle, Loader2, AlertCircle } from "lucide-react";
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

function normalizePhone(raw: string): string {
  const d = raw.replace(/[^0-9+]/g, "");
  if (d.startsWith("+966")) return d;
  if (d.startsWith("00966")) return "+" + d.slice(2);
  if (d.startsWith("05")) return "+966" + d.slice(1);
  if (d.startsWith("5") && d.length === 9) return "+966" + d;
  return d;
}

function isValidSA(phone: string): boolean {
  return /^\\+9665\\d{8}$/.test(phone);
}

export default function UnifiedLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleFromQuery = searchParams.get("role");
  const { toast } = useToast();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOtp = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    const normalized = normalizePhone(phone);
    if (!isValidSA(normalized)) {
      setError("رقم الهاتف غير صحيح. يجب أن يبدأ بـ 5 ويكون 9 أرقام");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (!supabase) throw new Error("الاتصال غير متاح");
      const { error: otpErr } = await supabase.auth.signInWithOtp({ phone: normalized });
      if (otpErr) throw otpErr;
      setStep("otp");
      setCountdown(60);
      toast({ title: "تم إرسال رمز التحقق", description: "تم إرسال رمز التحقق إلى " + normalized });
    } catch (err: any) {
      setError(err?.message ?? "حدث خطأ أثناء إرسال الرمز");
    } finally {
      setLoading(false);
    }
  }, [phone, toast]);

  const handleVerifyOtp = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (otp.length !== 6) { setError("أدخل رمز التحقق المكون من 6 أرقام"); return; }
    setLoading(true);
    setError("");
    try {
      if (!supabase) throw new Error("الاتصال غير متاح");
      const normalized = normalizePhone(phone);
      const { data, error: verifyErr } = await supabase.auth.verifyOtp({
        phone: normalized, token: otp, type: "sms",
      });
      if (verifyErr) throw verifyErr;
      const { data: profile } = await supabase.from("users_2026_02_17_21_00").select("role").eq("id", data.user?.id).single();
      const userRole = profile?.role ?? "staff";
      let destination: string;
      if (roleFromQuery === "admin" || roleFromQuery === "staff") { destination = "/admin/dashboard"; }
      else if (roleFromQuery === "driver") { destination = "/courier/portal"; }
      else { destination = ROLE_ROUTES[userRole] ?? "/admin/dashboard"; }
      navigate(destination);
    } catch (err: any) {
      const msg = err?.message ?? "";
      if (msg.includes("Invalid") || msg.includes("expired")) { setError("رمز التحقق غير صحيح أو منتهي الصلاحية"); }
      else { setError("حدث خطأ أثناء التحقق"); }
    } finally { setLoading(false); }
  }, [otp, phone, roleFromQuery, navigate]);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4" dir="rtl">
        <motion.div className="w-full max-w-xs sm:max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-4 sm:pb-8 px-3 sm:px-6 pt-4 sm:pt-6">
              <div className="mx-auto w-10 h-10 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2 sm:mb-4">
                <User className="w-5 h-5 sm:w-8 sm:h-8 text-primary" />
              </div>
              <CardTitle className="text-lg sm:text-2xl font-bold text-foreground">تسجيل الدخول</CardTitle>
              <CardDescription className="text-muted-foreground text-sm sm:text-base">
                {step === "phone" ? "أدخل رقم هاتفك للحصول على رمز التحقق" : "أدخل رمز التحقق المرسل إلى هاتفك"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-6 px-3 sm:px-6 pb-4 sm:pb-6">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
              {step === "phone" ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">رقم الهاتف</Label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input type="tel" placeholder="5xxxxxxxx أو +9665xxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} className="pr-10 text-left" dir="ltr" />
                    </div>
                    <p className="text-xs text-muted-foreground">SA يقبل الصيغ: +9665xxxxxxxx، 05xxxxxxxx، 5xxxxxxxx</p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading || !phone.trim()}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> جاري الإرسال...</> : <><Phone className="mr-2 h-4 w-4" /> إرسال رمز التحقق</>}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2 flex flex-col items-center">
                    <Label className="text-sm font-medium">رمز التحقق</Label>
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                      <InputOTPGroup dir="ltr">
                        {[0, 1, 2, 3, 4, 5].map((i) => (<InputOTPSlot key={i} index={i} />))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> جاري التحقق...</> : <><Shield className="mr-2 h-4 w-4" /> تحقق ودخول</>}
                  </Button>
                  <div className="text-sm text-muted-foreground text-center">
                    لم تستلم الرمز؟{" "}
                    <Button type="button" variant="link" onClick={() => handleSendOtp()} disabled={countdown > 0 || loading} className="p-0 h-auto text-sm">
                      {countdown > 0 ? "إعادة الإرسال خلال " + countdown + "s" : "إعادة الإرسال"}
                    </Button>
                  </div>
                </form>
              )}
              <div className="pt-6 border-t border-border">
                <p className="text-xs text-muted-foreground text-center mb-3">نقطة دخول واحدة لجميع المستخدمين</p>
                <div className="flex justify-center gap-4">
                  <div className="flex flex-col items-center gap-1"><User className="w-4 h-4 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">مندوب</span></div>
                  <div className="flex flex-col items-center gap-1"><Shield className="w-4 h-4 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">إدارة</span></div>
                  <div className="flex flex-col items-center gap-1"><User className="w-4 h-4 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">موظف</span></div>
                </div>
              </div>
              <div className="pt-4">
                <p className="text-xs text-muted-foreground text-center mb-2">بحاجة لمساعدة؟{" "}<Button variant="link" className="p-0 h-auto text-xs" onClick={() => navigate("/contact")}>اتصل بالدعم التقني</Button></p>
                <div className="flex flex-wrap justify-center gap-2">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><Shield className="w-3 h-3" /><span>تشفير متقدم</span></div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><CheckCircle className="w-3 h-3" /><span>تحقق ثنائي</span></div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><Phone className="w-3 h-3" /><span>OTP آمن</span></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
