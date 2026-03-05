/**
 * صفحة تسجيل الدخول / إنشاء حساب — نظام الموظفين والمناديب
 * FirstLine Logistics — fll.sa
 * navy + أبيض + رمادي — نظام: هوية + كلمة مرور + OTP إيميل
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { User, Lock, Eye, EyeOff, LogIn, UserPlus, IdCard, Globe, MapPin, Mail, Phone as PhoneIcon, Building2, CreditCard, Shield, Loader2 } from 'lucide-react';
import { Layout } from '@/components/Layout';

const API_BASE = 'https://xr7wsfym5k.execute-api.me-south-1.amazonaws.com';
const SUPPORT_EMAIL = 'support@fll.sa';
const NATIONALITIES = ["سعودي","مصري","سوري","أردني","لبناني","فلسطيني","يمني","سوداني","باكستاني","هندي","بنغلاديشي","فلبيني","أخرى"];
const CITIES = ["الرياض","جدة","مكة المكرمة","المدينة المنورة","الدمام","الخبر","الظهران","الطائف","بريدة","تبوك","خميس مشيط","حائل","الجبيل","الخرج","أبها","ينبع","القطيف","الأحساء","نجران","الباحة","عرعر","سكاكا","جازان"];
const CONTRACTS = ["تحت كفالة الشركة","متعاقد تحت التجربة"];
const APPS = ["هنقرستيشن","طلبات","جاهز","مرسول","كريم","أوبر","كارفور","نعناع","تطبيق آخر"];
const BANKS = ["البنك الأهلي السعودي","بنك الرياض","بنك الراجحي","ساب","البنك السعودي الفرنسي","البنك السعودي للاستثمار","بنك الجزيرة","البنك العربي الوطني","بنك سامبا","البنك السعودي البريطاني","بنك الإنماء","البنك الأول","بنك البلاد","بنك الخليج","مصرف الإنماء","بنك آخر"];

function useCaptcha() {
  const [q, sQ] = useState({ a: 0, b: 0, op: '+' as '+' | '-' });
  const gen = useCallback(() => {
    const a = Math.floor(Math.random() * 15) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    const op = ['+', '-'][Math.floor(Math.random() * 2)] as '+' | '-';
    sQ({ a, b, op });
  }, []);
  useEffect(() => { gen(); const iv = setInterval(gen, 30000); return () => clearInterval(iv); }, [gen]);
  const answer = q.op === '+' ? q.a + q.b : q.a - q.b;
  return { question: `ما هو ناتج ${q.a} ${q.op} ${q.b}؟`, answer, refresh: gen };
}

async function apiPost(path: string, body: Record<string, unknown>) {
  try {
    const r = await fetch(`${API_BASE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json();
    return { ok: r.ok, data: d };
  } catch { return { ok: false, data: { message: 'خطأ في الاتصال بالخادم' } }; }
}

export default function Login() {
  const [tab, setTab] = useState('login');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [agree, setAgree] = useState(false);
  const cap = useCaptcha();
  const { login: authLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [f, sF] = useState({ nid:'', pw:'', email:'', code:'', name:'', phone:'', nat:'', city:'', contract:'', app:'', bank:'', bankAcc:'', iban:'', captcha:'' });
  const u = (k: string, v: string) => sF(p => ({ ...p, [k]: v }));

  useEffect(() => { if (isAuthenticated) navigate('/driver'); }, [isAuthenticated, navigate]);

  async function doLogin() {
    setError(''); setSuccess('');
    if (!f.nid || !f.pw) return setError('رقم الهوية وكلمة المرور مطلوبان');
    setLoading(true);
    const { ok, data } = await apiPost('/auth/login', { username: f.nid, password: f.pw });
    setLoading(false);
    if (!ok) {
      if (data.needsVerification) { setOtpEmail(data.email || f.nid); setOtpMode(true); setSuccess('يجب تأكيد الحساب — تحقق من بريدك'); }
      else setError(data.message || 'خطأ في تسجيل الدخول');
    } else {
      authLogin({ id: data.username || f.nid, name: data.name, email: data.email, role: 'driver' }, { token: data.accessToken || data.token, expires_at: new Date(Date.now()+86400000).toISOString() });
      toast.success('تم تسجيل الدخول بنجاح'); navigate('/driver');
    }
  }

  async function doRegister() {
    setError('');
    if (!f.name) return setError('الاسم الكامل مطلوب');
    if (f.nid.length !== 10 || !/^[12]/.test(f.nid)) return setError('رقم الهوية: 10 أرقام يبدأ بـ 1 أو 2');
    if (!f.nat) return setError('اختر الجنسية');
    if (!f.city) return setError('اختر مدينة العمل');
    if (!f.email || !f.email.includes('@')) return setError('البريد الإلكتروني غير صحيح');
    if (!f.phone) return setError('رقم الهاتف مطلوب');
    if (!f.pw || f.pw.length < 8) return setError('كلمة المرور: 8 أحرف على الأقل');
    if (parseInt(f.captcha) !== cap.answer) return setError('إجابة سؤال التحقق غير صحيحة');
    if (!agree) return setError('يجب الموافقة على الشروط والأحكام');
    setLoading(true);
    const phone = f.phone.startsWith('+') ? f.phone : '+966' + f.phone.replace(/^0/, '');
    const { ok, data } = await apiPost('/auth/register', { username: f.nid, email: f.email, password: f.pw, name: f.name, phone });
    setLoading(false);
    if (!ok) {
      if ((data.message||'').includes('مسجل') || (data.message||'').includes('Exists')) setError(`رقم الهوية مرتبط ببريد آخر — تواصل مع ${SUPPORT_EMAIL}`);
      else setError(data.message || 'خطأ في التسجيل');
    } else { setOtpEmail(f.email); setOtpMode(true); setSuccess('تم إنشاء الحساب! تحقق من بريدك لرمز التأكيد'); }
  }

  async function doVerify() {
    if (!f.code || f.code.length < 4) return setError('أدخل رمز التحقق');
    setLoading(true);
    const { ok, data } = await apiPost('/auth/verify', { email: otpEmail, username: otpEmail, code: f.code });
    setLoading(false);
    if (!ok) setError(data.message || 'رمز غير صحيح');
    else { setSuccess('تم تأكيد الحساب!'); setOtpMode(false); setTab('login'); toast.success('تم التأكيد'); }
  }

  if (otpMode) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8" dir="rtl">
        <Card className="w-full max-w-md shadow-lg border">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-3"><User className="w-7 h-7 text-primary" /></div>
            <CardTitle className="text-xl font-bold text-primary">تأكيد الحساب</CardTitle>
            <CardDescription>أدخل رمز التحقق المرسل إلى <strong className="text-primary">{otpEmail}</strong></CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
            {success && <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">{success}</div>}
            <div className="space-y-2"><Label>رمز التحقق</Label><Input placeholder="أدخل الرمز" value={f.code} onChange={e => u('code', e.target.value)} maxLength={6} className="text-center text-2xl tracking-[0.5em] font-bold" /></div>
            <Button onClick={doVerify} disabled={loading} className="w-full">{loading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}تأكيد الحساب</Button>
            <div className="flex justify-center gap-4 text-sm">
              <button onClick={async () => { const { data } = await apiPost('/auth/resend', { email: otpEmail, username: otpEmail }); setSuccess(data.message || 'تم إرسال رمز جديد'); }} className="text-primary hover:underline">إعادة إرسال الرمز</button>
              <button onClick={() => setOtpMode(false)} className="text-muted-foreground hover:underline">رجوع</button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12" dir="rtl">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4"><User className="w-8 h-8 text-primary" /></div>
              <CardTitle className="text-3xl font-bold text-primary">نظام الموظفين والمناديب</CardTitle>
              <CardDescription className="text-lg">الخط الأول للخدمات اللوجستية</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={tab} onValueChange={setTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" className="flex items-center gap-2"><LogIn className="w-4 h-4" />تسجيل الدخول</TabsTrigger>
                  <TabsTrigger value="register" className="flex items-center gap-2"><UserPlus className="w-4 h-4" />إنشاء حساب جديد</TabsTrigger>
                </TabsList>
                {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-4">{error}</div>}
                {success && <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm mb-4">{success}</div>}

                <TabsContent value="login" className="space-y-4">
                  <div className="space-y-2"><Label className="flex items-center gap-2"><IdCard className="w-4 h-4" />رقم الهوية (اسم المستخدم)</Label><Input placeholder="1234567890" value={f.nid} onChange={e => u('nid', e.target.value.replace(/\D/g,''))} maxLength={10} /></div>
                  <div className="space-y-2"><Label className="flex items-center gap-2"><Lock className="w-4 h-4" />كلمة المرور</Label><div className="relative"><Input placeholder="أدخل كلمة المرور" type={showPw ? 'text' : 'password'} value={f.pw} onChange={e => u('pw', e.target.value)} className="pr-10" /><button onClick={() => setShowPw(!showPw)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
                  <Button onClick={doLogin} disabled={loading} className="w-full h-12 text-lg">{loading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}<LogIn className="w-4 h-4 ml-2" />تسجيل الدخول</Button>
                  <div className="text-center"><a href="/forgot-password" className="text-sm text-primary hover:underline flex items-center justify-center gap-1"><Lock className="w-3 h-3" />نسيت كلمة المرور؟</a></div>
                </TabsContent>

                <TabsContent value="register" className="space-y-4">
                  <div className="space-y-2"><Label className="flex items-center gap-2"><User className="w-4 h-4" />الاسم الكامل (كما هو في الهوية)</Label><Input placeholder="أدخل الاسم الكامل" value={f.name} onChange={e => u('name', e.target.value)} /></div>
                  <div className="space-y-2"><Label className="flex items-center gap-2"><IdCard className="w-4 h-4" />رقم الهوية الوطنية / رقم الإقامة النظامية</Label><Input placeholder="1234567890" value={f.nid} onChange={e => u('nid', e.target.value.replace(/\D/g,''))} maxLength={10} /><p className="text-xs text-muted-foreground">يجب أن يبدأ بـ 1 أو 2 ويكون 10 أرقام</p></div>
                  <div className="space-y-2"><Label className="flex items-center gap-2"><Globe className="w-4 h-4" />الجنسية</Label><Select value={f.nat} onValueChange={v => u('nat', v)}><SelectTrigger><SelectValue placeholder="اختر الجنسية" /></SelectTrigger><SelectContent>{NATIONALITIES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label className="flex items-center gap-2"><MapPin className="w-4 h-4" />مدينة العمل</Label><Select value={f.city} onValueChange={v => u('city', v)}><SelectTrigger><SelectValue placeholder="اختر مدينة العمل" /></SelectTrigger><SelectContent>{CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label className="flex items-center gap-2"><Shield className="w-4 h-4" />حالة التعاقد</Label><Select value={f.contract} onValueChange={v => u('contract', v)}><SelectTrigger><SelectValue placeholder="اختر حالة التعاقد" /></SelectTrigger><SelectContent>{CONTRACTS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label className="flex items-center gap-2"><Mail className="w-4 h-4" />البريد الإلكتروني</Label><Input type="email" placeholder="example@email.com" value={f.email} onChange={e => u('email', e.target.value)} /></div>
                  <div className="space-y-2"><Label className="flex items-center gap-2"><Building2 className="w-4 h-4" />التطبيق الذي تعمل به</Label><Select value={f.app} onValueChange={v => u('app', v)}><SelectTrigger><SelectValue placeholder="اختر التطبيق" /></SelectTrigger><SelectContent>{APPS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label className="flex items-center gap-2"><CreditCard className="w-4 h-4" />اسم البنك</Label><Select value={f.bank} onValueChange={v => u('bank', v)}><SelectTrigger><SelectValue placeholder="اختر البنك" /></SelectTrigger><SelectContent>{BANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label className="flex items-center gap-2"><CreditCard className="w-4 h-4" />رقم الحساب البنكي</Label><Input placeholder="1234567890112345" value={f.bankAcc} onChange={e => u('bankAcc', e.target.value.replace(/\D/g,''))} /><p className="text-xs text-muted-foreground">أدخل رقم الحساب البنكي (10-20 رقم)</p></div>
                  <div className="space-y-2"><Label className="flex items-center gap-2"><CreditCard className="w-4 h-4" />رقم IBAN</Label><Input placeholder="SA1234567890123456789012" value={f.iban} onChange={e => u('iban', e.target.value.toUpperCase())} /><p className="text-xs text-muted-foreground">يجب أن يبدأ بـ SA ويكون 24 حرف/رقم</p></div>
                  <div className="space-y-2"><Label className="flex items-center gap-2"><PhoneIcon className="w-4 h-4" />رقم الهاتف</Label><Input placeholder="512345678" value={f.phone} onChange={e => u('phone', e.target.value.replace(/\D/g,''))} maxLength={10} /><p className="text-xs text-muted-foreground">يمكنك إدخال الرقم بصيغة: 512345678 أو 0512345678</p></div>
                  <div className="p-3 rounded-lg bg-muted/50"><Label className="text-sm font-semibold">👤 اسم المستخدم (رقم الهوية)</Label><p className="text-sm text-primary font-semibold mt-1">{f.nid || 'سيتم تعبئته تلقائياً من رقم الهوية'}</p></div>
                  <div className="space-y-2"><Label className="flex items-center gap-2"><Lock className="w-4 h-4" />كلمة المرور</Label><div className="relative"><Input placeholder="أدخل كلمة المرور" type={showPw ? 'text' : 'password'} value={f.pw} onChange={e => u('pw', e.target.value)} className="pr-10" /><button onClick={() => setShowPw(!showPw)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
                  <div className="p-4 rounded-lg border bg-muted/30"><Label className="text-sm font-semibold mb-2 block">🔢 سؤال التحقق (يتغير كل 30 ثانية)</Label><p className="text-lg font-bold text-primary mb-2">{cap.question}</p><Input placeholder="أدخل الإجابة" value={f.captcha} onChange={e => u('captcha', e.target.value)} /><p className="text-xs text-muted-foreground mt-1">هذا السؤال يتغير تلقائياً كل 30 ثانية</p></div>
                  <div className="p-3 rounded-lg border bg-muted/30"><label className="flex gap-3 items-start cursor-pointer text-sm leading-relaxed"><input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="mt-1 w-4 h-4 flex-shrink-0" /><span>أتعهد بأن جميع المعلومات صحيحة ودقيقة. كما أوافق على <a href="/terms" className="text-primary font-bold hover:underline">شروط وأحكام الخدمة</a> و <a href="/privacy" className="text-primary font-bold hover:underline">سياسة الخصوصية</a> الخاصة بشركة الخط الأول للخدمات اللوجستية.</span></label></div>
                  <Button onClick={doRegister} disabled={loading || !agree} className="w-full h-12 text-lg">{loading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}<UserPlus className="w-4 h-4 ml-2" />إنشاء الحساب</Button>
                </TabsContent>
              </Tabs>
              <div className="mt-6 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm flex items-start gap-2"><Shield className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>ملاحظة مهمة: جميع البيانات المدخلة ستكون محفوظة بسرية تامة ولن تستخدم إلا لأغراض العمل والتواصل الرسمي مع الشركة</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}