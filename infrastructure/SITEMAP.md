# FLL Platform — Site Map & Page Flow

## Authentication Flows

```
                    fll.sa (Static Website)
                           |
              ┌────────────┼────────────┐
              v            v            v
        /admin/login  /unified-login  /courier/register
        (Admin+OTP)   (Password)      (Public 5-step)
              |            |                |
              v            v                v
     ┌── Role Check ──┐   |          /application-status
     |                 |   |          (Public tracker)
     v                 v   v
/admin-panel/*    /courier/portal
(Admin Dashboard)  (Courier Dashboard)
```

## Admin Panel Routes (/admin-panel/*)

```
/admin-panel
├── /dashboard .............. لوحة التحكم الرئيسية
│                             [admin, owner, staff]
│
├── 📦 العمليات
│   ├── /orders ............. إدارة الطلبات
│   │                        [permission: orders]
│   ├── /dispatch ........... خريطة التوزيع الحي (Mapbox)
│   │                        [permission: orders]
│   └── /complaints ......... إدارة الشكاوى
│                             [permission: complaints]
│
├── 🚚 المناديب والأسطول
│   ├── /couriers ........... إدارة المناديب + طلبات التسجيل
│   │                        [permission: couriers]
│   ├── /wallet ............. محفظة السائقين
│   │                        [permission: finance]
│   └── /vehicles ........... إدارة المركبات
│                             [admin, owner, staff(fleet)]
│
├── 💰 المالية
│   ├── /finance ............ المدفوعات والرواتب
│   │                        [permission: finance]
│   ├── /finance-dashboard .. لوحة مالية شاملة
│   │                        [permission: finance]
│   ├── /revenue ............ تحليل الإيرادات
│   │                        [permission: finance]
│   ├── /expenses ........... تتبع المصروفات
│   │                        [permission: finance]
│   ├── /cashflow ........... التدفق النقدي
│   │                        [permission: finance]
│   ├── /financial-reports .. التقارير المالية (P&L)
│   │                        [permission: finance]
│   ├── /ai-finance ......... تحليل ذكي (Bedrock AI)
│   │                        [permission: finance]
│   ├── /reconciliation ..... تسوية مالية (Excel/CSV)
│   │                        [permission: finance]
│   └── /excel .............. تصدير Excel
│                             [permission: excel]
│
├── 👥 الموظفين
│   └── /staff .............. إدارة الموظفين والأقسام
│                             [admin, owner, staff(hr)]
│
├── 📊 التقارير
│   └── /reports ............ تقارير الأداء
│                             [permission: reports]
│
└── ⚙️ النظام
    ├── /settings ........... إعدادات النظام
    │                        [admin, owner]
    └── /page-builder ....... تخصيص القائمة
                              [admin, owner]
```

## Courier Routes

```
/courier
├── /register ............... تسجيل مندوب جديد (5 خطوات)
│   ├── Step 1: البيانات الشخصية + CAPTCHA
│   ├── Step 2: تحقق البريد (OTP)
│   ├── Step 3: صورة شخصية + Liveness
│   ├── Step 4: رفع المستندات (هوية، رخصة، بنك)
│   └── Step 5: بيانات المركبة + إرسال
│
├── /portal ................. بوابة المندوب (بعد القبول)
│   ├── Tab: الرئيسية (KPIs + آخر المعاملات)
│   ├── Tab: المحفظة (رصيد + سجل)
│   ├── Tab: الطلبات (قريباً)
│   └── Tab: الملف الشخصي
│
└── /application-status ..... متابعة حالة الطلب (عام)
    └── ?ref=APP-XXXXXXX
```

## AWS Backend Flow

```
Frontend (Vercel)
     |
     v
API Gateway (xr7wsfym5k)
     |
     ├── /auth/*  ─────────────> fll-auth-api
     │                           ├── Cognito (login/register)
     │                           ├── SES (OTP email)
     │                           └── Supabase (admin_otp_codes)
     │
     ├── /driver/* ────────────> fll-driver-onboarding
     │                           ├── Supabase (driver_applications, driver_email_otps)
     │                           ├── S3 (KYC documents)
     │                           ├── SES (notifications)
     │                           └── Cognito (create user on approve)
     │
     ├── /ai/chat ─────────────> fll-ai-chatbot
     │                           ├── Bedrock Claude (AI responses)
     │                           └── DynamoDB (chat history, TTL 30d)
     │
     ├── /api/* ───────────────> fll-platform-api-prod (Node.js)
     │                           └── DynamoDB (drivers, orders, complaints, etc.)
     │
     ├── /complaints/* ────────> fll-complaints-classifier-prod (Node.js)
     │
     ├── /finance/* ───────────> fll-generate-stc-excel
     │                           └── S3 (finance exports)
     │
     └── /api/kyc-upload ──────> fll-kyc-upload
                                 ├── S3 (documents)
                                 └── SES (admin notification)

EventBridge (Scheduled)
     |
     ├── every 1h ─────────────> fll-sla-scanner
     │                           └── DynamoDB (complaints + notifications)
     │
     ├── every 1h ─────────────> fll-data-sync (finance pipeline)
     ├── every 6h ─────────────> fll-data-sync (full sync)
     ├── every 12h ────────────> fll-data-sync (cleanup)
     ├── daily 2:00 AM ────────> fll-daily-backup
     ├── daily 8:00 PM ────────> fll-daily-finance-close
     ├── 1st of month ─────────> fll-monthly-finance-report
     └── Sunday 6:00 AM ──────> fll-weekly-payout-trigger
```

## Database Architecture

```
Supabase (PostgreSQL)              DynamoDB
├── public schema                  ├── fll-chat-history
│   ├── users                      ├── fll-complaints
│   ├── couriers                   ├── fll-notifications
│   ├── orders                     ├── fll-drivers
│   ├── vehicles                   ├── fll-orders
│   ├── departments                ├── fll-staff-users
│   ├── staff_profiles             ├── fll-vehicles
│   ├── driver_applications        ├── fll-audit-log
│   ├── driver_wallets             ├── fll-finance-ledger
│   ├── wallet_transactions        ├── fll-payout-runs
│   ├── driver_email_otps          ├── fll-dept-settings
│   ├── admin_otp_codes            └── ... (38 tables total)
│   ├── driver_locations
│   └── complaints
├── finance schema
│   ├── platforms
│   ├── cities
│   ├── rate_cards
│   ├── orders_fact
│   └── driver_day_fact
└── master/staging/audit schemas
```
