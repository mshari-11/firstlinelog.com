# تكامل الذكاء الاصطناعي Claude
# Claude AI Integration

## نظرة عامة

هذا المستند يشرح كيفية دمج Claude 3 Opus AI في نظام فيرست لاين لوجستيكس.

---

## ⚙️ إعدادات API

### تفاصيل Claude 3 Opus

**مفتاح API:**
```
# احصل على مفتاح API من: https://console.anthropic.com/
# أضفه في ملف .env كـ CLAUDE_API_KEY
```

**النموذج:** `claude-3-opus-20240229`

**رابط API:** `https://api.anthropic.com`

**الحد الأقصى للـ Tokens:** 4096

### متغيرات البيئة

أضف التالي إلى ملف `.env`:

```env
# إعدادات Claude AI
# احصل على مفتاح API من: https://console.anthropic.com/
CLAUDE_API_KEY=your_claude_api_key_here
CLAUDE_MODEL=claude-3-opus-20240229
CLAUDE_MAX_TOKENS=4096
CLAUDE_TEMPERATURE=0.7
CLAUDE_API_VERSION=2023-06-01
```

---

## 💡 حالات الاستخدام

### 1. توليد الكود تلقائياً (Prisma ORM)

Claude يمكنه توليد Prisma schema والاستعلامات تلقائياً:

```typescript
// مثال: توليد Prisma schema من المتطلبات
const generatePrismaSchema = async (requirements: string) => {
  const response = await claude.messages.create({
    model: process.env.CLAUDE_MODEL,
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: `Generate a Prisma schema for: ${requirements}`
    }]
  });
  return response.content;
};
```

**الفائدة:**
- ✅ لا حاجة لمعرفة SQL
- ✅ توليد سريع ودقيق
- ✅ توفير الوقت في التطوير
- ✅ أقل أخطاء برمجية

---

### 2. روبوت الدعم الفني (Chatbot)

معالجة استفسارات المناديب على مدار الساعة:

```typescript
// مثال: الرد على أسئلة المناديب
const handleCourierQuery = async (question: string, context: object) => {
  const response = await claude.messages.create({
    model: process.env.CLAUDE_MODEL,
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: `السياق: ${JSON.stringify(context)}\n\nالسؤال: ${question}\n\nقدم إجابة مفيدة بالعربية.`
    }]
  });
  return response.content;
};
```

**أمثلة الاستخدام:**
```
مندوب: "كم راتبي هذا الشهر؟"
Claude: "راتبك هذا الشهر هو 4,500 ريال سعودي. 
        أكملت 150 طلب بإجمالي إيرادات 6,750 ريال."

مندوب: "متى يتم صرف الراتب؟"
Claude: "يتم صرف الرواتب في اليوم الخامس من كل شهر.
        راتب هذا الشهر سيصرف في 5 مارس 2026."
```

**الفوائد:**
- ✅ دعم 24/7 بدون موظفين
- ✅ ردود فورية
- ✅ يفهم اللغة العربية بطلاقة
- ✅ يتذكر سياق المحادثة

---

### 3. تحليل البيانات وإنشاء التقارير

تحليل بيانات المناديب وإنشاء رؤى ذكية:

```typescript
// مثال: إنشاء تقرير شهري
const generateMonthlyReport = async (data: object) => {
  const response = await claude.messages.create({
    model: process.env.CLAUDE_MODEL,
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: `حلل بيانات المناديب التالية وقدم رؤى بالعربية: ${JSON.stringify(data)}`
    }]
  });
  return response.content;
};
```

**مثال على التحليل:**
```typescript
const courierData = {
  totalCouriers: 150,
  totalOrders: 22500,
  totalRevenue: 675000,
  averageOrdersPerCourier: 150,
  topPlatform: "Jahez"
};

const analysis = await generateMonthlyReport(courierData);
// النتيجة:
// "التحليل الشهري:
//  - إجمالي المناديب: 150 مندوب
//  - إجمالي الطلبات: 22,500 طلب (نمو 12% عن الشهر الماضي)
//  - الإيرادات: 675,000 ريال
//  - متوسط الطلبات لكل مندوب: 150 طلب
//  - المنصة الأكثر نشاطاً: جاهز (Jahez)
//  
//  التوصيات:
//  1. مكافأة أفضل 10 مناديب
//  2. تدريب المناديب الجدد
//  3. زيادة التركيز على منطقة الرياض"
```

**الفوائد:**
- ✅ تحليل ذكي للبيانات
- ✅ رؤى قابلة للتنفيذ
- ✅ توصيات مبنية على البيانات
- ✅ توفير وقت فريق التحليل

---

### 4. معالجة ملفات Excel

تنظيف ومعالجة بيانات Excel اليومية:

```typescript
// مثال: تنظيف بيانات Excel
const cleanExcelData = async (rawData: string) => {
  const response = await claude.messages.create({
    model: process.env.CLAUDE_MODEL,
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: `نظف بيانات Excel التالية:
      - وحد أسماء المناديب
      - صحح أرقام الجوال
      - تحقق من صحة الأرقام
      
      البيانات: ${rawData}`
    }]
  });
  return response.content;
};
```

**مثال على التنظيف:**
```
البيانات الأولية:
- اسم: "احمد  محمد123"
- جوال: "0501234567"
- طلبات: "150"

بعد التنظيف:
- اسم: "أحمد محمد"
- جوال: "966501234567"
- طلبات: 150
```

**الفوائد:**
- ✅ تنظيف تلقائي للبيانات
- ✅ توحيد التنسيق
- ✅ اكتشاف الأخطاء
- ✅ توفير وقت الموظفين

---

### 5. شرح العقود والسياسات

شرح العقود المعقدة بلغة بسيطة:

```typescript
// مثال: شرح بنود العقد
const explainContract = async (contractText: string) => {
  const response = await claude.messages.create({
    model: process.env.CLAUDE_MODEL,
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: `اشرح بنود العقد التالية بلغة عربية بسيطة: ${contractText}`
    }]
  });
  return response.content;
};
```

**مثال:**
```
بند العقد:
"يحق للطرف الأول إنهاء العقد بإشعار مسبق 30 يوماً..."

الشرح البسيط:
"الشركة تقدر تلغي العقد، لكن لازم تخبرك قبل شهر."
```

**الفوائد:**
- ✅ فهم أفضل للعقود
- ✅ شفافية أكثر
- ✅ تقليل سوء الفهم
- ✅ رضا المناديب

---

## 🔧 التطبيق العملي

### إعداد عميل Claude الأساسي

```typescript
// src/lib/claude.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export class ClaudeAI {
  /**
   * دردشة عامة مع Claude
   */
  async chat(message: string, systemPrompt?: string) {
    try {
      const response = await anthropic.messages.create({
        model: process.env.CLAUDE_MODEL || 'claude-3-opus-20240229',
        max_tokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '4096'),
        temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || '0.7'),
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: message
        }]
      });

      return response.content[0].text;
    } catch (error) {
      console.error('خطأ في Claude AI:', error);
      throw error;
    }
  }

  /**
   * توليد كود برمجي
   */
  async generateCode(prompt: string) {
    const systemPrompt = `أنت مبرمج خبير. ولّد كود برمجي نظيف وجاهز للإنتاج.`;
    return this.chat(prompt, systemPrompt);
  }

  /**
   * الرد بالعربية
   */
  async answerInArabic(question: string, context?: object) {
    const systemPrompt = `أنت مساعد ذكي لشركة فيرست لاين لوجستيكس. أجب باللغة العربية بشكل واضح ومفيد.`;
    const fullPrompt = context 
      ? `السياق: ${JSON.stringify(context, null, 2)}\n\nالسؤال: ${question}`
      : question;
    
    return this.chat(fullPrompt, systemPrompt);
  }

  /**
   * تحليل البيانات
   */
  async analyzeData(data: object, analysisType: string) {
    const systemPrompt = `أنت محلل بيانات. قدم رؤى بالعربية.`;
    const prompt = `نوع التحليل: ${analysisType}\n\nالبيانات:\n${JSON.stringify(data, null, 2)}\n\nقدم تحليل مفصل بالعربي.`;
    
    return this.chat(prompt, systemPrompt);
  }
}

export const claude = new ClaudeAI();
```

---

## 📊 أمثلة الاستخدام

### مثال 1: استعلام عن الراتب

```typescript
import { claude } from '@/lib/claude';

// مندوب يسأل عن راتبه
const courierQuery = async (courierId: string, question: string) => {
  // جلب بيانات المندوب
  const courierData = await db.courier.findUnique({
    where: { id: courierId },
    include: {
      orders: true,
      salary: true
    }
  });

  // سؤال Claude
  const answer = await claude.answerInArabic(question, courierData);
  
  return answer;
};

// الاستخدام
const answer = await courierQuery('courier-123', 'كم راتبي هذا الشهر؟');
console.log(answer);
// النتيجة: "راتبك هذا الشهر هو 4,500 ريال سعودي. أكملت 150 طلب..."
```

---

### مثال 2: توليد Prisma Schema

```typescript
import { claude } from '@/lib/claude';

const createPrismaSchema = async () => {
  const requirements = `
    نريد قاعدة بيانات لنظام إدارة المناديب تحتوي على:
    - جدول المناديب (اسم، رقم جوال، هوية، حالة)
    - جدول الطلبات (رقم، تاريخ، مبلغ، منصة)
    - جدول الرواتب (مندوب، مبلغ، تاريخ)
    - علاقات بين الجداول
  `;

  const schema = await claude.generateCode(
    `Generate a Prisma schema for: ${requirements}`
  );

  return schema;
};
```

**النتيجة:**
```prisma
model Courier {
  id        String   @id @default(cuid())
  name      String
  phone     String   @unique
  nationalId String  @unique
  status    String   // "active", "inactive"
  createdAt DateTime @default(now())
  
  orders    Order[]
  salaries  Salary[]
}

model Order {
  id         String   @id @default(cuid())
  orderNumber String  @unique
  date       DateTime
  amount     Float
  platform   String   // "Jahez", "HungerStation"
  courierId  String
  courier    Courier  @relation(fields: [courierId], references: [id])
}

model Salary {
  id        String   @id @default(cuid())
  amount    Float
  date      DateTime
  courierId String
  courier   Courier  @relation(fields: [courierId], references: [id])
}
```

---

### مثال 3: معالجة رفع Excel اليومي

```typescript
import { claude } from '@/lib/claude';

const processExcelUpload = async (excelData: any[]) => {
  // استخدام Claude لتنظيف وتوحيد البيانات
  const prompt = `
    نظف هذه البيانات من ملف Excel:
    - وحد أسماء المناديب
    - تحقق من صحة الأرقام
    - أزل السطور الفارغة
    - قياسي التواريخ
    
    البيانات:
    ${JSON.stringify(excelData, null, 2)}
    
    أرجع JSON نظيف
  `;

  const cleanedData = await claude.chat(prompt);
  return JSON.parse(cleanedData);
};
```

---

## ⚠️ حدود الاستخدام (Rate Limits)

### الحدود الرسمية:

- **الطلبات في الدقيقة:** 50
- **الـ Tokens في الدقيقة:** 40,000
- **الـ Tokens في اليوم:** 300,000

### أفضل الممارسات:

#### 1. التخزين المؤقت (Caching)

```typescript
const cache = new Map();

const getCachedResponse = async (
  key: string, 
  generator: () => Promise<string>
) => {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const response = await generator();
  cache.set(key, response);
  
  // حذف من الـ cache بعد ساعة
  setTimeout(() => cache.delete(key), 3600000);
  
  return response;
};

// الاستخدام
const answer = await getCachedResponse(
  'faq-salary',
  () => claude.answerInArabic('متى يتم صرف الراتب؟')
);
```

#### 2. معالجة الأخطاء

```typescript
try {
  const response = await claude.chat(message);
  return response;
} catch (error) {
  if (error.status === 429) {
    // تجاوز حد الاستخدام - انتظر وأعد المحاولة
    await delay(5000);
    return claude.chat(message);
  }
  
  if (error.status === 500) {
    // خطأ في الخادم
    console.error('خطأ في خادم Claude:', error);
    return 'عذراً، حدث خطأ. يرجى المحاولة لاحقاً.';
  }
  
  throw error;
}
```

#### 3. إدارة الـ Tokens

```typescript
const countTokens = (text: string): number => {
  // تقريباً: 1 token ≈ 4 أحرف
  return Math.ceil(text.length / 4);
};

const optimizePrompt = (prompt: string, maxTokens: number): string => {
  const tokens = countTokens(prompt);
  
  if (tokens <= maxTokens) {
    return prompt;
  }
  
  // قص النص إذا كان طويلاً جداً
  const ratio = maxTokens / tokens;
  const maxChars = Math.floor(prompt.length * ratio * 0.9); // 90% للأمان
  
  return prompt.substring(0, maxChars) + '...';
};
```

---

## 🔒 الأمان والخصوصية

### 1. حماية مفتاح API

```typescript
// ✅ صحيح - استخدام متغيرات البيئة
const apiKey = process.env.CLAUDE_API_KEY;

// ❌ خطأ - لا تكتب المفتاح مباشرة
const apiKey = 'sk-ant-...';
```

**أفضل الممارسات:**
- ✅ احفظ في متغيرات البيئة
- ✅ لا تدفع للـ Git
- ✅ دوّر المفاتيح بانتظام
- ❌ لا تعرضه في الـ client-side

### 2. خصوصية البيانات

```typescript
// ✅ صحيح - إزالة البيانات الحساسة
const sanitizeData = (data: any) => {
  return {
    ...data,
    nationalId: undefined,  // إزالة رقم الهوية
    phone: data.phone ? '***' + data.phone.slice(-4) : undefined  // إخفاء الجوال
  };
};

const analysis = await claude.analyzeData(
  sanitizeData(courierData),
  'monthly-performance'
);
```

**إرشادات:**
- ✅ لا ترسل أرقام الهويات
- ✅ لا ترسل أرقام الجوال الكاملة
- ✅ أخفِ البيانات الحساسة
- ✅ سجّل كل التفاعلات للمراجعة

### 3. التحقق من المدخلات

```typescript
const validateInput = (input: string): boolean => {
  // تحقق من الطول
  if (input.length > 10000) {
    return false;
  }
  
  // تحقق من المحتوى الضار
  const dangerousPatterns = [
    /<script>/i,
    /javascript:/i,
    /on\w+=/i
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(input));
};

// الاستخدام
if (validateInput(userMessage)) {
  const response = await claude.chat(userMessage);
} else {
  throw new Error('مدخل غير صالح');
}
```

---

## 📈 المراقبة والتسجيل

### تسجيل التفاعلات

```typescript
// تسجيل كل تفاعل مع Claude
const logClaudeInteraction = async (
  userId: string,
  prompt: string,
  response: string,
  tokens: number
) => {
  await db.aiLog.create({
    data: {
      userId,
      service: 'claude',
      prompt: prompt.substring(0, 1000), // قص للحفظ
      response: response.substring(0, 1000),
      tokens,
      timestamp: new Date()
    }
  });
};

// الاستخدام
const response = await claude.chat(message);
await logClaudeInteraction(userId, message, response, countTokens(message + response));
```

### مراقبة الاستخدام

```typescript
// Dashboard لمراقبة استخدام Claude
const getClaudeUsageStats = async (startDate: Date, endDate: Date) => {
  const stats = await db.aiLog.aggregate({
    where: {
      service: 'claude',
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    },
    _sum: {
      tokens: true
    },
    _count: true
  });
  
  return {
    totalRequests: stats._count,
    totalTokens: stats._sum.tokens,
    estimatedCost: calculateCost(stats._sum.tokens)
  };
};
```

---

## 💰 تقدير التكلفة

### أسعار Claude 3 Opus:

- **المدخلات (Input):** $15 لكل مليون token
- **المخرجات (Output):** $75 لكل مليون token

### مثال حسابي:

```
الافتراضات:
- 10,000 استعلام شهرياً
- متوسط 500 token للمدخلات لكل استعلام
- متوسط 200 token للمخرجات لكل استعلام

تكلفة المدخلات:  10,000 × 500 / 1,000,000 × $15  = $75
تكلفة المخرجات: 10,000 × 200 / 1,000,000 × $75  = $150
                                           الإجمالي = $225/شهر
```

### نصائح لتوفير التكلفة:

1. **استخدام الـ Cache:**
   - احفظ الأسئلة الشائعة
   - قلل الاستعلامات المكررة

2. **تحسين الطلبات:**
   - استخدم prompts أقصر
   - حدد max_tokens بدقة

3. **دمج الطلبات:**
   - اجمع استعلامات متشابهة
   - استخدم batch processing

4. **استخدام Claude Sonnet للمهام البسيطة:**
   - Claude 3 Sonnet: $3/$15 (أرخص بكثير)
   - استخدمه للاستعلامات البسيطة

---

## 🧪 الاختبار

### اختبار أساسي

```typescript
import { claude } from '@/lib/claude';

describe('Claude AI Integration', () => {
  it('يجب أن يرد بالعربية', async () => {
    const answer = await claude.answerInArabic('مرحبا، كيف حالك؟');
    expect(answer).toContain('مرحبا');
    expect(answer.length).toBeGreaterThan(10);
  });

  it('يجب أن يولد كود', async () => {
    const code = await claude.generateCode(
      'Create a TypeScript function to calculate salary'
    );
    expect(code).toContain('function');
    expect(code).toContain('salary');
  });

  it('يجب أن يحلل البيانات', async () => {
    const data = {
      couriers: 150,
      orders: 22500,
      revenue: 675000
    };
    
    const analysis = await claude.analyzeData(data, 'monthly');
    expect(analysis).toContain('150');
    expect(analysis).toContain('22500');
  });
});
```

### اختبار معالجة الأخطاء

```typescript
it('يجب معالجة أخطاء Rate Limit', async () => {
  // محاكاة خطأ rate limit
  jest.spyOn(claude, 'chat').mockRejectedValueOnce({
    status: 429,
    message: 'Rate limit exceeded'
  });

  // يجب أن يعيد المحاولة
  const result = await claude.chat('test message');
  expect(result).toBeDefined();
});
```

---

## 📞 الدعم والموارد

### الموارد الرسمية:

- **التوثيق:** https://docs.anthropic.com
- **API Reference:** https://docs.anthropic.com/claude/reference
- **حالة الخدمة:** https://status.anthropic.com
- **الدعم:** support@anthropic.com

### المجتمع:

- **Discord:** https://discord.gg/anthropic
- **GitHub Discussions:** https://github.com/anthropics/anthropic-sdk-typescript/discussions

---

## ✅ قائمة التحقق للتطبيق

### الإعداد الأولي:
- [ ] إنشاء حساب على https://console.anthropic.com/
- [ ] الحصول على API key
- [ ] إضافة API key للـ .env
- [ ] تثبيت مكتبة @anthropic-ai/sdk
- [ ] إعداد Claude client في المشروع

### التطوير:
- [ ] إنشاء مساعد للدعم الفني
- [ ] تطبيق توليد الكود للـ Prisma
- [ ] إضافة تحليل البيانات
- [ ] معالجة ملفات Excel
- [ ] شرح العقود والسياسات

### الأمان:
- [ ] حماية API key
- [ ] إزالة البيانات الحساسة
- [ ] التحقق من المدخلات
- [ ] تسجيل التفاعلات

### المراقبة:
- [ ] تتبع الاستخدام
- [ ] مراقبة التكلفة
- [ ] تنبيهات للأخطاء
- [ ] إحصائيات الأداء

### الاختبار:
- [ ] اختبارات الوحدة
- [ ] اختبارات التكامل
- [ ] اختبار معالجة الأخطاء
- [ ] اختبار الأداء

---

## 🎯 الخلاصة

Claude AI يوفر:

✅ **توليد كود تلقائي** - لا حاجة لخبرة SQL  
✅ **دعم فني 24/7** - بدون موظفين إضافيين  
✅ **تحليل ذكي** - رؤى قابلة للتنفيذ  
✅ **معالجة Excel** - توفير الوقت والجهد  
✅ **شرح بسيط** - فهم أفضل للعقود

**التكلفة المتوقعة:** ~$225/شهر لـ 10,000 استعلام

**جاهز للتطبيق:** ✅

---

**تاريخ التحديث:** فبراير 2026  
**الإصدار:** 1.0  
**الحالة:** مكتمل ✅  
**المؤلف:** فريق التطوير - فيرست لاين لوجستيكس
