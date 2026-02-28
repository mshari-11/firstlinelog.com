/* Login - OTP disabled */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Mail, Lock, Loader2, Eye, EyeOff, Truck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('يرجى إدخال البريد الإلكتروني وكلمة المرور'); return; }
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      if (data?.user) {
        const role = data.user.user_metadata?.role || 'driver';
        toast.success('تم تسجيل الدخول بنجاح');
        if (role === 'courier') { navigate('/courier/portal'); } else { navigate('/driver/dashboard'); }
      }
    } catch (err: any) {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      toast.error('فشل تسجيل الدخول');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4" dir="rtl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
              <Truck className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">تسجيل دخول المناديب</CardTitle>
            <CardDescription className="text-gray-500">أدخل بيانات حسابك للوصول إلى لوحة التحكم</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pr-10 text-left" dir="ltr" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10 pl-10" dir="ltr" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center">{error}</div>}
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base" disabled={loading}>
                {loading ? (<><Loader2 className="ml-2 h-4 w-4 animate-spin" />جاري تسجيل الدخول...</>) : ('تسجيل الدخول')}
              </Button>
            </form>
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-500">ليس لديك حساب؟{' '}<a href="/register" className="text-green-600 hover:underline font-medium">سجل كمندوب جديد</a></p>
              <p className="text-sm text-gray-500">موظف؟{' '}<a href="/unified-login" className="text-blue-600 hover:underline font-medium">دخول الموظفين</a></p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
