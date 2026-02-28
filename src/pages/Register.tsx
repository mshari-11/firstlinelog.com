/* Register - OTP disabled */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Mail, Lock, User, Loader2, Eye, EyeOff, CheckCircle2, Truck, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 1 | 2 | 3;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);

  const passChecks = [
    { label: '8 أحرف على الأقل', pass: password.length >= 8 },
    { label: 'حرف كبير', pass: /[A-Z]/.test(password) },
    { label: 'حرف صغير', pass: /[a-z]/.test(password) },
    { label: 'رقم', pass: /[0-9]/.test(password) },
    { label: 'رمز خاص', pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const passScore = passChecks.filter((c) => c.pass).length;
  const passColor = passScore <= 2 ? 'bg-red-500' : passScore <= 3 ? 'bg-yellow-500' : 'bg-green-500';

  async function handleStep1() {
    if (!username.trim() || !email.trim()) { setError('يرجى ملء جميع الحقول'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError('اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام و _ فقط'); return; }
    setLoading(true); setError('');
    try {
      const { data: existing } = await supabase.from('users_2026_02_17_21_00').select('id').eq('username', username).maybeSingle();
      if (existing) { setError('اسم المستخدم مستخدم بالفعل'); setLoading(false); return; }
      setStep(2);
    } catch (err) { setError('حدث خطأ، حاول مرة أخرى'); } finally { setLoading(false); }
  }

  async function handleStep2() {
    if (!password || !confirmPass) { setError('يرجى ملء جميع الحقول'); return; }
    if (password !== confirmPass) { setError('كلمتا المرور غير متطابقتين'); return; }
    if (passScore < 3) { setError('كلمة المرور ضعيفة جداً'); return; }
    setLoading(true); setError('');
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email, password,
        options: { data: { username, full_name: username, role: 'driver' } },
      });
      if (signUpError) throw signUpError;
      if (data?.user) { toast.success('تم التسجيل بنجاح!'); setStep(3); }
    } catch (err: any) {
      if (err.message?.includes('already registered')) { setError('البريد الإلكتروني مسجل بالفعل'); }
      else { setError('حدث خطأ أثناء التسجيل، حاول مرة أخرى'); }
    } finally { setLoading(false); }
  }

  const steps = [{ num: 1, label: 'الهوية' }, { num: 2, label: 'الأمان' }];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4" dir="rtl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
              <Truck className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">تسجيل مندوب جديد</CardTitle>
            <CardDescription className="text-gray-500">أنشئ حسابك للانضمام إلى فريق التوصيل</CardDescription>
          </CardHeader>
          <CardContent>
            {step !== 3 && (
              <div className="flex items-center justify-center gap-2 mb-6">
                {steps.map((s, i) => (
                  <div key={s.num} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s.num ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                    </div>
                    <span className={`text-xs ${step >= s.num ? 'text-green-600 font-medium' : 'text-gray-400'}`}>{s.label}</span>
                    {i < steps.length - 1 && <div className={`w-12 h-0.5 ${step > s.num ? 'bg-green-600' : 'bg-gray-200'}`} />}
                  </div>
                ))}
              </div>
            )}
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 text-center">معلومات الحساب</h3>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">اسم المستخدم</label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input type="text" placeholder="أحرف إنجليزية وأرقام و _ فقط" value={username} onChange={(e) => setUsername(e.target.value)} className="pr-10" dir="ltr" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pr-10 text-left" dir="ltr" />
                    </div>
                  </div>
                  {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center">{error}</div>}
                  <Button onClick={handleStep1} className="w-full bg-green-600 hover:bg-green-700 text-white h-12" disabled={loading}>
                    {loading ? (<><Loader2 className="ml-2 h-4 w-4 animate-spin" />جاري التحقق...</>) : (<>التالي<ArrowLeft className="mr-2 h-4 w-4" /></>)}
                  </Button>
                </motion.div>
              )}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 text-center">كلمة المرور</h3>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">كلمة المرور</label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10 pl-10" dir="ltr" />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex gap-1">{[1,2,3,4,5].map((i) => (<div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= passScore ? passColor : 'bg-gray-200'}`} />))}</div>
                    <div className="grid grid-cols-2 gap-1">{passChecks.map((c) => (<span key={c.label} className={`text-xs ${c.pass ? 'text-green-600' : 'text-gray-400'}`}>{c.pass ? '✓' : '○'} {c.label}</span>))}</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">تأكيد كلمة المرور</label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} className="pr-10" dir="ltr" />
                    </div>
                  </div>
                  {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center">{error}</div>}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setStep(1); setError(''); }} className="flex-1 h-12"><ArrowRight className="ml-2 h-4 w-4" />رجوع</Button>
                    <Button onClick={handleStep2} className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12" disabled={loading}>
                      {loading ? (<><Loader2 className="ml-2 h-4 w-4 animate-spin" />جاري التسجيل...</>) : ('إنشاء الحساب')}
                    </Button>
                  </div>
                </motion.div>
              )}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4 py-6">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">تم التسجيل بنجاح!</h3>
                  <p className="text-gray-500 text-sm">يمكنك الآن تسجيل الدخول باستخدام بريدك الإلكتروني وكلمة المرور</p>
                  <Button onClick={() => navigate('/login?role=driver')} className="w-full bg-green-600 hover:bg-green-700 text-white h-12">اذهب لتسجيل الدخول</Button>
                </motion.div>
              )}
            </AnimatePresence>
            {step === 1 && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">لديك حساب؟{' '}<Link to="/login" className="text-green-600 hover:underline font-medium">سجل دخولك</Link></p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
