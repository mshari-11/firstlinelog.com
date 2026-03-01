/**
 * صفحة تسجيل الدخول للسائقين عبر OTP
 * FirstLine Logistics
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Phone, ArrowLeft, Loader2, Truck, Shield } from 'lucide-react';
import { Layout } from '@/components/Layout';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://djebhztfewjfyyoortvv.supabase.co';

type Step = 'phone' | 'otp';

export default function Login() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'driver';

  // إذا مسجل دخول يروح للرئيسية
  useEffect(() => {
    if (isAuthenticated) navigate('/driver');
  }, [isAuthenticated, navigate]);

  // العد التنازلي لإعادة الإرسال
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // إرسال OTP
  const handleSendOTP = useCallback(async () => {
    const cleaned = phone.replace(/\s/g, '').replace(/[^0-9]/g, '');
    if (!cleaned || cleaned.length < 9) {
      toast.error('أدخل رقم جوال صحيح');
      return;
    }

    setLoading(true);
    setDebugCode(null);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleaned }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setStep('otp');
        setCountdown(60);
        toast.success('تم إرسال رمز التحقق');
        
        // في وضع التطوير، اعرض الكود
        if (result.debug_code) {
          setDebugCode(result.debug_code);
          console.log('Debug OTP:', result.debug_code);
        }
      } else {
        toast.error(result.error || 'فشل إرسال الرمز');
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      toast.error('حدث خطأ في الاتصال');
    }
    
    setLoading(false);
  }, [phone]);

  // التحقق من OTP
  const handleVerifyOTP = useCallback(async (code: string) => {
    if (code.length !== 6) return;
    
    setLoading(true);
    
    try {
      const cleaned = phone.replace(/\s/g, '').replace(/[^0-9]/g, '');
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleaned, code }),
      });
      
      const result = await response.json();
      
      if (result.verified) {
        // إنشاء بيانات المستخدم
        const userData = {
          id: result.user?.id || result.phone,
          phone: result.phone,
          name: result.user?.full_name || 'سائق',
          role: result.user?.role || 'driver',
        };
        
        const sessionData = {
          token: result.session_token,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
        
        login(userData, sessionData);
        toast.success(result.message || 'تم تسجيل الدخول بنجاح');
        
        // توجيه حسب الدور
        if (result.is_new_user) {
          navigate('/driver/profile');
        } else {
          navigate('/driver');
        }
      } else {
        toast.error(result.error || 'رمز التحقق غير صحيح');
        setOtp('');
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      toast.error('حدث خطأ في الاتصال');
    }
    
    setLoading(false);
  }, [phone, login, navigate]);

  // إعادة إرسال الكود
  const handleResend = useCallback(async () => {
    if (countdown > 0) return;
    setOtp('');
    setDebugCode(null);
    await handleSendOTP();
  }, [countdown, handleSendOTP]);

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-900 via-amber-800 to-yellow-900 px-4 py-8" dir="rtl">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-lg">
          <CardHeader className="text-center pb-2 pt-8">
            {/* Logo */}
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg">
              <Truck className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800">
              {step === 'phone' ? 'دخول السائقين' : 'رمز التحقق'}
            </CardTitle>
            <CardDescription className="text-base mt-2 text-slate-500">
              {step === 'phone'
                ? 'أدخل رقم جوالك لتسجيل الدخول'
                : `أدخل الرمز المرسل إلى ${phone}`}
            </CardDescription>
            {role && (
              <span className="inline-block mt-3 px-4 py-1.5 bg-orange-50 text-orange-700 text-sm font-medium rounded-full border border-orange-200">
                بوابة السائقين
              </span>
            )}
          </CardHeader>

          <CardContent className="pt-6 pb-8 px-6">
            {step === 'phone' ? (
              /* خطوة إدخال رقم الجوال */
              <div className="space-y-5">
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="tel"
                    placeholder="05xxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pr-11 text-lg h-14 text-right border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                    dir="ltr"
                    maxLength={15}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                  />
                </div>
                <Button
                  onClick={handleSendOTP}
                  disabled={loading || phone.replace(/\s/g, '').length < 9}
                  className="w-full h-14 text-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin ml-2" />
                  ) : null}
                  {loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
                </Button>
              </div>
            ) : (
              /* خطوة إدخال رمز التحقق */
              <div className="space-y-6">
                {/* عرض كود التطوير */}
                {debugCode && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-amber-600 mb-1">كود التطوير (للاختبار)</p>
                    <p className="text-2xl font-mono font-bold text-amber-700 tracking-widest">{debugCode}</p>
                  </div>
                )}
                
                <div className="flex justify-center" dir="ltr">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => {
                      setOtp(value);
                      if (value.length === 6) handleVerifyOTP(value);
                    }}
                    disabled={loading}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="h-14 w-12 text-xl border-slate-200" />
                      <InputOTPSlot index={1} className="h-14 w-12 text-xl border-slate-200" />
                      <InputOTPSlot index={2} className="h-14 w-12 text-xl border-slate-200" />
                      <InputOTPSlot index={3} className="h-14 w-12 text-xl border-slate-200" />
                      <InputOTPSlot index={4} className="h-14 w-12 text-xl border-slate-200" />
                      <InputOTPSlot index={5} className="h-14 w-12 text-xl border-slate-200" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {loading && (
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                  </div>
                )}

                <div className="text-center space-y-3">
                  <button
                    onClick={handleResend}
                    disabled={countdown > 0}
                    className="text-sm text-orange-600 hover:underline disabled:text-slate-400 disabled:no-underline"
                  >
                    {countdown > 0
                      ? `إعادة الإرسال بعد ${countdown} ثانية`
                      : 'إعادة إرسال الرمز'}
                  </button>

                  <div>
                    <button
                      onClick={() => {
                        setStep('phone');
                        setOtp('');
                        setDebugCode(null);
                      }}
                      className="text-sm text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      تغيير رقم الجوال
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex justify-center gap-6 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  آمن
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  OTP عبر SMS
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* رابط للموظفين */}
        <div className="absolute bottom-4 text-center w-full">
          <a 
            href="/unified-login?role=staff" 
            className="text-white/70 hover:text-white text-sm underline transition-colors"
          >
            موظف؟ سجل دخولك بالبريد الإلكتروني
          </a>
        </div>
      </div>
    </Layout>
  );
}
