/**
 * صفحة تسجيل الدخول عبر OTP - FirstLine Logistics
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { sendOTP, verifyOTP } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Phone, ArrowLeft, Loader2, Shield } from 'lucide-react';

type Step = 'phone' | 'otp';

export default function Login() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // إذا مسجل دخول يروح للرئيسية
  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  // العد التنازلي لإعادة الإرسال
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // إرسال OTP
  const handleSendOTP = async () => {
    const cleaned = phone.replace(/\s/g, '');
    if (!cleaned || cleaned.length < 9) {
      toast.error('أدخل رقم جوال صحيح');
      return;
    }

    setLoading(true);
    try {
      const result = await sendOTP(cleaned);
      if (result.success) {
        setStep('otp');
        setCountdown(60);
        toast.success('تم إرسال رمز التحقق');
        // في وضع التطوير، اعرض الكود
        if (result.debug_code) {
          console.log('Debug OTP:', result.debug_code);
          toast.info(`رمز التطوير: ${result.debug_code}`, { duration: 10000 });
        }
      } else {
        toast.error(result.error || 'فشل إرسال الرمز');
      }
    } catch {
      toast.error('حدث خطأ في الاتصال');
    }
    setLoading(false);
  };

  // التحقق من OTP
  const handleVerifyOTP = async (code: string) => {
    if (code.length !== 6) return;
    
    setLoading(true);
    try {
      const result = await verifyOTP(phone.replace(/\s/g, ''), code);
      if (result.success && result.user && result.session) {
        login(result.user, result.session);
        toast.success(result.message || 'تم تسجيل الدخول بنجاح');
        navigate('/');
      } else {
        toast.error(result.error || 'رمز التحقق غير صحيح');
        setOtp('');
      }
    } catch {
      toast.error('حدث خطأ في الاتصال');
    }
    setLoading(false);
  };

  // إعادة إرسال الكود
  const handleResend = async () => {
    if (countdown > 0) return;
    setOtp('');
    await handleSendOTP();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4" dir="rtl">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          {/* Logo */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {step === 'phone' ? 'تسجيل الدخول' : 'رمز التحقق'}
          </CardTitle>
          <CardDescription className="text-base mt-1">
            {step === 'phone'
              ? 'أدخل رقم جوالك لتسجيل الدخول أو إنشاء حساب'
              : `أدخل الرمز المرسل إلى ${phone}`}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {step === 'phone' ? (
            /* خطوة إدخال رقم الجوال */
            <div className="space-y-4">
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="05xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pr-10 text-lg h-12 text-right"
                  dir="ltr"
                  maxLength={15}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                />
              </div>
              <Button
                onClick={handleSendOTP}
                disabled={loading || phone.replace(/\s/g, '').length < 9}
                className="w-full h-12 text-lg"
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
                    <InputOTPSlot index={0} className="h-14 w-12 text-xl" />
                    <InputOTPSlot index={1} className="h-14 w-12 text-xl" />
                    <InputOTPSlot index={2} className="h-14 w-12 text-xl" />
                    <InputOTPSlot index={3} className="h-14 w-12 text-xl" />
                    <InputOTPSlot index={4} className="h-14 w-12 text-xl" />
                    <InputOTPSlot index={5} className="h-14 w-12 text-xl" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {loading && (
                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}

              <div className="text-center space-y-3">
                <button
                  onClick={handleResend}
                  disabled={countdown > 0}
                  className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
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
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    تغيير رقم الجوال
                  </button>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center mt-6">
            بتسجيل الدخول أنت توافق على شروط الاستخدام وسياسة الخصوصية
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
