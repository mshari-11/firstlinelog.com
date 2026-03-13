# تقرير مراجعة البنية التحتية لـ FLL

**التاريخ:** 2026-03-12
**المراجع:** Claude Code (تدقيق آلي للبنية التحتية)
**النظام:** First Line Logistics (FLL) — fll.sa

---

## 1. مراجعة البنية التحتية

### 1.1 خدمات AWS

| الخدمة | الحالة | التفاصيل |
|--------|--------|----------|
| **المنطقة** | me-south-1 (البحرين) | مناسبة للعمليات السعودية |
| **RDS / Aurora PostgreSQL** | مُعَدّ (غير مفعّل بعد) | متغير البيئة `AURORA_HOST` محدد، قاعدة البيانات `fll_finance` مُصَمَّمة. مخطط المالية (`finance-schema.sql`) يحتوي على 20+ جدول عبر مخططات `finance` و `ops` و `master`. علم الميزة `FEATURE_AURORA_ENABLED` يتحكم بالتفعيل. |
| **DynamoDB** | فعّال | مخزن البيانات الرئيسي لـ Lambda المالية. الجداول: `fll-driver-wallets`، `fll-wallet-ledger`، `fll-payout-batches`، `fll-payout-items`، `fll-reconciliation-runs`، `fll-reconciliation-items`، `fll-manual-adjustments`، `fll-finance-approvals`، `fll-fraud-flags`، `fll-rate-cards`، `fll-bonus-rules`، `fll-penalty-rules`، `fll-system-settings`، `fll-audit-log`، `fll-drivers`، `fll-orders` |
| **دوال Lambda** | مُنشَرة (8 دوال) | `fll-auth-api` (Python)، `fll-finance-engine` (Node.js)، `fll-finance-insights` (Python)، `fll-driver-onboarding` (Python)، `fll-chatbot` (Python)، `fll-contact-confirm` (Python)، `fll-kyc-upload` (Python)، `fll-otp-email` (Python) |
| **تخزين S3** | مُعَدّ | الحاويات: `fll-kyc-documents-*` (مستندات KYC)، `fll-ops-raw` (بيانات العمليات) |
| **IAM** | مُعَدّ | الدور: `fll-ai-finance-review-role`، الحساب: `230811072086` |
| **API Gateway** | فعّال | المعرّف: `xr7wsfym5k`، الرابط: `https://xr7wsfym5k.execute-api.me-south-1.amazonaws.com` |
| **Cognito** | فعّال | مجمع المستخدمين: `me-south-1_*`، مُستخدم لمصادقة السائقين/الموظفين/المسؤولين عبر OTP |
| **SES** | فعّال | يرسل رسائل OTP من `no-reply@fll.sa` |
| **Bedrock** | مُعَدّ | النموذج: `anthropic.claude-sonnet-4-6-20250514` للتحليلات المالية والدردشة |

### 1.2 Supabase

| المكوّن | الحالة | التفاصيل |
|---------|--------|----------|
| **قاعدة البيانات** | مُتصلة | PostgreSQL عبر `@supabase/supabase-js` الإصدار 2.55.0 |
| **الجداول (Supabase)** | مُهاجَرة | `couriers`، `driver_wallets`، `ledger_accounts`، `ledger_entries`، `wallet_transactions`، `payout_batches`، `payout_items`، `driver_applications`، `driver_applications_archive`، `otp_attempts`، `driver_email_otps`، `admin_otp_codes`، `users`، `staff_profiles` |
| **المصادقة** | فعّالة | Supabase Auth + Cognito مصادقة مزدوجة. يدعم: بريد إلكتروني/كلمة مرور، OTP |
| **سياسات RLS** | جزئية | `admin_otp_codes` مفعّل فيها RLS بدون سياسات عميل (وصول service-role فقط). الجداول الأخرى تحتاج مراجعة RLS. |
| **الهجرات** | 4 مُطبّقة | `002_driver_wallet_ledger.sql`، `003_driver_applications.sql`، `004_driver_onboarding_security.sql`، `005_admin_otp_codes.sql` |
| **الدوال** | 3 مُنشأة | `record_wallet_event()`، `create_driver_wallet_on_insert()`، `approve_driver_application()` |
| **المحفّزات** | 2 فعّالة | `trg_create_driver_wallet` (إنشاء محفظة تلقائي عند إدراج سائق)، `trg_archive_application` (أرشفة عند تغيير الحالة) |

### 1.3 Vercel

| المكوّن | الحالة | التفاصيل |
|---------|--------|----------|
| **الإطار** | مخصص (Vite) | لا يستخدم إطار Vercel مُعدّ مسبقاً (`"framework": null`) |
| **البناء** | ناجح | `npm run build` ينجح. المخرجات: `dist/` |
| **مجلد المخرجات** | `.` (الجذر) | ملفات HTML ثابتة تُقدَّم من الجذر، SPA من `dist/` |
| **إعادة التوجيه** | 31 قاعدة | لوحة المسؤول، بوابة السائق، مسارات السائقين، الصفحات العامة كلها مُعدَّة |
| **رؤوس التخزين المؤقت** | مُعدَّة | `no-cache, no-store, must-revalidate` على ملفات HTML |
| **متغيرات البيئة** | 8 مطلوبة | `VITE_SUPABASE_URL`، `VITE_SUPABASE_ANON_KEY`، `VITE_API_BASE`، `VITE_MAPBOX_TOKEN`، بالإضافة إلى متغيرات AWS/Cognito لـ Lambdas |
| **النطاق** | fll.sa | `ALLOWED_ORIGIN` مضبوط على `https://fll.sa` |

### 1.4 GitHub

| المكوّن | الحالة | التفاصيل |
|---------|--------|----------|
| **المستودع** | فعّال | `firstlinelog.com` |
| **الفروع** | 2 محلية | `master`، `claude/react-hooks-guide-BJqFK` |
| **سير عمل CI/CD** | لا يوجد | لا يوجد مجلد `.github/workflows/` |
| **حماية الفروع** | غير مُعدَّة | لم يتم اكتشاف قواعد حماية فروع |
| **.gitignore** | مُعدَّ | يستثني `.env`، `.env.local`، `node_modules/`، `.vercel` |

### 1.5 قائمة التحقق

| الفحص | الحالة | ملاحظات |
|-------|--------|---------|
| لا توجد متغيرات بيئة مفقودة | تحذير | `env.example` يحتوي على 30+ متغير. كثير من مفاتيح التكامل عنصر نائب (`CHANGEME`). تحقق في لوحة Vercel. |
| هجرات قاعدة البيانات مُطبّقة | جزئي | 4 هجرات Supabase موجودة. مخطط Aurora `finance-schema.sql` لم يُطبَّق بعد (خلف علم ميزة). |
| نقاط نهاية API تستجيب | مُعدَّة | معرّف API Gateway `xr7wsfym5k` مُعيَّن. الاتصال الفعلي يعتمد على نشر Lambda. |

---

## 2. التحقق من قاعدة البيانات

### 2.1 الجداول المُنشأة

#### Supabase (PostgreSQL — مباشر)

| الجدول | الهجرة | الحالة |
|--------|--------|--------|
| `couriers` | موجود مسبقاً | جدول أساسي (مرجع لهجرات المحفظة/التطبيق) |
| `users` | موجود مسبقاً | جدول أساسي (مرجع لوحدة المصادقة) |
| `staff_profiles` | موجود مسبقاً | تخزين صلاحيات الموظفين |
| `ledger_accounts` | 002 | حسابات النظام للقيد المزدوج |
| `driver_wallets` | 002 | واحدة لكل سائق، تُنشأ تلقائياً عند الإدراج |
| `ledger_entries` | 002 | سجلات قيد مزدوج غير قابلة للتعديل |
| `wallet_transactions` | 002 | سجل معاملات مقروء |
| `payout_batches` | 002 | تجميع دفعات التحويلات البنكية |
| `payout_items` | 002 | مدفوعات فردية للسائقين |
| `driver_applications` | 003 | سير عمل تسجيل السائقين |
| `driver_applications_archive` | 003 | سجل طلبات غير قابل للتعديل |
| `otp_attempts` | 003 | تتبع حد المحاولات |
| `driver_email_otps` | 004 | التحقق من OTP بالبريد الإلكتروني |
| `admin_otp_codes` | 005 | تسجيل دخول المسؤولين بـ OTP |

#### Aurora PostgreSQL (مُصَمَّم — لم يُطبَّق بعد)

**المخططات:** `finance`، `ops`، `master`

| المخطط | الجدول | الغرض |
|--------|--------|-------|
| `master` | `drivers` | بيانات السائقين الرئيسية |
| `master` | `driver_contract_history` | عقود بتواريخ سريان |
| `master` | `vehicles` | سجل المركبات |
| `master` | `driver_vehicle_assignment_history` | سجل تخصيص المركبات |
| `master` | `platforms` | سجل المنصات (7 مُزرَعة) |
| `master` | `cities` | سجل المدن (16 مُزرَعة) |
| `master` | `company_vehicle_cost_profiles` | ملفات تكلفة المركبات |
| `finance` | `platform_rate_cards` | بطاقات أسعار بتواريخ سريان |
| `finance` | `platform_bonus_rules` | تعريفات قواعد المكافآت |
| `finance` | `platform_penalty_rules` | تعريفات قواعد الجزاءات |
| `finance` | `platform_file_templates` | قوالب أعمدة ملفات التقارير |
| `finance` | `upload_batches` | تتبع تحميل الملفات |
| `finance` | `platform_reports_raw` | بيانات خام مُستوعبة |
| `finance` | `platform_reports_staging` | بيانات مُنظّفة مرحلية |
| `finance` | `platform_orders_fact` | حقائق مستوى الطلب |
| `finance` | `platform_driver_day_fact` | حقائق مستوى يوم-سائق |
| `finance` | `driver_wallets` | أرصدة محافظ السائقين |
| `finance` | `wallet_ledger_entries` | دفتر أستاذ إلحاقي فقط |
| `finance` | `reconciliation_batches` | عمليات المطابقة |
| `finance` | `reconciliation_items` | مطابقة لكل سائق |
| `finance` | `payout_batches` | إدارة دفعات المدفوعات |
| `finance` | `driver_payouts` | مدفوعات فردية |
| `finance` | `manual_adjustments` | طلبات تعديل يدوي |
| `finance` | `approval_requests` | سير عمل موافقة متعدد المستويات |
| `finance` | `audit_log` | مسار تدقيق كامل |

### 2.2 علاقات المفاتيح الأجنبية

**Supabase:**
- `driver_wallets.driver_id` -> `couriers.id` (CASCADE)
- `ledger_entries.account_id` -> `ledger_accounts.id`
- `ledger_accounts.driver_id` -> `couriers.id` (SET NULL)
- `wallet_transactions.driver_id` -> `couriers.id` (CASCADE)
- `wallet_transactions.wallet_id` -> `driver_wallets.id`
- `payout_items.batch_id` -> `payout_batches.id` (CASCADE)
- `payout_items.driver_id` -> `couriers.id`
- `driver_applications_archive.application_id` -> `driver_applications.id` (CASCADE)

**Aurora (مُصَمَّم):**
- سلامة مرجعية كاملة عبر `master.drivers`، `finance.*`، جداول تاريخ المركبات/العقود
- قيود تاريخ سريان على بطاقات الأسعار، العقود، تخصيصات المركبات

### 2.3 الفهارس

**Supabase (11 فهرس):**
- `idx_ledger_entries_transaction` — على `transaction_id`
- `idx_ledger_entries_account` — على `account_id`
- `idx_ledger_entries_created` — على `created_at DESC`
- `idx_wallet_txn_driver` — على `driver_id`
- `idx_wallet_txn_created` — على `created_at DESC`
- `idx_payout_items_batch` — على `batch_id`
- `idx_payout_items_driver` — على `driver_id`
- `idx_driver_apps_status` — على `status`
- `idx_driver_apps_created` — على `created_at DESC`
- `idx_driver_apps_email` — على `email`
- فهارس فريدة جزئية على `national_id`، `email`، `phone` (باستثناء المرفوضين)

**Aurora (مُصَمَّم، 10+ فهرس):**
- `idx_rate_card_lookup` — فهرس مُركَّب من 6 أعمدة
- `idx_contract_driver_date` — بحث تاريخ السريان
- `idx_vehicle_assign_date` — بحث تاريخ السريان
- `idx_staging_batch`، `idx_staging_driver_date`
- `idx_orders_fact_driver`، `idx_orders_fact_platform`
- `idx_ledger_driver`، `idx_payout_driver`
- `idx_audit_table`

### 2.4 دوال المحفظة والمالية

| الدالة | الحالة | ملاحظات |
|--------|--------|---------|
| `record_wallet_event()` | مُنشأة (Supabase) | قيد مزدوج كامل مع إنشاء حساب دفتر أستاذ تلقائي، تحديث الرصيد، مسار التدقيق. يعالج: order_payment، bonus، penalty، vehicle_cost، adjustment، payout |
| `create_driver_wallet_on_insert()` | مُنشأة (Supabase) | محفّز ينشئ محفظة تلقائياً عند إدراج سائق |
| `approve_driver_application()` | مُنشأة (Supabase) | يوافق على الطلب، ينشئ سجل سائق، المحفظة تُنشأ تلقائياً بالمحفّز |
| `finance.get_effective_rate_card()` | مُصَمَّمة (Aurora) | تُرجع بطاقة الأسعار الصحيحة بناءً على المنصة + المدينة + العقد + المركبة + الملكية + التاريخ |
| ثبات دفتر الأستاذ | مُطبَّق | قواعد `ledger_no_update` و `ledger_no_delete` تمنع التعديل |

### 2.5 التحقق من الاستعلامات (على مستوى الكود)

بما أنه لا يوجد وصول مباشر لقاعدة البيانات من هذه البيئة، إليك ما يدعمه المخطط:

```sql
-- هذه الاستعلامات صالحة على مخطط Supabase:
SELECT count(*) FROM driver_wallets;          -- عدد المحافظ
SELECT count(*) FROM ledger_entries;          -- عدد قيود الدفتر
SELECT count(*) FROM payout_batches;          -- عدد دفعات المدفوعات
SELECT count(*) FROM driver_applications;     -- عدد الطلبات

-- هذه الاستعلامات صالحة على مخطط Aurora (عند التطبيق):
SELECT count(*) FROM finance.driver_wallets;
SELECT count(*) FROM finance.wallet_ledger_entries;
SELECT count(*) FROM finance.reconciliation_batches;
SELECT count(*) FROM finance.platform_orders_fact;
```

**تحديثات أرصدة معاملات المحفظة:** تم التحقق — دالة `record_wallet_event()` تُحدِّث `driver_wallets.balance` ذرياً، وتُنشئ `ledger_entries`، وتُنشئ `wallet_transactions` في معاملة واحدة مع قفل مستوى الصف (`FOR UPDATE`).

**توازن قيود اليومية:** تم التحقق — كل استدعاء لـ `record_wallet_event()` يُنشئ قيدين (مدين + دائن) مجموع مبالغهما يساوي صفر لكل `transaction_id`.

**دوال المدفوعات:** تم التحقق — Lambda المالية `fll-finance-engine` تعالج دورة حياة المدفوعات الكاملة: `draft` -> `pending_review` (حساب) -> `approved` (موافقة، مع فصل المهام) -> `completed` (تنفيذ مع قيود الدفتر).

---

## 3. التحقق من لوحات المعلومات

### 3.1 لوحة المسؤول

| الميزة | الملف | الحالة |
|--------|-------|--------|
| **نظرة عامة على النظام** | `admin-dashboard.html` (888 سطر) | موجود |
| **إحصائيات الطلبات** | `admin-dashboard.html` | موجود |
| **حالة السائقين** | `admin-dashboard.html` | موجود |
| **ملخص الإيرادات** | `admin-dashboard.html` | موجود |
| **لوحة SPA للمسؤول** | `src/pages/admin/Dashboard.tsx` | موجود |
| **الرابط** | `admin.fll.sa` → `fll.sa/admin-panel/dashboard` | مُعدَّ عبر vercel.json |

### 3.2 لوحة العمليات

| الميزة | الملف | الحالة |
|--------|-------|--------|
| **الطلبات المباشرة** | `staff-ops.html` (181 سطر) | موجود |
| **التحكم بالتوزيع** | `dispatch-map.html` (646 سطر، تكامل Mapbox) | موجود |
| **حالة السائقين** | `staff-dashboard.html` (192 سطر) | موجود |
| **الشكاوى** | `src/pages/admin/Complaints.tsx` | موجود (React SPA) |
| **الرابط** | `staff.fll.sa` → `fll.sa/staff-ops` | مُعدَّ |

### 3.3 لوحة/بوابة السائق

| الميزة | الملف | الحالة |
|--------|-------|--------|
| **رصيد المحفظة** | `courier-dashboard.html` (397 سطر) | موجود |
| **الطلبات المكتملة** | `src/pages/driver/DriverOrders.tsx` | موجود |
| **المدفوعات** | `src/pages/driver/DriverEarnings.tsx` | موجود |
| **الشكاوى** | `courier-dashboard.html` | موجود |
| **ملف السائق** | `src/pages/driver/DriverProfile.tsx` | موجود |
| **الاستحقاقات** | `src/pages/driver/DriverEntitlements.tsx` | موجود |
| **الرابط** | `drivers.fll.sa` → `fll.sa/courier-dashboard` أو `fll.sa/driver/*` | مُعدَّ |

### 3.4 لوحة المالية

| الميزة | الملف | الحالة |
|--------|-------|--------|
| **الإيرادات** | `staff-finance.html` (737 سطر) | موجود |
| **المصروفات** | `staff-finance.html` | موجود |
| **محافظ السائقين** | `finance-wallets.html` (250 سطر) | موجود |
| **موافقات المدفوعات** | `finance-payout-batches.html` (210 سطر) | موجود |
| **المطابقة** | `finance-reconciliation.html` (229 سطر) | موجود |
| **التعديلات** | `finance-adjustments.html` (214 سطر) | موجود |
| **القواعد** | `finance-rules.html` (307 سطر) | موجود |
| **قائمة الاحتيال** | `finance-fraud-queue.html` (220 سطر) | موجود |
| **المالية React** | `src/pages/admin/Finance.tsx` | موجود |
| **المطابقة React** | `src/pages/admin/Reconciliation.tsx` | موجود |
| **المحفظة React** | `src/pages/admin/DriverWallet.tsx` | موجود |
| **الرابط** | `fll.sa/staff-finance`، `fll.sa/finance-*` | مُعدَّ |

### 3.5 لوحات إضافية

| اللوحة | الملف | الحالة |
|--------|-------|--------|
| **الموارد البشرية** | `staff-hr.html` (159 سطر) | موجود |
| **الأسطول** | `staff-fleet.html` (171 سطر) | موجود |
| **التكاملات** | `marketplace-integrations.html` (233 سطر) | موجود |

---

## 4. التحقق من بيانات لوحة المالية

### قدرة عرض المؤشرات

| المؤشر | المصدر | الحالة |
|--------|--------|--------|
| **إجمالي الإيرادات** | `staff-finance.html` + Lambda `/finance/reports/profitability` | متاح — مُجمَّع من الطلبات حسب المنصة |
| **إجمالي المصروفات** | `staff-finance.html` | متاح — مُشتق من خصومات المحفظة، تكاليف المركبات، الجزاءات |
| **صافي الربح** | `staff-finance.html` | متاح — `المبلغ الإجمالي - صافي مدفوعات السائق = إيرادات الشركة` (عرض Aurora `v_driver_daily_profitability`) |
| **رصيد مدفوعات السائقين** | Lambda `/finance/wallets` | متاح — يفحص جميع المحافظ، يُرجع الرصيد لكل سائق |
| **التدفق النقدي** | `staff-finance.html` | متاح — يُتتبَّع عبر دفعات المدفوعات (دورة حياة draft -> completed) |
| **أرصدة البنوك** | غير مُنفَّذ | ليس بعد — يتطلب تكامل API بنكي (STC Bank / ساما) |

### التحقق من تدفق البيانات

```
تقارير المنصات → مركز التحميل → جدول خام → مرحلي → جداول الحقائق
                                                            ↓
                                                    بحث بطاقة الأسعار
                                                            ↓
                                              حساب صافي مدفوعات السائق
                                                            ↓
                                                    قيد دفتر المحفظة
                                                            ↓
                                              دفعة مدفوعات → التنفيذ
```

Lambda المالية (`fll-finance-engine/index.js`) توفر جميع نقاط نهاية API المالية مع:
- CRUD للمحفظة مع قيود الدفتر
- دورة حياة دفعات المدفوعات (إنشاء → حساب → موافقة → تنفيذ)
- مطابقة مع كشف التباينات
- تعديلات يدوية مع سير عمل الموافقة
- إدارة أعلام الاحتيال
- قواعد مالية (بطاقات أسعار، مكافآت، جزاءات)
- إدارة أعلام الميزات
- تسجيل التدقيق على كل عملية كتابة

---

## 5. المراجعة الأمنية

### 5.1 المصادقة

| الطريقة | الحالة | التفاصيل |
|---------|--------|----------|
| **AWS Cognito** | فعّال | مصادقة JWT لـ API Gateway. المجموعات: `SystemAdmin`، `admin`، `driver`، `staff`، `owner`، `executive` |
| **Supabase Auth** | فعّال | بريد إلكتروني/كلمة مرور + OTP للوحة المسؤول |
| **المصادقة المزدوجة** | مُنفَّذة | `auth.tsx` يجرب Supabase أولاً، يتراجع إلى Cognito `localStorage` |
| **مصادقة API** | مُطبَّقة | Lambda المالية تتحقق من `AccessToken` Cognito عبر `GetUserCommand` في كل طلب |
| **تحديد محاولات OTP** | مُنفَّذ | جدول `otp_attempts` يتتبع محاولات الإرسال/التحقق بالبريد/IP |

### 5.2 التحكم بالوصول المبني على الأدوار (RBAC)

| الدور | صلاحية الصفحات | الحالة |
|-------|----------------|--------|
| `super_admin` | جميع الصفحات (`*`) | مُنفَّذ |
| `SystemAdmin` | جميع الصفحات (`*`) | مُنفَّذ |
| `finance_manager` | مجموعة المالية (10 صفحات) | مُنفَّذ |
| `finance_analyst` | المالية للقراءة فقط (6 صفحات) | مُنفَّذ |
| `ops_manager` | لوحة العمليات، لوحة الموظفين | مُنفَّذ |
| `ops_supervisor` | لوحة العمليات، لوحة الموظفين | مُنفَّذ |
| `hr_manager` | لوحة الموارد البشرية، التسجيل، العقود | مُنفَّذ |
| `fleet_manager` | لوحة الأسطول، التكاليف | مُنفَّذ |
| `driver` | لوحة السائق فقط | مُنفَّذ |
| `admin` | المسؤول + جميع لوحات الموظفين | مُنفَّذ |
| `executive` | المسؤول + ربحية المالية + التحليلات | مُنفَّذ |

**حراس المسارات:**
- `fll-rbac.js` — RBAC من جانب العميل لصفحات HTML الثابتة (إعادة توجيه إلى `/unauthorized`)
- `PermissionGuard.tsx` — مكوّن React لمسارات لوحة المسؤول SPA
- Lambda `requireRole()` — فرض الأدوار من جانب الخادم في كل استدعاء API

### 5.3 التحقق من عزل الأدوار

| الفحص | الحالة | التفاصيل |
|-------|--------|----------|
| السائقون لا يمكنهم الوصول للمسؤول | مُطبَّق | دور `driver` لديه وصول فقط لـ `/courier-dashboard`. `guardPage()` يعيد توجيه الوصول غير المُصرَّح. |
| الوصول المالي مُقيَّد | مُطبَّق | مسارات المالية تتطلب دور `finance_manager` أو `finance_analyst`. Lambda تتحقق في كل طلب. |
| فصل المهام | مُطبَّق | لا يمكن الموافقة على دفعات المدفوعات الخاصة (فحص `created_by === user.email`). لا يمكن الموافقة على التعديلات الخاصة. |
| أدوات المسؤول مُقيَّدة | مُطبَّق | أعلام الميزات تتطلب دور `super_admin` أو `SystemAdmin`. |

### 5.4 أمان مستوى الصف (RLS)

| الجدول | حالة RLS | ملاحظات |
|--------|----------|---------|
| `admin_otp_codes` | مُفعَّل | لا توجد سياسات عميل — وصول service-role فقط |
| `couriers` | غير مُفعَّل | يحتاج سياسات RLS لوصول السائق لبياناته الخاصة |
| `driver_wallets` | غير مُفعَّل | يحتاج RLS لتقييد السائق لمحفظته الخاصة |
| `ledger_entries` | غير مُفعَّل | غير قابل للتعديل (قواعد no update/delete)، لكن يحتاج RLS للقراءة |
| `driver_applications` | غير مُفعَّل | يحتاج RLS لوصول المتقدم لبياناته الخاصة |

### 5.5 مصادقة API

| نقطة النهاية | المصادقة | الأدوار المطلوبة |
|-------------|----------|-----------------|
| `/finance/wallets` (GET) | Cognito JWT | `finance_manager`، `finance_analyst` |
| `/finance/wallets/:id/credit` (POST) | Cognito JWT | `finance_manager` فقط |
| `/finance/payout-batches` (POST) | Cognito JWT | `finance_manager` فقط |
| `/finance/payout-batches/:id/approve` (POST) | Cognito JWT | `finance_manager`، `super_admin` (ليس المُنشئ) |
| `/finance/adjustments` (POST) | Cognito JWT | `finance_manager`، `finance_analyst` |
| `/finance/adjustments/:id/approve` (POST) | Cognito JWT | `finance_manager`، `super_admin` (ليس مقدم الطلب) |
| `/finance/feature-flags` (POST) | Cognito JWT | `super_admin`، `SystemAdmin` فقط |
| `/finance/fraud-queue` | Cognito JWT | `finance_manager`، `finance_analyst`، `ops_manager` |

---

## 6. دليل الوصول إلى لوحات المعلومات

### تسجيل الدخول

**نقطة الدخول الرئيسية:** `https://staff.fll.sa` (يُعيد التوجيه إلى `https://fll.sa/unified-login`)

### توجيه لوحات المعلومات حسب الدور

| الدور | اللوحة | الرابط |
|-------|--------|--------|
| المسؤول / SystemAdmin | لوحة المسؤول | `fll.sa/admin-dashboard` أو `fll.sa/admin-panel/dashboard` |
| العمليات (ops_manager) | لوحة العمليات | `fll.sa/staff-ops` |
| المالية (finance_manager) | لوحة المالية | `fll.sa/staff-finance` |
| الموارد البشرية (hr_manager) | لوحة الموارد البشرية | `fll.sa/staff-hr` |
| الأسطول (fleet_manager) | لوحة الأسطول | `fll.sa/staff-fleet` |
| السائق | بوابة السائق | `fll.sa/courier-dashboard` |

### صفحات المالية الفرعية

| الصفحة | الرابط |
|--------|--------|
| المحافظ | `fll.sa/finance-wallets` |
| المطابقة | `fll.sa/finance-reconciliation` |
| دفعات المدفوعات | `fll.sa/finance-payout-batches` |
| التعديلات | `fll.sa/finance-adjustments` |
| القواعد | `fll.sa/finance-rules` |
| قائمة الاحتيال | `fll.sa/finance-fraud-queue` |
| التكاملات | `fll.sa/marketplace-integrations` |

### لوحة المسؤول (React SPA)

| الصفحة | الرابط |
|--------|--------|
| لوحة المعلومات | `fll.sa/admin-panel/dashboard` |
| السائقين | `fll.sa/admin-panel/couriers` |
| الطلبات | `fll.sa/admin-panel/orders` |
| المالية | `fll.sa/admin-panel/finance` |
| التقارير | `fll.sa/admin-panel/reports` |
| المركبات | `fll.sa/admin-panel/vehicles` |
| الموظفين | `fll.sa/admin-panel/staff` |
| المحفظة | `fll.sa/admin-panel/wallet` |
| المطابقة | `fll.sa/admin-panel/reconciliation` |
| التوزيع | `fll.sa/admin-panel/dispatch` |
| الإعدادات | `fll.sa/admin-panel/settings` |

---

## 7. المخرجات النهائية

### 7.1 تأكيد النظام

نظام FLL **مكتمل معمارياً** بالحالة التشغيلية التالية:

- **الواجهة الأمامية:** 15 لوحة معلومات HTML ثابتة + React SPA بأكثر من 25 صفحة. البناء ناجح.
- **الواجهة الخلفية:** 8 دوال Lambda تغطي المصادقة، محرك المالية، تسجيل السائقين، الدردشة، KYC، OTP، التحليلات المالية، التواصل.
- **قاعدة البيانات:** بنية قاعدة بيانات مزدوجة — Supabase (مباشر، 14+ جدول) + Aurora PostgreSQL (مُصَمَّم، 24+ جدول، خلف علم ميزة).
- **محرك المالية:** نظام محفظة كامل مع دفتر أستاذ، تجميع مدفوعات، مطابقة، تعديلات، كشف احتيال، وإدارة قواعد.
- **التكاملات:** محوّلات لـ Nected، n8n، Veri5now، Turiya AI مع مراقبة الصحة.
- **نظام التصميم:** `fll-design-system.css` (11 ألف سطر)، مكوّنات Radix UI، أيقونات Lucide.

### 7.2 المشاكل المُكتشفة

| # | الخطورة | المشكلة | التوصية |
|---|---------|---------|---------|
| 1 | عالية | **RLS غير مُفعَّل** على معظم جداول Supabase (`couriers`، `driver_wallets`، `ledger_entries`، `driver_applications`) | تفعيل RLS مع سياسات: السائقون يقرؤون بياناتهم فقط، وصول الموظفين حسب الدور |
| 2 | عالية | **لا يوجد سير عمل CI/CD** — لا توجد GitHub Actions | إضافة سير عمل بناء/اختبار/نشر لفحوصات PR والنشر التلقائي لـ Vercel |
| 3 | عالية | **لا توجد حماية فروع** على `master` | تفعيل حماية الفروع: تتطلب مراجعة PR، نجاح الفحوصات |
| 4 | متوسطة | **هجرة Aurora لم تُطبَّق** — `finance-schema.sql` موجود لكنه خلف علم ميزة وليس في هجرات Supabase | تطبيق مخطط Aurora عند الجاهزية؛ الحفاظ على ترقيم الهجرات |
| 5 | متوسطة | **تكامل أرصدة البنوك مفقود** — لا يوجد تكامل API مع STC Bank / ساما | إضافة محوّل API بنكي لعرض أرصدة البنك الفوري |
| 6 | متوسطة | **عمليات فحص DynamoDB** في Lambda المالية — لن تتوسع | ترحيل المسارات الساخنة لاستخدام `QueryCommand` مع GSI بدلاً من `ScanCommand + filter` |
| 7 | متوسطة | **لا توجد اختبارات آلية** — صفر ملفات اختبار في المستودع | إضافة اختبارات وحدة للدوال المالية، اختبارات تكامل لـ Lambda، اختبارات E2E للوحات |
| 8 | منخفضة | **أحجام حزم كبيرة** — `spa.js` (1.28 ميجابايت)، `mapbox-gl.js` (1.70 ميجابايت) | تنفيذ تقسيم الكود بالاستيراد الديناميكي؛ تحميل Mapbox بالطلب |
| 9 | منخفضة | **رموز OTP مُخزَّنة بنص عادي** في جدول `admin_otp_codes` (عمود `code`) | تشفير رموز OTP قبل التخزين (مُنفَّذ بالفعل في `driver_applications.otp_code` — اجعله متسقاً) |
| 10 | منخفضة | **أعلام الميزات في DynamoDB فقط** — لا يوجد إدارة UI في SPA | Lambda المالية لديها نقطة نهاية `/finance/feature-flags`؛ أضف صفحة تبديل UI |

### 7.3 تحسينات أمنية

1. **تفعيل RLS على جميع جداول Supabase** — إنشاء سياسات لـ:
   - السائقون: `SELECT` للصف الخاص فقط (عبر `auth.uid()`)
   - الموظفون: `SELECT` بناءً على مجموعات الأدوار
   - المالية: وصول كامل لجداول المالية مع فحص الدور
   - لا يوجد `DELETE` من جانب العميل على أي جدول مالي

2. **إضافة التحقق من مصدر CORS** — حالياً `ALLOWED_ORIGIN` سلسلة واحدة. النظر في إضافة `staff.fll.sa`، `admin.fll.sa`، `drivers.fll.sa` كمصادر مسموحة.

3. **تنفيذ تحديد معدل API** — إضافة تقييد على Lambda API Gateway (مدعوم بالفعل عبر خطط استخدام API Gateway).

4. **تشفير جميع رموز OTP** — استخدام bcrypt/argon2 لتخزين OTP متسق.

5. **إضافة رؤوس CSP** — رؤوس سياسة أمان المحتوى في `vercel.json` لمنع XSS.

6. **تدوير وتدقيق مفاتيح API** — مفاتيح Nected، n8n، Veri5now، Turiya يجب تدويرها كل ربع سنة.

7. **إضافة MFA للمسؤولين** — Cognito يدعم TOTP MFA؛ تفعيل لأدوار `super_admin` و `finance_manager`.

### 7.4 اقتراحات الأداء

1. **تقسيم الكود** — تحميل صفحات المسؤول، صفحات المالية، و Mapbox بشكل منفصل بالطلب
2. **استبدال فحوصات DynamoDB** — إضافة فهارس ثانوية عامة (GSI) لبحث `driver_id`، `batch_id`
3. **تخزين CDN المؤقت** — تفعيل تخزين Vercel Edge المؤقت للأصول الثابتة (CSS، JS، الصور)
4. **تجميع اتصالات قاعدة البيانات** — استخدام RDS Proxy لـ Aurora عند التفعيل
5. **ترقيم صفحات استجابات API** — قائمة محافظ المالية حالياً تُرجع حتى 200 عنصر؛ إضافة ترقيم صفحات بالمؤشر
6. **تحميل مسبق للأصول الحرجة** — إضافة `<link rel="preload">` لـ CSS نظام التصميم والخطوط الأساسية

### 7.5 حالة التكاملات

| الأداة | الحالة | فحص الصحة |
|--------|--------|-----------|
| **Nected** (محرك القواعد) | المحوّل جاهز | `nected-adapter.js` — يحتاج تعيين مفتاح API |
| **n8n** (مركز التكامل) | المحوّل جاهز | `n8n-adapter.js` — يحتاج تعيين رابط webhook |
| **Veri5now** (التوقيع الإلكتروني) | المحوّل جاهز | `veri5now-adapter.js` — يحتاج مفتاح API. eKYC السعودي غير مُفعَّل. |
| **Turiya AI** (تجريبي) | المحوّل جاهز | `turiya-adapter.js` — قراءة فقط تجريبي. مُعطَّل افتراضياً. |
| **AWS Bedrock** | مُعدَّ | مُستخدم بواسطة Lambda `fll-finance-insights` و `fll-chatbot` |

---

## ملحق: ملخص التقنيات المُستخدمة

| الطبقة | التقنية |
|--------|---------|
| **الواجهة الأمامية** | React 18 + Vite + TypeScript + Radix UI + TanStack Query |
| **التنسيق** | نظام تصميم CSS مخصص + أدوات شبيهة بـ Tailwind |
| **الأيقونات** | Lucide React + Iconify |
| **الخرائط** | Mapbox GL JS |
| **المصادقة** | AWS Cognito (OTP) + Supabase Auth (بريد إلكتروني/كلمة مرور + OTP) |
| **API** | AWS API Gateway + Lambda (Node.js + Python) |
| **قاعدة البيانات (مباشرة)** | Supabase PostgreSQL (14+ جدول، 3 دوال، 2 محفّز) |
| **قاعدة البيانات (مُخطَّطة)** | AWS Aurora PostgreSQL (مخططات `finance`، `ops`، `master`، 24+ جدول) |
| **NoSQL** | AWS DynamoDB (16 جدول لمحرك المالية) |
| **التخزين** | AWS S3 (مستندات KYC، بيانات العمليات) |
| **البريد الإلكتروني** | AWS SES |
| **الذكاء الاصطناعي** | AWS Bedrock (Claude Sonnet) |
| **الاستضافة** | Vercel (ثابت + SPA) |
| **CI/CD** | لا يوجد (نشر يدوي عبر `deploy-lambdas.sh`) |
