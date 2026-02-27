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
    if (!email.trim() || !password.trim()) {
      setError("\u0627\u0644\u0631\u062c\u0627\u0621 \u0625\u062f\u062e\u0627\u0644 \u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631");
      return;
    }
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError("\u0627\u0644\u0628\u0631\u064a\u062f \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063a\u064a\u0631 \u0635\u062d\u064a\u062d\u0629");
        return;
      }
      await supabase.auth.signOut();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: false },
      });
      if (otpError) {
        setError("\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u0625\u0631\u0633\u0627\u0644 \u0631\u0645\u0632 \u0627\u0644\u062a\u062d\u0642\u0642");
        return;
      }
      setScreen("otp");
      setCountdown(60);
      toast({ title: "\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0631\u0645\u0632 \u0627\u0644\u062a\u062d\u0642\u0642", description: email });
    } catch (err: unknown) {
      setError((err as Error)?.message || "\u062e\u0637\u0623");
    } finally {
      setLoading(false);
    }
  }, [email, password, toast]);

  const handleOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) {
      setError("\u0627\u0644\u0631\u062c\u0627\u0621 \u0625\u062f\u062e\u0627\u0644 \u0631\u0645\u0632 \u0627\u0644\u062a\u062d\u0642\u0642 \u0627\u0644\u0645\u0643\u0648\u0646 \u0645\u0646 6 \u0623\u0631\u0642\u0627\u0645");
      return;
    }
    setLoading(true);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp,
        type: "email",
      });
      if (verifyError || !data.user) {
        setError("\u0631\u0645\u0632 \u0627\u0644\u062a\u062d\u0642\u0642 \u063a\u064a\u0631 \u0635\u062d\u064a\u062d \u0623\u0648 \u0645\u0646\u062a\u0647\u064a");
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
      const userRole = profile?.role ?? role ?? "staff";
      const destination = ROLE_ROUTES[userRole] ?? "/admin/dashboard";
      navigate(destination);
    } catch (err: unknown) {
      setError((err as Error)?.message || "\u062e\u0637\u0623");
    } finally {
      setLoading(false);
    }
  }, [email, otp, role, navigate]);

  const handleResend = useCallback(async () => {
    setLoading(true);
    try {
      await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false } });
      setCountdown(60);
    } finally {
      setLoading(false);
    }
  }, [email]);

  const roleLabels: Record<string, string> = {
    admin: "\u0625\u062f\u0627\u0631\u0629", staff: "\u0645\u0648\u0638\u0641", courier: "\u0645\u0646\u062f\u0648\u0628",
    finance: "\u0645\u0627\u0644\u064a\u0629", hr: "\u0645\u0648\u0627\u0631\u062f \u0628\u0634\u0631\u064a\u0629",
    fleet: "\u0623\u0633\u0637\u0648\u0644", ops: "\u0639\u0645\u0644\u064a\u0627\u062a",
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
              <CardTitle className="text-2xl font-bold text-slate-800">\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644</CardTitle>
              <CardDescription className="text-slate-500">
                {screen === "credentials" ? "\u0623\u062f\u062e\u0644 \u0628\u064a\u0627\u0646\u0627\u062a\u0643 \u0644\u0644\u062f\u062e\u0648\u0644 \u0625\u0644\u0649 \u0645\u0646\u0635\u0629 \u0641\u064a\u0631\u0633\u062a \u0644\u0627\u064a\u0646" : `\u0623\u062f\u062e\u0644 \u0631\u0645\u0632 \u0627\u0644\u062a\u062d\u0642\u0642 \u0627\u0644\u0645\u0631\u0633\u0644 \u0625\u0644\u0649 ${email}`}
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
                    <Label htmlFor="email">\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@fll.sa" className="pr-10" dir="ltr" disabled={loading} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="password">\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" className="pr-10 pl-10" dir="ltr" disabled={loading} />
                      <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-white" disabled={loading}>
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin ml-2" /> \u062c\u0627\u0631\u064a...</> : "\u0645\u062a\u0627\u0628\u0639\u0629"}
                  </Button>
                </form>
              )}
              {screen === "otp" && (
                <form onSubmit={handleOtp} className="space-y-5">
                  <div className="text-center">
                    <Mail className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0643\u0648\u062f \u0646\u0648-\u0631\u064a\u0628\u0644\u0627\u064a \u0625\u0644\u0649: <span className="font-mono font-bold">{email}</span></p>
                    <p className="text-xs text-slate-400">no-reply@fll.sa</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-center block">\u0643\u0648\u062f \u0646\u0648-\u0631\u064a\u0628\u0644\u0627\u064a</Label>
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
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin ml-2" /> \u062c\u0627\u0631\u064a...</> : <><CheckCircle className="w-4 h-4 ml-2" /> \u062a\u0623\u0643\u064a\u062f \u0627\u0644\u062f\u062e\u0648\u0644</>}
                  </Button>
                  <div className="flex items-center justify-between text-sm">
                    <button type="button" onClick={() => { setScreen("credentials"); setOtp(""); setError(""); }} className="text-slate-500 underline">\u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a</button>
                    {countdown > 0 ? <span className="text-slate-400">\u0625\u0639\u0627\u062f\u0629 \u062e\u0644\u0627\u0644 {countdown}\u062b</span> : (
                      <button type="button" onClick={handleResend} disabled={loading} className="text-blue-600 underline">\u0625\u0639\u0627\u062f\u0629 \u0625\u0631\u0633\u0627\u0644</button>
                    )}
                  </div>
                </form>
              )}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <p className="text-center text-xs text-slate-400 mb-3">\u0646\u0642\u0637\u0629 \u062f\u062e\u0648\u0644 \u0648\u0627\u062d\u062f\u0629 \u0644\u062c\u0645\u064a\u0639 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u064a\u0646</p>
                <div className="flex justify-center gap-6 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> \u062a\u0634\u0641\u064a\u0631 \u0645\u062a\u0642\u062f\u0645</span>
                  <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> \u062a\u062d\u0642\u0642 \u062b\u0646\u0627\u0626\u064a</span>
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> OTP \u0628\u0631\u064a\u062f\u064a</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}