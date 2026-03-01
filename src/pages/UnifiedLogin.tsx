/**
 * تسجيل الدخول الموحد - Email + Password
 * للإدارة والموظفين
 */
import { useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Lock, Shield, CheckCircle, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://djebhztfewjfyyoortvv.supabase.co';

const ROLE_ROUTES: Record<string, string> = {
  admin: "/admin/dashboard",
  super_admin: "/admin/dashboard",
  finance: "/admin-panel/finance",
  hr: "/admin-panel/staff",
  fleet: "/admin-panel/vehicles",
  ops: "/admin-panel/orders",
  staff: "/admin-panel/dashboard",
  courier: "/courier/portal",
  driver: "/driver",
};

const roleLabels: Record<string, string> = {
  admin: "الإدارة",
  staff: "الموظفين",
  driver: "السائقين",
  courier: "المندوبين",
  finance: "المالية",
  hr: "الموارد البشرية",
  fleet: "الأسطول",
  ops: "العمليات",
};

export default function UnifiedLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "staff";
  const { toast } = useToast();
  const { login } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email.trim()) {
      setError("الرجاء إدخال البريد الإلكتروني");
      return;
    }
    if (!password.trim()) {
      setError("الرجاء إدخال كلمة المرور");
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/login-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password,
          role 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        setError(data.error || "فشل تسجيل الدخول");
        return;
      }
      
      // تسجيل الدخول في Context
      login(
        {
          id: data.user.id,
          phone: data.user.phone || '',
          name: data.user.name,
          role: data.user.role,
        },
        {
          token: data.session.token,
          expires_at: data.session.expires_at,
        }
      );
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً ${data.user.name}`,
      });
      
      // التوجيه حسب الدور
      const targetRoute = ROLE_ROUTES[data.user.role] || ROLE_ROUTES[role] || "/admin/dashboard";
      navigate(targetRoute);
      
    } catch (err) {
      console.error('Login error:', err);
      setError("خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }, [email, password, role, login, navigate, toast]);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-lg">
            <CardHeader className="text-center pb-2 pt-8">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <User className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-800">
                تسجيل الدخول
              </CardTitle>
              <CardDescription className="text-slate-500 mt-2">
                أدخل بياناتك للدخول إلى منصة فيرست لاين
              </CardDescription>
              {role && (
                <span className="inline-block mt-3 px-4 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-200">
                  {roleLabels[role] ?? role}
                </span>
              )}
            </CardHeader>
            
            <CardContent className="pt-6 pb-8 px-6">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
              
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-medium">
                    البريد الإلكتروني
                  </Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input 
                      id="email" 
                      type="email" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      placeholder="example@fll.sa" 
                      className="pr-11 h-12 text-base border-slate-200 focus:border-blue-500 focus:ring-blue-500" 
                      dir="ltr" 
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 font-medium">
                    كلمة المرور
                  </Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      placeholder="••••••••" 
                      className="pr-11 pl-11 h-12 text-base border-slate-200 focus:border-blue-500 focus:ring-blue-500" 
                      dir="ltr" 
                      disabled={loading}
                      autoComplete="current-password"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(s => !s)} 
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-base shadow-lg shadow-blue-500/25 transition-all duration-200" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin ml-2" />
                      جاري تسجيل الدخول...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 ml-2" />
                      تسجيل الدخول
                    </>
                  )}
                </Button>
              </form>
              
              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-center text-xs text-slate-400 mb-4">
                  نظام موحد لجميع مستخدمي فيرست لاين
                </p>
                <div className="flex justify-center gap-8 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    تشفير متقدم
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    حماية كاملة
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    آمن 100%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* رابط تسجيل دخول السائقين */}
          {role !== 'driver' && (
            <div className="mt-4 text-center">
              <a 
                href="/login?role=driver" 
                className="text-white/70 hover:text-white text-sm underline transition-colors"
              >
                سائق؟ سجل دخولك برقم الجوال
              </a>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
