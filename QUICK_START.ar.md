# 🚀 دليل البدء السريع - Quick Start Guide

مرحباً بك في نظام فيرست لاين لوجستيكس!

---

## 📋 المتطلبات الأساسية

### للمطورين:
- ✅ Node.js 18 أو أحدث
- ✅ npm أو pnpm
- ✅ Git
- ✅ محرر نصوص (VS Code مُفضل)

### للإدارة:
- ✅ حساب AWS
- ✅ حساب Cloudflare
- ✅ حساب Anthropic (Claude AI)
- ✅ نطاق fll.sa

---

## ⚡ التثبيت السريع (5 دقائق)

### الخطوة 1: استنساخ المشروع

```bash
git clone https://github.com/mshari-11/firstlinelog.com.git
cd firstlinelog.com
```

### الخطوة 2: تثبيت المكتبات

```bash
# باستخدام npm
npm install

# أو باستخدام pnpm (أسرع)
pnpm install
```

### الخطوة 3: إعداد البيئة

```bash
# نسخ ملف البيئة
cp .env.example .env

# تحرير الملف وإضافة المفاتيح الفعلية
nano .env
# أو
code .env
```

### الخطوة 4: تشغيل التطوير

```bash
npm run dev
# أو
pnpm dev
```

افتح المتصفح على: `http://localhost:5173`

---

## 🔑 إعداد المفاتيح (API Keys)

### 1. Claude AI

```bash
# احصل على API Key من:
https://console.anthropic.com/

# أضفها في .env:
CLAUDE_API_KEY=your_actual_key_here
```

### 2. AWS Services

```bash
# PostgreSQL
DATABASE_URL=postgresql://user:pass@your-rds.amazonaws.com:5432/db

# Redis
REDIS_URL=redis://your-elasticache.amazonaws.com:6379

# S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=firstline-documents
```

### 3. Cloudflare

```bash
CLOUDFLARE_API_TOKEN=your_token
CLOUDFLARE_ZONE_ID=your_zone_id
```

### 4. Monitoring

```bash
# DataDog
DATADOG_API_KEY=your_datadog_key

# Sentry
SENTRY_DSN=your_sentry_dsn
```

---

## 📁 هيكل المشروع

```
firstlinelog.com/
├── .env                    # المفاتيح (لا تُرفع على Git)
├── .env.example            # نموذج البيئة
├── package.json            # المكتبات
├── vite.config.ts          # إعدادات Vite
│
├── src/
│   ├── App.tsx            # التطبيق الرئيسي
│   ├── main.tsx           # نقطة الدخول
│   ├── index.css          # الأنماط العامة
│   │
│   ├── api/               # استدعاءات API
│   ├── components/        # مكونات React
│   ├── pages/             # الصفحات
│   ├── hooks/             # React Hooks
│   ├── lib/               # مكتبات مساعدة
│   └── data/              # بيانات ثابتة
│
├── docs/                   # التوثيق
│   ├── README.md          # فهرس التوثيق
│   ├── INFRASTRUCTURE.ar.md
│   ├── CLAUDE_AI_INTEGRATION.md
│   ├── EXCEL_UPLOAD_SYSTEM.ar.md
│   └── DOMAIN_SETUP.md
│
└── public/                # ملفات عامة
    ├── images/
    └── fonts/
```

---

## 🛠️ الأوامر المتاحة

### التطوير

```bash
# تشغيل التطوير
npm run dev
# أو
pnpm dev

# فتح على شبكة محلية
npm run dev -- --host
```

### البناء

```bash
# بناء للإنتاج
npm run build

# معاينة البناء
npm run preview
```

### الفحص والاختبار

```bash
# فحص TypeScript
npx tsc --noEmit

# فحص ESLint
npm run lint
```

---

## 📚 قراءة التوثيق

### وثائق أساسية (اقرأها أولاً):

1. **[docs/README.md](./docs/README.md)**
   - نظرة عامة على جميع الوثائق
   - دليل سريع للبدء

2. **[docs/INFRASTRUCTURE.ar.md](./docs/INFRASTRUCTURE.ar.md)**
   - شرح البنية التحتية الكاملة
   - التكاليف والفوائد
   - خطة التنفيذ

### وثائق تقنية:

3. **[docs/CLAUDE_AI_INTEGRATION.md](./docs/CLAUDE_AI_INTEGRATION.md)**
   - تكامل الذكاء الاصطناعي
   - أمثلة الكود

4. **[docs/EXCEL_UPLOAD_SYSTEM.ar.md](./docs/EXCEL_UPLOAD_SYSTEM.ar.md)**
   - نظام رفع Excel
   - حسابات الرواتب

5. **[docs/DOMAIN_SETUP.md](./docs/DOMAIN_SETUP.md)**
   - إعداد النطاق
   - Cloudflare

---

## 🌐 إعداد النطاق

### الإعداد الحالي:

```
CNAME: www.fll.sa
```

### للربط مع Cloudflare:

اتبع الخطوات في: [docs/DOMAIN_SETUP.md](./docs/DOMAIN_SETUP.md)

---

## 🎯 الخطوات القادمة

### للمطورين:

- [ ] اقرأ `docs/INFRASTRUCTURE.ar.md` لفهم البنية
- [ ] راجع `src/App.tsx` لفهم التطبيق
- [ ] اقرأ `docs/CLAUDE_AI_INTEGRATION.md` للذكاء الاصطناعي
- [ ] ابدأ بتطوير الميزات

### للإدارة:

- [ ] راجع `docs/INFRASTRUCTURE.ar.md` للتكاليف
- [ ] راجع `docs/EXCEL_UPLOAD_SYSTEM.ar.md` للآلية
- [ ] اعتماد خطة التنفيذ (12 أسبوع)
- [ ] إعداد حسابات AWS و Cloudflare

---

## ❓ الأسئلة الشائعة

### س: كيف أحصل على Claude API Key؟

**ج:** 
1. اذهب إلى: https://console.anthropic.com/
2. سجل حساب جديد
3. انتقل إلى API Keys
4. اضغط "Create Key"
5. انسخ المفتاح وضعه في `.env`

### س: كم تكلفة التشغيل الشهرية؟

**ج:** حوالي **$950/شهر** تشمل:
- AWS Services: $385
- Cloudflare: $200
- Monitoring: $330
- AI: $30-35

### س: متى يمكن إطلاق النظام؟

**ج:** حسب خطة التنفيذ: **12 أسبوع** (3 أشهر)

### س: هل النظام آمن؟

**ج:** نعم! يستخدم:
- ✅ تشفير SSL/TLS
- ✅ AWS VPC الآمنة
- ✅ WAF و DDoS Protection
- ✅ التشفير في قاعدة البيانات

### س: كيف أرفع ملف Excel؟

**ج:** راجع: [docs/EXCEL_UPLOAD_SYSTEM.ar.md](./docs/EXCEL_UPLOAD_SYSTEM.ar.md)

---

## 📞 الدعم والمساعدة

### للدعم التقني:
- **Email:** tech@fll.sa
- **الموقع:** www.fll.sa

### للاستفسارات العامة:
- **Email:** info@fll.sa
- **الدعم:** support@fll.sa

### المطورين:
- **GitHub Issues:** [Create Issue](https://github.com/mshari-11/firstlinelog.com/issues)
- **Pull Requests:** [Create PR](https://github.com/mshari-11/firstlinelog.com/pulls)

---

## 🎉 مبروك!

أنت الآن جاهز للبدء في تطوير نظام فيرست لاين لوجستيكس!

### الخطوة التالية:
```bash
# ابدأ التطوير
npm run dev

# افتح التوثيق
cat docs/README.md
```

---

**آخر تحديث:** فبراير 2026  
**الإصدار:** 1.0  
**الحالة:** ✅ جاهز للبدء

**تم إعداده بواسطة:** فريق التطوير - فيرست لاين لوجستيكس
