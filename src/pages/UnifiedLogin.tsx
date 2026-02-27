// Unified Login - Email + Password (OTP temporarily disabled)
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Lock, Shield, Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
                const { data, error: authError } = await supabase.auth.signInWithPassword({
                          email,
                          password,
                });

          if (authError) {
                    setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
                    toast({
                                title: "خطأ في تسجيل الدخول",
                                description: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
                                variant: "destructive",
                    });
                    setLoading(false);
                    return;
          }

          if (data?.user) {
                    toast({
                                title: "تم تسجيل الدخول بنجاح",
                                description: "جاري التحويل...",
                    });

                  const userRole = data.user.user_metadata?.role || role || "staff";
                    const targetRoute = ROLE_ROUTES[userRole] || "/admin/dashboard";
                    navigate(targetRoute);
          }
        } catch (err) {
                setError("حدث خطأ غير متوقع. حاول مرة أخرى.");
                toast({
                          title: "خطأ",
                          description: "حدث خطأ غير متوقع",
                          variant: "destructive",
                });
        } finally {
                setLoading(false);
        }
  };

  return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4" dir="rtl">
              <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="w-full max-w-md"
                      >
                      <Card className="shadow-xl border-0">
                                <CardHeader className="text-center pb-2">
                                            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                                          <Shield className="w-8 h-8 text-blue-600" />
                                            </div>div>
                                            <CardTitle className="text-2xl font-bold text-gray-800">
                                                          تسجيل دخول الموظفين
                                            </CardTitle>CardTitle>
                                            <CardDescription className="text-gray-500">
                                                          الخط الأول للخدمات اللوجستية
                                            </CardDescription>CardDescription>
                                </CardHeader>CardHeader>
                                <CardContent>
                                            <form onSubmit={handleLogin} className="space-y-4">
                                                          <div className="space-y-2">
                                                                          <Label htmlFor="email" className="flex items-center gap-2 text-gray-700">
                                                                                            <Mail className="w-4 h-4" />
                                                                                            البريد الإلكتروني
                                                                          </Label>Label>
                                                                          <Input
                                                                                              id="email"
                                                                                              type="email"
                                                                                              placeholder="example@fll.sa"
                                                                                              value={email}
                                                                                              onChange={(e) => setEmail(e.target.value)}
                                                                                              required
                                                                                              className="text-right"
                                                                                              dir="ltr"
                                                                                            />
                                                          </div>div>
                                            
                                                          <div className="space-y-2">
                                                                          <Label htmlFor="password" className="flex items-center gap-2 text-gray-700">
                                                                                            <Lock className="w-4 h-4" />
                                                                                            كلمة المرور
                                                                          </Label>Label>
                                                                          <div className="relative">
                                                                                            <Input
                                                                                                                  id="password"
                                                                                                                  type={showPassword ? "text" : "password"}
                                                                                                                  placeholder="أدخل كلمة المرور"
                                                                                                                  value={password}
                                                                                                                  onChange={(e) => setPassword(e.target.value)}
                                                                                                                  required
                                                                                                                  className="text-right pr-10"
                                                                                                                  dir="ltr"
                                                                                                                />
                                                                                            <button
                                                                                                                  type="button"
                                                                                                                  onClick={() => setShowPassword(!showPassword)}
                                                                                                                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                                                                                >
                                                                                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                                                              </button>button>
                                                                          </div>div>
                                                          </div>div>
                                            
                                              {error && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm text-center">
                                          {error}
                                        </div>div>
                                                          )}
                                            
                                                          <Button
                                                                            type="submit"
                                                                            className="w-full bg-[#1a365d] hover:bg-[#2a4a7f] text-white py-3 text-lg"
                                                                            disabled={loading || !email || !password}
                                                                          >
                                                            {loading ? (
                                                                                              <span className="flex items-center gap-2">
                                                                                                                  <Loader2 className="w-5 h-5 animate-spin" />
                                                                                                                  جاري تسجيل الدخول...
                                                                                                </span>span>
                                                                                            ) : (
                                                                                              <span className="flex items-center gap-2">
                                                                                                                  <User className="w-5 h-5" />
                                                                                                                  تسجيل الدخول
                                                                                                </span>span>
                                                                          )}
                                                          </Button>Button>
                                            </form>form>
                                
                                            <div className="mt-6 pt-4 border-t border-gray-100">
                                                          <p className="text-xs text-gray-400 text-center">
                                                                          جميع البيانات محفوظة بسرية تامة ولن تستخدم إلا لأغراض العمل
                                                          </p>p>
                                            </div>div>
                                </CardContent>CardContent>
                      </Card>Card>
              </motion.div>motion.div>
        </div>div>
      );
}</div>
