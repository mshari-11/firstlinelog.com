# دليل واجهات برمجة التطبيقات — لوحة التحكم
# Admin Panel API Reference

> **آخر تحديث:** 2026-04-01
> **الإصدار:** 1.0
> **Base URL:** `https://k8d4arcxu4.execute-api.us-east-1.amazonaws.com`
> **المصادقة:** `Authorization: Bearer <cognito_token>`

---

## نظرة عامة

جميع الطلبات تُرسل إلى AWS API Gateway الذي يوجهها إلى Lambda `fll-platform-api-prod` (Node.js 18.x).
البيانات مخزنة في 39 جدول DynamoDB (PAY_PER_REQUEST).

### الهيكل العام للاستجابة

```json
// نجاح
{ "data": [...], "count": 25, "status": "ok" }

// خطأ
{ "error": "رسالة الخطأ", "status": "error", "code": 400 }
```

---

## 1. لوحة المعلومات (Dashboard)

### `GET /stats`
**الوصف:** استرجاع إحصائيات لوحة المعلومات الرئيسية (KPIs)

**الاستجابة:**
```json
{
  "stats": {
    "totalOrders": 1250,
    "activeDrivers": 48,
    "pendingComplaints": 12,
    "revenue": 45000,
    "deliveryRate": 94.5
  }
}
```

**مُستخدم في:** `src/stores/useDashboardStore.ts:63`

---

## 2. التقييمات والملاحظات (Feedbacks)

### `GET /feedbacks`
**الوصف:** استرجاع جميع تقييمات العملاء

**الاستجابة:**
```json
[
  {
    "id": "fb-001",
    "customer_name": "أحمد محمد",
    "rating": 5,
    "comment": "خدمة ممتازة",
    "category": "توصيل",
    "status": "new | reviewed | resolved",
    "created_at": "2026-03-30T14:20:00Z",
    "order_id": "ORD-4521",
    "driver_name": "خالد العتيبي"
  }
]
```

**مُستخدم في:** `src/pages/admin/Feedbacks.tsx:125`

---

## 3. الطلبات (Orders)

### `GET /api/orders`
**الوصف:** استرجاع قائمة الطلبات مع الفلترة والتقسيم

**المعاملات (Query):**
| المعامل | النوع | الوصف |
|---------|-------|-------|
| `status` | string | فلترة بالحالة: pending, in_progress, delivered, cancelled |
| `limit` | number | عدد النتائج (افتراضي: 50) |
| `offset` | number | بداية الصفحة |
| `date_from` | string | تاريخ البداية (ISO 8601) |
| `date_to` | string | تاريخ النهاية (ISO 8601) |

**جدول DynamoDB:** `fll-orders` — المفتاح: `orderId`

---

## 4. المندوبين والسائقين (Drivers)

### `GET /drivers`
**الوصف:** استرجاع قائمة السائقين

**المعاملات (Query):**
| المعامل | النوع | الوصف |
|---------|-------|-------|
| `limit` | number | عدد النتائج (افتراضي: 200) |
| `status` | string | active, inactive, pending |

### `POST /drivers`
**الوصف:** إضافة أو تعديل بيانات سائق

**الجسم (Body):**
```json
{
  "driverId": "string",
  "full_name": "string",
  "phone": "string",
  "email": "string",
  "status": "active"
}
```

**جدول DynamoDB:** `fll-drivers` — المفتاح: `driverId`

**مُستخدم في:** `src/pages/admin/Staff.tsx:2578`, `src/pages/admin/DriverClassifications.tsx:265`

---

## 5. الشكاوى (Complaints)

### `GET /api/complaints`
**الوصف:** استرجاع قائمة الشكاوى

### `GET /api/complaints/stats`
**الوصف:** إحصائيات الشكاوى (عدد جديد، مُعلق، مُحل)

### `POST /api/complaint-messages`
**الوصف:** إرسال رسالة رد على شكوى

**الجسم (Body):**
```json
{
  "complaintId": "string",
  "message": "string",
  "sender": "string"
}
```

**جدول DynamoDB:** `fll-complaints` — المفتاح: `complaintId`

**مُستخدم في:** `src/pages/admin/Complaints.tsx:303-442`

---

## 6. المالية (Finance)

### `GET /api/finance/close-history`
**الوصف:** سجل عمليات الإغلاق المالي اليومي

### `POST /api/finance/daily-close`
**الوصف:** تنفيذ إغلاق مالي يومي

### `GET /api/finance/monthly-reports`
**الوصف:** التقارير المالية الشهرية

### `GET /accounting-rules`
**الوصف:** استرجاع قواعد المحاسبة (الإضافات والخصومات)

### `POST /accounting-rules`
**الوصف:** إنشاء قاعدة محاسبية جديدة

**الجسم (Body):**
```json
{
  "name_ar": "بدل تشغيل",
  "component_type": "addition | deduction",
  "calc_method": "fixed | percentage",
  "amount": 500
}
```

### `PUT /accounting-rules/:id`
**الوصف:** تعديل قاعدة محاسبية

### `DELETE /accounting-rules/:id`
**الوصف:** حذف قاعدة محاسبية

**جدول DynamoDB:** `fll-accounting-rules` — المفتاح: `ruleId`

**مُستخدم في:** `src/pages/admin/AccountingComponents.tsx:89-214`

---

## 7. الرواتب والمدفوعات (Payroll & Payouts)

### `GET /payout-lines`
**الوصف:** استرجاع سطور المدفوعات

### `GET /api/payout-runs`
**الوصف:** استرجاع دفعات الرواتب مع مراحل الموافقة

### `POST /finance/generate-stc-excel`
**الوصف:** توليد ملف Excel لبنك STC

**الجسم (Body):**
```json
{
  "batchId": "string",
  "payouts": [
    { "reference": "string", "phone": "966XXXXXXXXX", "amount": 1500 }
  ]
}
```

**جدول DynamoDB:** `fll-payout-runs` — المفتاح: `runId`

**مُستخدم في:** `src/pages/admin/PayrollCalculator.tsx:430`, `src/stores/usePayoutWorkflowStore.ts:425`

---

## 8. الموظفين (Staff)

### `POST /admin/create-user`
**الوصف:** إنشاء مستخدم جديد (موظف أو مشرف)

**الجسم (Body):**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "admin | staff",
  "permissions": {
    "couriers": true,
    "orders": true,
    "finance": false,
    "complaints": true
  }
}
```

**جدول DynamoDB:** `fll-staff-users` — المفتاح: `sub`

**مُستخدم في:** `src/pages/admin/Staff.tsx:929-1391`

---

## 9. الإعدادات (Settings)

### `PUT /system-settings`
**الوصف:** تحديث إعدادات النظام

**الجسم (Body):**
```json
{
  "company_name": "string",
  "email": "string",
  "phone": "string",
  "settings": {}
}
```

**مُستخدم في:** `src/pages/admin/Settings.tsx:528`

---

## 10. العمليات التشغيلية (Operations)

### `GET /api/dispatch/available`
**الوصف:** استرجاع الطلبات المتاحة للتوزيع

### `GET /api/dispatch/active`
**الوصف:** استرجاع التوزيعات النشطة

### `POST /api/dispatch/assign`
**الوصف:** تعيين طلب لسائق

### `POST /api/dispatch/status`
**الوصف:** تحديث حالة التوزيع

### `GET /ops/health`
**الوصف:** فحص صحة البنية التحتية

**مُستخدم في:** `src/pages/admin/Dispatch.tsx:416-537`, `src/pages/admin/governance/InfrastructureOverview.tsx:359`

---

## 11. إدارة الأسطول (Fleet)

### `GET /fleet/vehicles`
**الوصف:** استرجاع مركبات الأسطول

### `POST /fleet/vehicles/:id/maintenance`
**الوصف:** تسجيل صيانة لمركبة

### `GET /fleet/assignments`
**الوصف:** استرجاع تعيينات الأسطول

### `POST /fleet/assignments/:id/unassign`
**الوصف:** إلغاء تعيين مركبة

**جدول DynamoDB:** `fll-vehicles` — المفتاح: `vehicleId`

**مُستخدم في:** `src/pages/admin/FleetManagement.tsx:131-144`, `src/pages/admin/FleetAssignments.tsx:111-124`

---

## 12. خدمات إضافية

### `GET /api/audit-log`
**الوصف:** سجل التدقيق — جدول `fll-audit-log` المفتاح: `auditId`

### `GET /api/tasks`
**الوصف:** استرجاع المهام

### `POST /api/tasks`
**الوصف:** إنشاء مهمة جديدة

### `GET /api/invoices`
**الوصف:** استرجاع الفواتير

### `GET /api/notifications`
**الوصف:** استرجاع الإشعارات — جدول `fll-notifications` المفتاح المركب: `recipient_sub` + `createdAt_id`

### `POST /api/notifications`
**الوصف:** إنشاء إشعار جديد

### `GET /api/attendance`
**الوصف:** استرجاع سجلات الحضور

### `GET /api/email-logs`
**الوصف:** سجلات البريد الإلكتروني

### `POST /api/email-resend`
**الوصف:** إعادة إرسال بريد إلكتروني

### `GET /api/account-reactivation`
**الوصف:** طلبات إعادة تفعيل الحسابات

### `POST /api/account-reactivation`
**الوصف:** معالجة طلب إعادة تفعيل

### `GET /api/marketplace/integrations`
**الوصف:** استرجاع تكاملات المتاجر

### `POST /api/marketplace/integrations`
**الوصف:** إنشاء تكامل جديد

### `POST /api/marketplace/sync/:id`
**الوصف:** مزامنة تكامل محدد

### `GET /api/sla/metrics`
**الوصف:** مؤشرات SLA

### `GET /api/risk-thresholds`
**الوصف:** حدود المخاطر المالية

---

## 13. الذكاء الاصطناعي (AI Chat)

### `POST /ai/chat` *(API منفصل)*
**Base URL:** `https://agr6khtuu9.execute-api.us-east-1.amazonaws.com`
**Lambda:** `fll-ai-chatbot` (Python 3.12, Bedrock Claude Haiku 4.5)

**الجسم (Body):**
```json
{
  "message": "string",
  "context": "admin | finance | operations"
}
```

---

## مرجع جداول DynamoDB

| الجدول | المفتاح الرئيسي | الوصف |
|--------|-----------------|-------|
| `fll-drivers` | `driverId` | بيانات السائقين |
| `fll-orders` | `orderId` | الطلبات |
| `fll-complaints` | `complaintId` | الشكاوى |
| `fll-vehicles` | `vehicleId` | المركبات |
| `fll-users` | `userId` | المستخدمين |
| `fll-staff-users` | `sub` | الموظفين (Cognito sub) |
| `fll-payout-runs` | `runId` | دفعات الرواتب |
| `fll-audit-log` | `auditId` | سجل التدقيق |
| `fll-accounting-rules` | `ruleId` | قواعد المحاسبة |
| `fll-notifications` | `recipient_sub` + `createdAt_id` | الإشعارات (مفتاح مركب) |

---

## أكواد الحالة (Status Codes)

| الكود | الوصف |
|-------|-------|
| `200` | نجاح |
| `201` | تم الإنشاء بنجاح |
| `400` | طلب غير صالح — بيانات ناقصة أو خاطئة |
| `401` | غير مُصادق — التوكن مفقود أو منتهي |
| `403` | غير مُصرح — الدور لا يملك الصلاحية |
| `404` | العنصر غير موجود |
| `429` | تجاوز حد الطلبات |
| `500` | خطأ داخلي في الخادم |

---

## نمط معالجة الأخطاء في الواجهة

جميع صفحات الـ Admin تتبع نمط **try/fetch/catch → keep fallback**:

```typescript
const [data, setData] = useState(MOCK_DATA); // بيانات تجريبية كافتراضي

const fetchData = useCallback(async () => {
  setLoading(true);
  try {
    const res = await fetch(`${API_BASE}/endpoint`);
    if (res.ok) {
      const result = await res.json();
      if (Array.isArray(result) && result.length > 0) {
        setData(result); // استبدال البيانات التجريبية
      }
    }
  } catch {
    // الاحتفاظ بالبيانات التجريبية عند الفشل
  } finally {
    setLoading(false);
  }
}, []);
```

---

## ملاحظات مهمة

1. **Timeout:** الحد الأقصى لـ API Gateway هو 30 ثانية
2. **المنطقة:** جميع الخدمات في `us-east-1` (Virginia)
3. **المصادقة:** التوكن من Cognito Pool `us-east-1_qHMox2NTB`
4. **البريد الإلكتروني:** يُرسل دائماً بشكل async عبر SES من `no-reply@fll.sa`
5. **الـ Email دائماً:** `.toLowerCase().trim()` قبل أي عملية مصادقة
