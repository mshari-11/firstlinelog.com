# مراجعة الكود — صفحات التقييمات والملاحظات (Admin Feedbacks)

> **التاريخ:** 2026-04-01
> **الملفات:** `StatsCard.tsx` · `FeedbackTable.tsx` · `Feedbacks.tsx`
> **المراجع:** Claude Code Review

---

## 1. `src/components/admin/StatsCard.tsx`

### 🟡 تحذير — عدم وجود `React` import (سطر 6)

**الوصف:** الملف يستخدم `React.ElementType` في الـ interface لكن لا يوجد `import React` بشكل صريح. في بيئات معينة (خاصة مع `isolatedModules`) قد يسبب مشكلة.

**الإصلاح المقترح:**
```tsx
// سطر 6 — إضافة import
import React from "react";
import { motion } from "framer-motion";
```

---

### 🟢 معلومة — غياب `aria-label` على بطاقة الإحصائيات (سطر 31–87)

**الوصف:** المكون `motion.div` لا يحتوي على `role` أو `aria-label`، مما يجعله غير مقروء لقارئات الشاشة كوحدة معنوية.

**الإصلاح المقترح:**
```tsx
<motion.div
  variants={fadeUp}
  role="group"
  aria-label={title}
  style={{...}}
>
```

---

### 🟢 معلومة — الـ trend badge لا يحتوي على `aria-label` (سطر 57–71)

**الوصف:** نسبة التغيير (`+4.2%`) تُعرض بصرياً فقط. قارئ الشاشة لن يفهم السياق.

**الإصلاح المقترح:**
```tsx
<span
  aria-label={`${trend.value >= 0 ? "ارتفاع" : "انخفاض"} ${Math.abs(trend.value)}% ${trend.label}`}
  style={{...}}
>
```

---

### 🟡 تحذير — عدم استخدام `React.memo` (الملف كامل)

**الوصف:** `StatsCard` يُستخدم داخل grid مع 4+ بطاقات. عند تغيير أي state في الصفحة الأم (مثل `search` أو `filterStatus`)، جميع البطاقات تُعاد رسمها بدون داعٍ لأن الـ props لا تتغير عادةً عند الفلترة.

**الإصلاح المقترح:**
```tsx
export const StatsCard = React.memo(function StatsCard({
  icon: Icon,
  title,
  value,
  subtitle,
  trend,
  color = "#3b82f6",
}: StatsCardProps) {
  // ... نفس المحتوى
});
```

---

## 2. `src/components/admin/FeedbackTable.tsx`

### 🔴 حرج — ثغرة XSS محتملة عند عرض `comment` (سطر 229)

**الوصف:** حالياً التعليق يُعرض كـ text content داخل `<td>` وهو آمن في React. لكن إذا تم تغييره لاحقاً لاستخدام `dangerouslySetInnerHTML` أو عرض HTML، ستكون هناك ثغرة. الخطر الحالي **منخفض** لكن يُفضل إضافة sanitization كطبقة حماية إضافية.

**الحالة:** آمن حالياً (React يقوم بـ escape تلقائي) — لكن يجب الحذر عند أي تعديل مستقبلي.

---

### 🔴 حرج — عدم وجود `aria-label` على `<input>` البحث (سطر 139–153)

**الوصف:** حقل البحث لا يحتوي على `aria-label` أو `<label>` مرتبط. هذا يجعله غير قابل للوصول لقارئات الشاشة وينتهك معايير WCAG 2.1.

**الإصلاح المقترح:**
```tsx
<input
  type="text"
  placeholder="بحث بالاسم أو التعليق أو رقم الطلب..."
  aria-label="بحث في التقييمات"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  style={{...}}
/>
```

---

### 🔴 حرج — عدم وجود `aria-label` على `<select>` الفلترة (سطر 155–173)

**الوصف:** عنصر `<select>` للفلترة لا يحتوي على `aria-label`.

**الإصلاح المقترح:**
```tsx
<select
  value={filterStatus}
  onChange={(e) => setFilterStatus(e.target.value)}
  aria-label="تصفية حسب الحالة"
  style={{...}}
>
```

---

### 🟡 تحذير — عدم وجود `aria-sort` على أعمدة الفرز (سطر 182، 190)

**الوصف:** الأعمدة القابلة للفرز (`التقييم` و `التاريخ`) لا تُعلن حالة الفرز لقارئات الشاشة.

**الإصلاح المقترح:**
```tsx
<th
  style={thStyle}
  onClick={() => toggleSort("rating")}
  aria-sort={sortField === "rating" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
>
```

---

### 🟡 تحذير — عدم إمكانية التنقل بلوحة المفاتيح لأزرار الفرز (سطر 182، 190)

**الوصف:** عناصر `<th>` بها `onClick` لكن بدون `tabIndex` أو `onKeyDown`، مما يمنع مستخدمي لوحة المفاتيح من الفرز.

**الإصلاح المقترح:**
```tsx
<th
  style={thStyle}
  onClick={() => toggleSort("rating")}
  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleSort("rating"); }}
  tabIndex={0}
  role="columnheader button"
>
```

---

### 🟡 تحذير — أداء: الفلترة والفرز تُعاد حسابها عند كل render (سطر 53–67)

**الوصف:** العمليتان `filter` و `sort` تعملان على كامل المصفوفة عند كل إعادة رسم، حتى لو لم تتغير البيانات. مع بيانات كبيرة (مئات أو آلاف التقييمات) ستكون هناك مشكلة أداء.

**الإصلاح المقترح:**
```tsx
import { useState, useMemo } from "react";

const filtered = useMemo(() => {
  return data
    .filter((item) => {
      const matchSearch = !search || /* ... */;
      const matchStatus = filterStatus === "all" || item.status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortField === "rating") return (a.rating - b.rating) * mul;
      return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * mul;
    });
}, [data, search, filterStatus, sortField, sortDir]);
```

---

### 🟡 تحذير — عدم وجود Pagination (الملف كامل)

**الوصف:** الجدول يعرض جميع النتائج دفعة واحدة بدون تقسيم صفحات. مع بيانات حقيقية (مئات/آلاف التقييمات) سيكون الأداء ضعيفاً والتجربة سيئة.

**الإصلاح المقترح:** إضافة pagination بسيط (مثل 20 عنصر لكل صفحة) أو استخدام virtual scrolling.

---

### 🟢 معلومة — `StarRating` يُعاد إنشاؤه عند كل render (سطر 32–45)

**الوصف:** المكون `StarRating` معرّف داخل نفس الملف وهو بسيط، لكن يمكن تحسينه بـ `React.memo` لتجنب إعادة الرسم غير الضرورية.

---

### 🟡 تحذير — زر "عرض" بدون `aria-label` وصفي (سطر 250–267)

**الوصف:** زر العرض يحتوي فقط على أيقونة + نص "عرض" بدون سياق. قارئ الشاشة سيقرأ "عرض" فقط بدون معرفة أي تقييم.

**الإصلاح المقترح:**
```tsx
<button
  onClick={() => onView?.(item)}
  aria-label={`عرض تفاصيل تقييم ${item.customer_name}`}
  style={{...}}
>
```

---

## 3. `src/pages/admin/Feedbacks.tsx`

### 🔴 حرج — عدم وجود Authorization header في fetch (سطر 125–126)

**الوصف:** طلب الـ API لا يُرسل `Authorization` header رغم أن `useAuth` مستورد ومتاح. هذا يعني أن أي شخص يعرف الـ endpoint يمكنه الوصول للبيانات.

**الإصلاح المقترح:**
```tsx
const fetchFeedbacks = useCallback(async () => {
  setLoading(true);
  try {
    const res = await fetch(`${API_BASE}/feedbacks`, {
      headers: {
        "Content-Type": "application/json",
        ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
      },
    });
    // ...
  }
}, [user]);
```

---

### 🔴 حرج — ثغرة CSV Injection في التصدير (سطر 154–169)

**الوصف:** دالة `handleExport` تُدرج بيانات المستخدم (الاسم والتعليق) مباشرة في CSV بدون تنظيف. إذا بدأ تعليق بـ `=`, `+`, `-`, أو `@`، فبرنامج Excel سيُنفذه كصيغة (Formula Injection)، مما قد يؤدي لتنفيذ أوامر ضارة على جهاز المستخدم.

**مثال خطير:** تعليق بقيمة `=CMD|'/C calc'!A0` سيفتح الآلة الحاسبة في Windows.

**الإصلاح المقترح:**
```tsx
function sanitizeCSV(value: string): string {
  // منع CSV injection
  if (/^[=+\-@\t\r]/.test(value)) {
    return `'${value}`;
  }
  return value;
}

const handleExport = () => {
  const csv = [
    "الاسم,التقييم,التعليق,التصنيف,الحالة,التاريخ",
    ...feedbacks.map(
      (f) =>
        `"${sanitizeCSV(f.customer_name)}",${f.rating},"${sanitizeCSV(f.comment)}","${sanitizeCSV(f.category)}","${f.status}","${f.created_at}"`
    ),
  ].join("\n");
  // ...
};
```

---

### 🟡 تحذير — `useAuth` مستورد لكن `user` غير مُستخدم (سطر 23، 117)

**الوصف:** المتغير `user` يُستخرج من `useAuth()` لكن لا يُستخدم في أي مكان. هذا يسبب إعادة رسم غير ضرورية عند تغيير حالة المصادقة، ويُنتج تحذير من linter.

**الإصلاح المقترح:** إما إزالة `const { user } = useAuth()` إذا لم يكن مطلوباً، أو استخدامه فعلياً (مثل إرسال token في الـ API request كما ذُكر أعلاه).

---

### 🟡 تحذير — trend value ثابت (hardcoded) (سطر 246)

**الوصف:** قيمة `trend={{ value: 4.2, label: "عن الشهر الماضي" }}` ثابتة ولا تتغير مع البيانات الحقيقية. هذا يُعطي انطباعاً مُضللاً للمستخدم.

**الإصلاح المقترح:** حساب النسبة من بيانات الشهر الحالي مقارنة بالشهر السابق، أو إزالة الـ trend حتى يتوفر API يدعم ذلك.

---

### 🟡 تحذير — عدم وجود `URL.revokeObjectURL` فوري بعد الاستخدام (سطر 168)

**الوصف:** يتم استدعاء `URL.revokeObjectURL(url)` بعد `a.click()` مباشرة. في بعض المتصفحات، الـ click قد يكون async والتحميل لم يبدأ بعد عند الـ revoke. الأفضل تأخير الـ revoke.

**الإصلاح المقترح:**
```tsx
a.click();
setTimeout(() => URL.revokeObjectURL(url), 1000);
```

---

### 🟢 معلومة — تكرار كود StarRating في Modal (سطر 273–281)

**الوصف:** نفس منطق عرض النجوم مكتوب مرتين: مرة في `FeedbackTable.tsx` (كمكون `StarRating`) ومرة في الـ Modal داخل `Feedbacks.tsx`. يُفضل إعادة استخدام المكون الموجود.

**الإصلاح المقترح:**
```tsx
// في Feedbacks.tsx — استيراد StarRating من FeedbackTable
// أو نقل StarRating لملف منفصل واستيراده في المكانين
```

---

### 🟢 معلومة — عدم وجود Error Boundary (الملف كامل)

**الوصف:** الصفحة لا تحتوي على Error Boundary. إذا حدث خطأ في أي مكون فرعي (مثل بيانات غير صالحة من الـ API)، الصفحة كاملة ستتعطل.

**الإصلاح المقترح:** لف المكون بـ `ErrorBoundary` أو استخدام `try/catch` في الـ render للأجزاء الحرجة.

---

### 🟢 معلومة — لا يوجد حالة Loading ظاهرة (سطر 119)

**الوصف:** المتغير `loading` موجود ويُستخدم لتعطيل زر التحديث فقط. لا يوجد skeleton أو spinner يظهر أثناء تحميل البيانات.

---

## ملخص

| الملف | 🔴 حرج | 🟡 تحذير | 🟢 معلومة |
|-------|--------|----------|-----------|
| `StatsCard.tsx` | 0 | 2 | 2 |
| `FeedbackTable.tsx` | 2 | 4 | 1 |
| `Feedbacks.tsx` | 2 | 3 | 3 |
| **المجموع** | **4** | **9** | **6** |

### الأولويات العاجلة:
1. **CSV Injection** — إضافة sanitization لبيانات التصدير (خطر أمني حقيقي)
2. **Authorization header** — إرسال token مع طلبات الـ API
3. **Accessibility** — إضافة `aria-label` لحقل البحث وعنصر الفلترة
4. **Performance** — استخدام `useMemo` للفلترة والفرز + إضافة pagination
