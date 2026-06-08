# تقرير الفحص الأمني الأسبوعي — FirstLine Logistics

**التاريخ:** 2026-06-08 (الإثنين) · فحص آلي مجدول

## الملخص التنفيذي

| البند | النتيجة |
|---|---|
| أسرار/مفاتيح مكشوفة في الكود | ✅ لا يوجد |
| `.env.local` في `.gitignore` | ✅ نعم (وغير متعقّب من git) |
| `console.log` داخل نطاق الإدارة المسموح | ✅ لا يوجد |
| ثغرات npm | ⚠️ 17 (6 high، 11 moderate، 0 critical) |
| حماية صفحات الإدارة في `App.tsx` | ⚠️ صُلِّحت — صفحتان قديمتان كانتا غير محميتين |

**عدد المشاكل:** 3 (ثغرة صلاحيات في المسارات + تلف في ملف App.tsx + console.log في ملفات auth مقفلة)
**أُصلح مباشرة:** 2 · **يحتاج قرارك:** 3

---

## 1. فحص الأسرار — ✅ نظيف

بحثت في `src` و `lambda-code` و `supabase` عن: `AKIA`, `sk_/pk_`, `ghp_`, `xai-`, و JWT (`eyJ`).
**لا توجد أي مفاتيح أو توكنات مكتوبة مباشرة في الكود.** كل النتائج كانت أسماء سياسات RLS، أو توثيق متغيرات بيئة، أو إصلاح أمني سابق (migration 022 الذي أزال JWT مكشوف ونقله إلى Vault).

## 2. `.gitignore` — ✅ سليم

`.env.local` و `.env` كلاهما داخل `.gitignore` (السطر 4 و 15)، وأكّدت أن git لا يتعقّب أيًّا منهما (`git ls-files` لم يجدهما).

## 3. `console.log` — لا تغيير (خارج النطاق المسموح)

وُجدت 6 جمل `console.log` فقط، **كلها في ملفات مقفلة/خارج نطاق الإدارة**:

- `src/lib/cognito.ts` — 5 جمل (ملف auth مقفل ⛔)
- `src/lib/react-router-dom-proxy.tsx` — جملة واحدة

لم أحذف أيًّا منها لأن `cognito.ts` ضمن ملفات OTP/Auth المقفلة التي تتطلب موافقتك. ⚠️ **ملاحظة:** جمل `cognito.ts` تطبع معرّفات الـ Pool/Client وحالة نجاح الدخول إلى الـ console — يُفضَّل إزالتها لاحقًا بموافقتك.

## 4. حماية المسارات — ⚠️ مشكلة وُجدت وأُصلحت

كل مسارات `/admin-panel/*` محمية بشكل صحيح (54 `AccessGuard` + 27 `PermissionGuard`). لكن مسارين قديمين كانا محاطين بـ `AdminAuthProvider` فقط **بدون أي تحقّق من الصلاحية/الدور**:

- `/admin` → `AdminDashboard` (لوحة تحكم كاملة)
- `/admin/drivers` → `AdminDrivers` (بيانات المناديب)

أي مستخدم مسجّل دخول (حتى لو لا يملك صلاحية) كان بإمكانه الوصول إليهما.

**الإصلاح المطبّق** في `src/App.tsx`:
```tsx
<Route path="/admin" element={
  <AdminAuthProvider>
    <AccessGuard roles={["admin", "owner", "staff"]}>
      <AdminDashboardLegacy />
    </AccessGuard>
  </AdminAuthProvider>
} />
<Route path="/admin/drivers" element={
  <AdminAuthProvider>
    <AccessGuard roles={["admin", "owner"]}>   {/* بيانات حساسة */}
      <AdminDriversLegacy />
    </AccessGuard>
  </AdminAuthProvider>
} />
```

## 5. تلف في ملف App.tsx — أُصلح

اكتشفت أثناء البناء أن نسخة العمل من `src/App.tsx` كانت **مقطوعة من النهاية** (تنقص 4 أسطر إغلاق: `<Route path="*">`, `</Routes>`, `</Suspense>` … إلخ) مع تعليق `FALLBACK` تالف البايتات. أعدت بناء نهاية الملف لتطابق نسخة HEAD تمامًا، وحوّلت تعليق `FALLBACK` من رموز الإطار إلى `=` (وظيفيًا متطابق). بدون هذا الإصلاح كان `npm run build` يفشل.

## 6. ثغرات npm — 17 (0 حرجة)

| الخطورة | الحزمة | الإصلاح المتاح |
|---|---|---|
| high | axios | ✅ تلقائي |
| high | fast-uri | ✅ تلقائي |
| high | fast-xml-builder | ✅ تلقائي |
| high | amazon-cognito-identity-js | ⛔ ترقية major (ملف auth مقفل) |
| high | js-cookie | ⛔ تابع لـ cognito |
| high | xlsx | ❌ لا إصلاح متاح |
| moderate | postcss, react-router(-dom), ws, uuid, mermaid, fast-xml-parser, @aws-sdk/xml-builder | ✅ تلقائي |
| moderate | vite, esbuild, lovable-tagger | ⛔ ترقية major |

---

## التوصيات

1. **شغّل `npm audit fix`** (بدون `--force`) — يصلح ~10 ثغرات بأمان دون تغييرات كاسرة. لم أشغّله في هذا التشغيل الآلي لتجنّب لمس `package-lock.json` بدون إشرافك (الشجرة تحتوي تبعية auth المقفلة).
2. **ثغرة `xlsx`** (Prototype Pollution) لا إصلاح لها — فكّر في الانتقال إلى `exceljs` أو عزل معالجة الملفات.
3. **ترقيات cognito / vite / esbuild** تتطلب major bump — تحتاج قرارك واختبار يدوي (cognito مقفل بالكامل).
4. **أزل `console.log` من `cognito.ts`** بموافقتك — يسرّب معلومات auth.
5. **مشكلة الـ commit:** الـ git index كان مقفولًا بـ `index.lock` من عملية على نظامك، ولم أستطع إزالته من البيئة المعزولة. **لم يتم عمل commit.** التغييرات محفوظة على القرص في `src/App.tsx` وجاهزة. شغّل يدويًا:
   ```
   git add src/App.tsx
   git commit -m "chore: weekly security auto-fix"
   git push origin main
   ```

## ملاحظة عن البناء

`npm run build` اجتاز مرحلة التحويل بالكامل (5039 module بدون أي خطأ) وفشل فقط في خطوة تنظيف مجلد `dist/` بخطأ `EPERM` (قيد صلاحيات على مجلد Windows المربوط — ليس خطأً في الكود). تحقّقت من صحة `App.tsx` مستقلًّا عبر esbuild (نجح، 0 أخطاء).
