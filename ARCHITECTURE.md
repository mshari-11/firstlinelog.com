# FLL Platform — Full Architecture Map

> **First Line Logistics** — Saudi logistics platform for managing delivery drivers,
> fleet, finance, and operations across 7 platforms and 16 cities.

---

## High-Level Overview

```
                         ┌──────────────────────────────────┐
                         │          USERS / CLIENTS          │
                         │  Admin │ Staff │ Driver │ Public   │
                         └──────────┬───────────────────────┘
                                    │
                         ┌──────────▼───────────────────────┐
                         │        VERCEL (CDN/Edge)          │
                         │      firstlinelog.com              │
                         │                                    │
                         │  ┌────────────┐  ┌──────────────┐ │
                         │  │ Static Site │  │  React SPA   │ │
                         │  │ (Public)    │  │  (/dist/)    │ │
                         │  │ about,terms │  │ admin-panel  │ │
                         │  │ contact,etc │  │ courier,login│ │
                         │  └────────────┘  └──────┬───────┘ │
                         └─────────────────────────┼─────────┘
                                    ┌──────────────┴──────────────┐
                                    │                             │
                         ┌──────────▼──────────┐    ┌────────────▼────────────┐
                         │      SUPABASE        │    │    AWS (me-south-1)     │
                         │  PostgreSQL + Auth    │    │    API Gateway          │
                         │  + RLS + Realtime     │    │         │               │
                         │                       │    │  ┌──────▼──────────┐   │
                         │  ┌─────────────────┐  │    │  │  Lambda (x6)    │   │
                         │  │ 5 schemas        │  │    │  │  Auth, OTP,     │   │
                         │  │ public, master,  │  │    │  │  Chatbot, KYC,  │   │
                         │  │ finance, staging,│  │    │  │  Onboarding,    │   │
                         │  │ audit            │  │    │  │  Contact        │   │
                         │  └─────────────────┘  │    │  └──────┬──────────┘   │
                         └───────────────────────┘    │         │               │
                                                      │  ┌──────▼──────────┐   │
                                                      │  │ Cognito         │   │
                                                      │  │ SES (Email)     │   │
                                                      │  │ S3  (KYC docs)  │   │
                                                      │  │ DynamoDB (Chat) │   │
                                                      │  │ Bedrock (AI)    │   │
                                                      │  └─────────────────┘   │
                                                      └───────────────────────┘
```

---

## 1. Vercel Frontend

### Hosting & Routing

| Layer | Description |
|-------|-------------|
| **Domain** | `firstlinelog.com` on Vercel |
| **Framework** | None (static output) |
| **Build** | `vite build` → `dist/` with SPA fallback |
| **Caching** | HTML: `no-cache, no-store` / Assets: Vercel default |

### Route Map

```
Vercel Rewrites:
─────────────────────────────────────────────
STATIC (root index.html):
  /about, /contact, /services, /news,
  /investors, /terms, /privacy,
  /compliance, /operational-model,
  /employee-services, /github-management
  → / (static public site)

REACT SPA (/dist/index.html):
  /admin-panel/*      → Admin console
  /admin/login        → Admin login
  /unified-login      → Staff portal login
  /login              → Driver login
  /courier/register   → Driver onboarding (5-step)
  /courier/portal     → Courier dashboard
  /courier/*          → Courier routes
  /application-status → Application tracker
```

### React SPA Architecture

```
React 18 + TypeScript + Vite (SWC)
├── BrowserRouter
├── QueryClientProvider (TanStack Query, 5min stale)
├── AdminAuthProvider (Supabase auth context)
│
├── /unified-login          → UnifiedPortal.tsx
├── /admin/login            → admin/Login.tsx
├── /login                  → DriverLogin.tsx
│
├── /admin-panel            → AdminLayout.tsx (sidebar + outlet)
│   ├── /dashboard          → Dashboard.tsx
│   ├── /couriers           → Couriers.tsx          [permission: couriers]
│   ├── /orders             → Orders.tsx            [permission: orders]
│   ├── /dispatch           → Dispatch.tsx          [permission: orders]
│   ├── /complaints         → Complaints.tsx        [permission: complaints]
│   ├── /vehicles           → Vehicles.tsx          [permission: couriers]
│   ├── /staff              → Staff.tsx             [permission: couriers]
│   ├── /finance            → Finance.tsx           [permission: finance]
│   ├── /finance-dashboard  → FinanceDashboard.tsx  [permission: finance]
│   ├── /revenue            → Revenue.tsx           [permission: finance]
│   ├── /expenses           → Expenses.tsx          [permission: finance]
│   ├── /cashflow           → CashFlow.tsx          [permission: finance]
│   ├── /financial-reports  → FinancialReports.tsx  [permission: finance]
│   ├── /ai-finance         → AIFinanceAnalysis.tsx [permission: finance]
│   ├── /wallet             → DriverWallet.tsx      [permission: finance]
│   ├── /reconciliation     → Reconciliation.tsx    [permission: finance]
│   ├── /reports            → Reports.tsx           [permission: reports]
│   ├── /page-builder       → PageBuilder.tsx       [permission: reports]
│   └── /settings           → Settings.tsx          [no guard]
│
├── /courier/register       → courier/Register.tsx  [public]
├── /courier/portal         → courier/Portal.tsx    [auth required]
├── /application-status     → courier/ApplicationStatus.tsx [public]
└── /*                      → redirect → /unified-login
```

### Static Dashboard Pages (Legacy HTML)

```
admin-dashboard.html     → Super admin (full access)
courier-dashboard.html   → Driver earnings/deliveries/support
staff-dashboard.html     → General staff (tasks/requests)
staff-finance.html       → Finance team (payouts/approvals)
staff-hr.html            → HR (employees/attendance)
staff-ops.html           → Operations (orders/complaints/SLA)
staff-fleet.html         → Fleet (vehicles/maintenance)
marketplace-integrations.html → System integrations
unauthorized.html        → 403 access denied
```

### JavaScript Enhancement Layer

```
index.html loads (in order):
─────────────────────────────
1. React SPA bundle          ← Vite-compiled app
2. api-bridge.js       v3.0  ← Global FLL API client (window.FLL)
3. fll-login-fixer.js  v3.0  ← Intercepts login forms, patches tel inputs
4. fll-auth-connector.js v4.0 ← Auth interception, role-based redirects
5. fll-content-fixer.js v1.1  ← Updates contact info, enhances forms
6. fll-image-fixer.js  v1.1  ← Replaces CDN images with local assets
7. fll-chat-widget.js  v1.0  ← AI chatbot widget (bottom-left)
```

### Frontend Tech Stack

```
React 18.3       │ UI framework
TypeScript 5.5   │ Type safety
Vite 5.4 (SWC)   │ Build tool
Tailwind CSS 4   │ Styling
Radix UI         │ Component primitives
Recharts         │ Data visualization
Mapbox GL        │ Maps
Zustand          │ State management
TanStack Query   │ Server state
react-hook-form  │ Form handling
Zod              │ Schema validation
Framer Motion    │ Animations
Lucide           │ Icons
date-fns         │ Date utilities
xlsx             │ Excel export
```

---

## 2. AWS Services (me-south-1 — Bahrain)

### API Gateway Endpoints

```
MAIN API:  https://xr7wsfym5k.execute-api.me-south-1.amazonaws.com
AI API:    https://51n1gng40f.execute-api.me-south-1.amazonaws.com
```

### Lambda Functions (x6)

```
┌─────────────────────────────────────────────────────────────────┐
│                        API GATEWAY                               │
│  xr7wsfym5k.execute-api.me-south-1.amazonaws.com                │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┤
│  fll-    │  fll-    │  fll-    │  fll-    │  fll-    │  fll-    │
│  auth-   │  otp-    │  driver- │  kyc-    │  chatbot │  contact │
│  api     │  service │  onboard │  upload  │          │  confirm │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ /auth/*  │ /send-   │ /driver/ │ /upload  │ /ai/chat │ /api/    │
│ login    │  otp     │  apply   │          │          │ contact- │
│ register │ /verify- │  approve │          │          │ confirm  │
│ verify   │  otp     │  reject  │          │          │          │
│ forgot   │          │  status  │          │          │          │
│ reset    │          │  otp/*   │          │          │          │
│ send-otp │          │          │          │          │          │
│ me       │          │          │          │          │          │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

#### fll-auth-api (Python)
- **Purpose**: Authentication engine
- **Auth**: AWS Cognito (User Pool: `me-south-1_aJtmQ0QrN`)
- **Routes**: `/auth/login`, `/auth/register`, `/auth/verify`, `/auth/forgot`, `/auth/reset`, `/auth/resend`, `/auth/respond-mfa`, `/auth/me`, `/auth/send-otp`, `/auth/verify-custom-otp`
- **MFA**: EMAIL_OTP (currently disabled), SMS_MFA, NEW_PASSWORD_REQUIRED
- **OTP Storage**: Supabase `admin_otp_codes` table
- **Email**: AWS SES (`no-reply@fll.sa`) with Arabic HTML templates

#### fll-otp-service (Python)
- **Purpose**: Standalone OTP service
- **Spec**: 6-digit codes, 10-minute expiry
- **Rate Limits**: 5 sends/hour/email, 5 verify attempts/10min, IP-based limits
- **Storage**: Supabase `otp_requests` table
- **Hashing**: HMAC-SHA256
- **Types**: login, register, reset_password, verify_email, driver_register, sensitive_action

#### fll-driver-onboarding (Python)
- **Purpose**: Driver application lifecycle
- **Flow**: OTP verify → apply → document upload (S3) → liveness check → admin approve/reject
- **Routes**: `/driver/otp/send`, `/driver/otp/verify`, `/driver/apply`, `/driver/applications/{id}/approve`, `/driver/applications/{id}/reject`, `/driver/application-status`
- **On Approve**: Creates Supabase user + courier record + wallet + sends temp password
- **Security**: Device fingerprinting, IP tracking, HMAC OTP, duplicate detection

#### fll-kyc-upload (Python)
- **Purpose**: KYC document upload
- **Storage**: S3 bucket `fll-kyc-documents-230811072086`
- **Docs**: National ID (front/back), selfie, driver license, bank certificate, vehicle docs
- **Notifications**: SES email to `M.Z@FLL.SA`, `A.ALZAMIL@FLL.SA`

#### fll-chatbot (Python)
- **Purpose**: AI support chatbot (Arabic/Saudi dialect)
- **AI**: AWS Bedrock (Claude Sonnet)
- **Storage**: DynamoDB `fll-chat-history` (30-day TTL)
- **Context**: Last 10 messages per conversation
- **Covers**: Finance, HR, operations, vehicle, complaint routing

#### fll-contact-confirm (Python)
- **Purpose**: Contact form email confirmation
- **Email**: Sends acknowledgment to user via SES
- **Contact**: 920014948, `support@fll.sa`

### Other AWS Services

```
┌──────────────────────────────────────────────────┐
│  AWS Cognito                                      │
│  User Pool: me-south-1_aJtmQ0QrN                 │
│  Groups: admin, owner, staff, finance, hr,        │
│          ops, fleet, driver, executive             │
├──────────────────────────────────────────────────┤
│  AWS SES (Simple Email Service)                   │
│  From: no-reply@fll.sa                            │
│  Uses: OTP delivery, onboarding notifications,    │
│        contact confirmations, welcome emails       │
├──────────────────────────────────────────────────┤
│  AWS S3                                           │
│  Bucket: fll-kyc-documents-230811072086            │
│  Uses: Driver KYC documents, vehicle photos        │
├──────────────────────────────────────────────────┤
│  AWS DynamoDB                                     │
│  Table: fll-chat-history (TTL: 30 days)           │
│  Uses: AI chatbot conversation persistence         │
├──────────────────────────────────────────────────┤
│  AWS Bedrock                                      │
│  Model: Claude Sonnet                             │
│  Uses: AI chatbot, finance analysis                │
└──────────────────────────────────────────────────┘
```

---

## 3. Supabase Database

### Connection

```
Project:  djebhztfewjfyyoortvv.supabase.co
Region:   (Supabase-managed)
Auth:     Supabase Auth + custom OTP
RLS:      Enabled on sensitive tables
```

### Schema Map

```
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE PostgreSQL                           │
├─────────────────┬───────────────────┬───────────────────────────┤
│  public          │  master            │  finance                   │
│  (core tables)   │  (reference data)  │  (financial engine)        │
│                  │                    │                            │
│  users           │  platforms (7)     │  platform_rate_cards       │
│  staff_profiles  │  cities (16)      │  platform_bonus_rules      │
│  couriers        │  drivers           │  platform_penalty_rules    │
│  driver_wallets  │  vehicles          │  platform_orders_fact      │
│  ledger_accounts │  driver_contract_  │  platform_driver_day_fact  │
│  ledger_entries  │   history          │  driver_wallets            │
│  wallet_txns     │  driver_vehicle_   │  driver_wallet_ledger      │
│  payout_batches  │   assignment_hist  │  payout_batches            │
│  payout_items    │  company_vehicle_  │  driver_payouts            │
│  driver_         │   cost_profiles    │  reconciliation_batches    │
│   applications   │                    │  reconciliation_items      │
│  driver_         │                    │  manual_adjustments        │
│   applications_  │                    │  approval_requests         │
│   archive        │                    │                            │
│  otp_attempts    │                    │                            │
│  admin_otp_codes │                    │                            │
│  driver_email_   │                    │                            │
│   otps           │                    │                            │
├─────────────────┼───────────────────┼───────────────────────────┤
│  staging         │  audit             │  ops                       │
│  (data pipeline) │  (audit trail)     │  (operational)             │
│                  │                    │                            │
│  file_uploads    │  (audit tables)    │  (ops tables)              │
│  platform_file_  │                    │                            │
│   templates      │                    │                            │
│  platform_       │                    │                            │
│   reports_raw    │                    │                            │
│  platform_       │                    │                            │
│   reports_staging│                    │                            │
└─────────────────┴───────────────────┴───────────────────────────┘
```

### Key Database Features

```
DOUBLE-ENTRY LEDGER:
  Every transaction = 2 immutable rows (debit + credit)
  PostgreSQL RULES block UPDATE/DELETE on ledger_entries
  Function: record_wallet_event() auto-updates wallet balances

EFFECTIVE DATING:
  Contracts, rate cards, vehicle assignments all have
  effective_from / effective_to for historical accuracy

TRIGGERS:
  • Auto-create wallet when courier is inserted
  • Auto-archive driver_applications on status change
  • Auto-update updated_at timestamps

KEY FUNCTIONS:
  • record_wallet_event()           → double-entry ledger write
  • approve_driver_application()    → creates courier + wallet
  • get_effective_rate_card()       → returns applicable pricing

VIEWS:
  • v_driver_current_status         → current contract + vehicle
  • v_daily_profitability           → P&L by date/platform/city
  • v_driver_daily_profitability    → per-driver daily P&L
  • v_platform_monthly_summary      → monthly revenue rollup
  • v_wallet_summary                → wallet balance totals
```

### Migration History

```
002  driver_wallet_ledger.sql         → Wallet + double-entry system
003  driver_applications.sql          → Driver onboarding tables
004  driver_onboarding_security.sql   → HMAC OTP table
005  admin_otp_codes.sql              → Admin OTP storage
006  finance_schema.sql               → Full finance engine (5 schemas)
007  finance_views.sql                → Financial views + seed data
```

---

## 4. Authentication Flow

```
                    ┌──────────────┐
                    │   User       │
                    │   Opens App  │
                    └──────┬───────┘
                           │
              ┌────────────▼────────────┐
              │  Which login page?       │
              ├────────────┬─────────────┤
              │            │             │
     /unified-login   /admin/login   /login
     (Staff/Courier)  (Direct Admin) (Driver)
              │            │             │
              └────────────┼─────────────┘
                           │
              ┌────────────▼────────────┐
              │  Email + Password        │
              │  → Cognito/Supabase      │
              │    signInWithPassword()  │
              └────────────┬─────────────┘
                           │
              ┌────────────▼────────────┐
              │  MFA Challenge?          │
              │  (EMAIL_OTP / SMS_MFA)   │
              ├──── YES ───┬──── NO ────┤
              │            │             │
    ┌─────────▼────────┐   │             │
    │  Send OTP via    │   │             │
    │  AWS SES/Lambda  │   │             │
    │  6-digit, 5min   │   │             │
    │  → Verify OTP    │   │             │
    └─────────┬────────┘   │             │
              └────────────┼─────────────┘
                           │
              ┌────────────▼────────────┐
              │  Fetch User Profile      │
              │  • users table           │
              │  • staff_profiles        │
              │  • Cognito groups        │
              └────────────┬─────────────┘
                           │
              ┌────────────▼────────────┐
              │  Role-Based Redirect     │
              ├──────────────────────────┤
              │  admin/owner → /admin-panel/dashboard    │
              │  finance    → /staff-finance             │
              │  hr         → /staff-hr                  │
              │  ops        → /staff-ops                 │
              │  fleet      → /staff-fleet               │
              │  staff      → /staff-dashboard           │
              │  driver     → /courier-dashboard         │
              │  executive  → /admin-dashboard           │
              └─────────────────────────────────────────┘

SESSION STORAGE:
  localStorage:
    fll_token  → JWT access token
    fll_user   → user profile object

PERMISSION SYSTEM (React SPA):
  AdminAuthProvider → context hook
    hasPermission(key) checks:
      1. User role (admin/owner = all)
      2. staff_profiles.permissions JSONB
    PermissionGuard wraps protected routes
```

---

## 5. Driver Onboarding System

```
┌─────────────────────────────────────────────────────────────────┐
│                    DRIVER ONBOARDING FLOW                        │
│                    /courier/register                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STEP 1: Personal Information                                    │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  Full Name (AR)  │  National ID  │  City            │        │
│  │  Phone           │  Email        │  Platform         │        │
│  │  Contract Type (freelance/company)                   │        │
│  │  Bank: STC Bank / IBAN                               │        │
│  │  Math CAPTCHA (30s refresh)                          │        │
│  └──────────────────────────┬──────────────────────────┘        │
│                              │                                   │
│  STEP 2: Email Verification  ▼                                   │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  Lambda: POST /driver/otp/send                       │        │
│  │  → Rate limit check (5/hour, IP-based)               │        │
│  │  → Generate 6-digit OTP                              │        │
│  │  → HMAC-SHA256 hash → Supabase driver_email_otps     │        │
│  │  → Send via AWS SES (no-reply@fll.sa)                │        │
│  │                                                       │        │
│  │  User enters OTP → POST /driver/otp/verify            │        │
│  │  → HMAC comparison → mark verified_at                 │        │
│  └──────────────────────────┬──────────────────────────┘        │
│                              │                                   │
│  STEP 3: Selfie + Liveness   ▼                                   │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  Camera capture (selfie photo)                       │        │
│  │  Liveness detection: 3 motions required              │        │
│  │    → Head turn left                                  │        │
│  │    → Head turn right                                 │        │
│  │    → Blink detection                                 │        │
│  │  Face similarity score calculated                    │        │
│  │  Device fingerprint: screen + timezone + UA hash      │        │
│  └──────────────────────────┬──────────────────────────┘        │
│                              │                                   │
│  STEP 4: Document Upload      ▼                                   │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  Required:                                           │        │
│  │    • National ID (front) → base64 → S3               │        │
│  │    • National ID (back)  → base64 → S3               │        │
│  │    • Driver License      → base64 → S3               │        │
│  │    • Bank Certificate    → base64 → S3               │        │
│  │                                                       │        │
│  │  S3 Bucket: fll-kyc-documents-230811072086            │        │
│  │  Notification: SES → admin emails                     │        │
│  └──────────────────────────┬──────────────────────────┘        │
│                              │                                   │
│  STEP 5: Vehicle Info (opt)   ▼                                   │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  Vehicle: type, brand, model, year, plate, color     │        │
│  │  Vehicle docs: front/back/side/registration/insurance│        │
│  │                                                       │        │
│  │  → POST /driver/apply                                 │        │
│  │  → Validate email verified (recent)                   │        │
│  │  → Check duplicates (national_id, email, phone)       │        │
│  │  → Upload all docs to S3                              │        │
│  │  → Create driver_applications record                  │        │
│  │  → Email notification to admins                       │        │
│  │  → Return reference: APP-XXXXXXXX                     │        │
│  └──────────────────────────┬──────────────────────────┘        │
│                              │                                   │
├──────────────────────────────▼──────────────────────────────────┤
│                                                                  │
│  ADMIN REVIEW (admin-panel/couriers)                             │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  View application details + documents                │        │
│  │  Check liveness score + face similarity              │        │
│  │                                                       │        │
│  │  ┌─ APPROVE ──────────────────────────────────┐      │        │
│  │  │  POST /driver/applications/{id}/approve     │      │        │
│  │  │  → approve_driver_application() RPC         │      │        │
│  │  │  → Creates courier record in Supabase       │      │        │
│  │  │  → Auto-creates driver_wallet (trigger)     │      │        │
│  │  │  → Creates Supabase Auth user               │      │        │
│  │  │  → Generates temporary password             │      │        │
│  │  │  → Sends welcome email with credentials     │      │        │
│  │  └────────────────────────────────────────────┘      │        │
│  │                                                       │        │
│  │  ┌─ REJECT ───────────────────────────────────┐      │        │
│  │  │  POST /driver/applications/{id}/reject      │      │        │
│  │  │  → Updates status to 'rejected'             │      │        │
│  │  │  → Sends rejection email with reason        │      │        │
│  │  └────────────────────────────────────────────┘      │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                  │
│  PUBLIC STATUS TRACKING (/application-status)                    │
│  → GET /driver/application-status?ref=APP-XXXXXXXX               │
│  → Shows: pending → under_review → approved/rejected             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Financial Data Pipeline

```
PLATFORM FILES                    STAGING                         FINANCE
─────────────                     ───────                         ───────
HungerStation ─┐
Keeta ─────────┤                  file_uploads
Ninja ─────────┤  Upload    ┌──→  (S3 path, hash,     Parse    platform_reports_raw
Mrsool ────────┼──────────→ │     validation)        ──────→   (raw JSON)
ToYou ─────────┤            │                                       │
Jahez ─────────┤            │     platform_file_                    │ Clean
Careem ────────┘            │     templates                         ▼
                            │     (column mapping)           platform_reports_staging
                            │                                (normalized data)
                            │                                       │
                            │                                       │ Apply Rates
                            │     get_effective_rate_card()          ▼
                            │     (platform + city + contract   platform_orders_fact
                            │      + vehicle + ownership)      (gross/commission/VAT
                            │                                   /bonus/penalty)
                            │                                       │
                            │                                       │ Aggregate
                            │                                       ▼
                            │                                platform_driver_day_fact
                            │                                (daily driver summary)
                            │                                       │
                            │     record_wallet_event()              │ Post
                            │     (double-entry ledger)              ▼
                            │                                driver_wallet_ledger
                            │                                + driver_wallets
                            │                                       │
                            │     reconciliation_batches             │ Reconcile
                            │     reconciliation_items        ◄─────┘
                            │                                       │
                            │     manual_adjustments                 │ Adjust
                            │     → approval_requests         ◄─────┘
                            │                                       │
                            │     payout_batches                     │ Pay
                            │     → driver_payouts            ◄─────┘
                            │     (draft→pending→processing
                            │      →completed/failed)
```

---

## 7. Security Architecture

```
LAYER              MECHANISM                           DETAILS
─────              ─────────                           ───────
Authentication     AWS Cognito + Supabase Auth         Password + optional OTP
MFA                EMAIL_OTP via AWS SES               6-digit, 5-min expiry
OTP Storage        HMAC-SHA256 in Supabase             Never plaintext (driver OTPs)
Rate Limiting      5 OTP sends/hour, 5 verifies/10min  Per-email + per-IP
Session            JWT in localStorage                 Auto-logout on 401
Authorization      Cognito Groups + staff_profiles     Role + permission-based
Route Guards       PermissionGuard component           Wraps React routes
Database           Row Level Security (RLS)            Supabase-enforced
Ledger             Immutable (no UPDATE/DELETE)         PostgreSQL RULES
Biometric          Liveness detection (3 motions)      Head turn + blink
KYC                Document upload to S3               National ID, license, selfie
Device             Fingerprinting on registration      Screen + timezone + UA hash
Email              SES verified domain (fll.sa)        SPF/DKIM/DMARC
API                API Gateway + Lambda                No direct DB exposure
```

---

## 8. Supported Platforms & Cities

```
PLATFORMS (7):                    CITIES (16):
├── HungerStation                 ├── Riyadh        ├── Tabuk
├── Keeta                         ├── Jeddah        ├── Buraydah
├── Ninja                         ├── Dammam        ├── Abha
├── Mrsool                        ├── Makkah        ├── Hail
├── ToYou                         ├── Madinah       ├── Najran
├── Jahez                         ├── Khobar        ├── Jazan
└── Careem                        ├── Taif          ├── Yanbu
                                  ├── Jubail        └── Al Ahsa
```

---

## 9. PWA & Offline Support

```
manifest.json:
  Name: فيرست لاين لوجستيكس (FLL)
  Dir: RTL  │  Lang: AR
  Theme: #0f2744
  Display: standalone
  Icons: 192x192, 512x512

sw.js (Service Worker):
  Install  → Cache: /, logo, shared JS
  Fetch    → Network-first, cache fallback
  Activate → Clean old caches
```

---

## 10. External Integrations (AWS Marketplace)

```
Nected        → Business rules engine (commission/penalty rules)
Veri5now      → KYC identity verification
AI Finance    → Financial analysis automation
Turiya        → AI Agent triggers
```
