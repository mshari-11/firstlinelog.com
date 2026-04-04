# FirstLine Logistics — Project Context

## Working Scope — Admin Panel ONLY

### Allowed (Work HERE)
- `src/pages/admin/*` — All admin panel pages (operations, finance, vehicles, HR, couriers, orders, complaints, staff, dashboard, governance)
- `src/components/admin/*` — Admin UI components, dashboard widgets, FinanceUI
- `src/stores/*` — Zustand stores for admin features
- `src/components/ui/*` — shadcn/ui components (NOT input-otp.tsx)
- Supabase queries, Edge Functions, SQL migrations for admin features
- Lambda functions for admin features (NOT auth Lambda)

### FORBIDDEN (NEVER touch)
- `index.html` — Static public website (design, images, content)
- `public/*` — Static assets for marketing site
- `src/pages/admin/Login.tsx` — Login page
- `src/pages/UnifiedLogin.tsx` — Unified login page
- `src/pages/ForgotPassword.tsx` — Password reset page
- `src/pages/courier/Register.tsx` — Courier registration
- `src/lib/otp-service.ts` — OTP service
- `src/lib/admin/auth.tsx` — Auth context
- `src/lib/cognito.ts` — Cognito SDK
- `src/components/ui/input-otp.tsx` — OTP input component
- `lambda-code/fll-auth-api/app.py` — Auth Lambda
- `lambda-code/platform-api-prod.js` — Platform proxy
- `sw.js` — Service worker
- `vercel.json` — Vercel config (rewrites, headers)

### Safety Rules
- NEVER delete mock data from any admin page
- NEVER drop/truncate Supabase tables — only ADD columns or tables
- NEVER modify Cognito, SES, or IAM configurations
- NEVER force push to main
- Always `npm run build` before committing to verify no build errors
- Always keep fallback mock data when wiring real API data

## Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui (Radix)
- **Backend**: Supabase (Auth + DB + Edge Functions) + AWS Lambda + SES
- **Hosting**: Vercel (static + rewrites)
- **Repo**: github.com/mshari-11/firstlinelog.com

## Architecture

- Static public site: `/index.html` (root)
- React SPA: `/spa.html` → builds to `/dist/`
- Vercel rewrites admin/courier/login routes to `/dist/index`
- Supabase handles auth + database
- AWS Lambda for serverless functions (in `/lambda-code/`)
- AWS SES for emails

## Key Paths

- `/src/` — React SPA source
- `/src/lib/supabase.ts` — Supabase client
- `/src/lib/admin/auth.tsx` — Admin auth context
- `/src/pages/admin/` — Admin panel pages
- `/src/pages/courier/` — Courier portal pages
- `/lambda-code/` — AWS Lambda functions
- `/vercel.json` — Vercel rewrites & headers
- `/vite.config.ts` — Vite config with SPA fallback

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Build for production
- `vercel` — Deploy to Vercel
- `vercel --prod` — Deploy to production
- `aws lambda list-functions --region me-south-1` — List Lambda functions
- `supabase status` — Check Supabase status
- `git push origin main` — Push to GitHub

## Environment Variables (required in .env.local)

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key

## Infrastructure (updated 2026-03-28)

- **Lambda Functions**: 16 (Python 3.12 + Node.js 18.x) in `/lambda-code/`
- **Supabase Edge Functions**: 35 in `/supabase/functions/`
- **API Gateways**: 2 (HTTP API `k8d4arcxu4` ⚠️ BROKEN + REST API `qihrv9osed` OK)
- **DynamoDB Tables**: 39 (all Active)
- **S3 Buckets**: 17
- **CloudWatch Alarms**: 37 (36 OK, 1 Insufficient data)
- **Supabase Schemas**: public, finance, master, staging, ops, audit, admin, hr
- **Admin Pages**: 54+ (all wired to real Supabase/API data with fallback)
- **Governance Pages**: 7 (PermissionManager, FeatureToggles, WorkflowBuilder, SLAConfig, AuditDashboard, InfrastructureOverview, ApiManagement)
- **Public Pages**: 20 (marketing + auth + courier)
- **Legacy HTML**: 9 files → 301 redirects to SPA routes via vercel.json

## Conventions

- Arabic RTL UI throughout — `dir="rtl"` on root containers
- Path alias: `@/` → `./src/`
- Admin pages use inline styles with `--con-*` CSS variables (NOT Tailwind classes)
- Admin UI components: `PageWrapper, PageHeader, KPIGrid, Card, Table, Modal` from `@/components/admin/ui`
- Finance UI: `ChartCard, StatusBadge, DataTable` from `@/components/admin/FinanceUI`
- Zustand stores persist to localStorage with `fll_` prefix
- All pages use `try/fetch/catch → keep fallback` pattern — mock data first, Supabase upgrade
- Supabase client can be null — always guard with `if (!supabase)`
- After completing any feature: `npm run build` → `git commit` → `git push origin main` (Vercel auto-deploys)

## Service Worker Warning

- `sw.js` at root intercepts GET requests — SPA routes EXCLUDED (network-only)
- Cache version: `fll-v2` — bump when changing SW behavior
- Never cache: `/admin*`, `/unified-login`, `/login`, `/courier*`, `/dist/`

## OTP System — LOCKED (DO NOT MODIFY)

⚠️ **CRITICAL: These files and configurations are LOCKED. DO NOT change, remove, or refactor them.**
⚠️ **Any modification to OTP flow MUST be approved by the project owner first.**

### Protected Files (NEVER modify without explicit permission):

- `src/lib/otp-service.ts` — OTP send/verify with dual fallback (API Gateway → Supabase Edge)
- `src/lib/admin/auth.tsx` — Auth context, signIn, signOut, hasPermission
- `src/lib/cognito.ts` — Cognito SDK wrapper (Pool: us-east-1_qHMox2NTB, Client: 4rqqpv12h8pco73oice3emavus)
- `lambda-code/fll-auth-api/app.py` — Auth Lambda (12 routes, SES OTP, Cognito auth)
- `lambda-code/platform-api-prod.js` — Proxy logic for /auth/\* → fll-auth-handler

### OTP Configuration (LOCKED):

- Lambda: `fll-auth-handler` (Python 3.12, us-east-1)
- IAM Role: `fll-lambda-execution-role` (SES + Cognito permissions)
- SES: `no-reply@fll.sa` via me-south-1 (verified domain)
- Supabase: `admin_otp_codes` table (stores OTP codes, 5-min expiry, rate limited)
- API Routes: `/auth/send-otp`, `/auth/verify-custom-otp`, `/auth/forgot-password`
- OTP Types: `login`, `register`, `reset_password`, `verify_email`, `driver_register`, `sensitive_action`
- Component: `input-otp` (shadcn) — `src/components/ui/input-otp.tsx`

### Pages using OTP (all working, DO NOT break):

- `/unified-login` — Admin/Staff login (password → OTP → dashboard)
- `/login` — Driver login (password → OTP → portal)
- `/forgot-password` — Password reset (email → OTP → new password)
- `/courier/register` — New courier registration (email → OTP → verify → submit)

### Cognito Groups (LOCKED):

- `admin` group → role=admin → sees all 47 sidebar pages
- `staff` group → role=staff → sees pages based on permissions
- `owner` group → role=owner → sees all pages

## Finance Engine (March 2026)

- `finance.accounting_components` — additions/deductions rules (CRUD page)
- `finance.payout_run_stages` — 5-stage approval (Finance→Ops→Fleet→HR→Final)
- STC Bank Excel: Lambda `fll-generate-stc-excel`, 3 columns (Reference, Phone 966+, Amount)
- `stc_bank_phone_local` (9 digits starting with 5) → auto `stc_bank_phone_int` (966XXXXXXXXX)

## Control Tower Dashboard

- Zone layout: Executive (KPIs) → Operational (Charts+Alerts) → Finance → Infrastructure
- 11 widgets, each self-contained — `src/components/admin/dashboard/widgets/`
- Stores: `useDashboardStore`, `useModuleRegistry`, `useNotificationStore`, `usePayoutWorkflowStore`
- Sidebar v2: collapsible groups, search, dynamic notification badges
- Governance: 7 pages under `/admin-panel/governance/`

## AWS Account (230811072086)

### Primary Region: us-east-1 (Virginia) — migrated 2026-03-31

- **Platform API**: `https://k8d4arcxu4.execute-api.us-east-1.amazonaws.com`
  - Lambda: `fll-platform-api-prod` (Node.js 18.x)
  - 39 DynamoDB tables (PAY_PER_REQUEST)
- **AI Chatbot**: `https://agr6khtuu9.execute-api.us-east-1.amazonaws.com/ai/chat`
  - Lambda: `fll-ai-chatbot` (Python 3.12)
  - Model: Bedrock Claude Haiku 4.5 (`us.anthropic.claude-haiku-4-5-20251001-v1:0`)
- **Cognito**: `us-east-1_qHMox2NTB` (fll-platform-userpool-prod)
  - Staff client: `4rqqpv12h8pco73oice3emavus`
  - Drivers client: `ttlbr78d29vu4hrt7gh5mekqe`

### Legacy Region: me-south-1 (Bahrain) — ⚠️ DEAD, do not use
- S3 Buckets: 17 (still active)
- Everything else: BROKEN or migrated

## CRITICAL OPERATIONAL RULES

### Never Do
- Never delete mock data from admin pages
- Never modify OTP/auth files without explicit permission (LOCKED section above)
- Never use me-south-1 for ANY service
- Never assume DynamoDB key is `id` — each table has unique keys:
  - `fll-drivers`: `driverId` | `fll-orders`: `orderId` | `fll-complaints`: `complaintId`
  - `fll-vehicles`: `vehicleId` | `fll-users`: `userId` | `fll-staff-users`: `sub`
  - `fll-payout-runs`: `runId` | `fll-audit-log`: `auditId` | `fll-accounting-rules`: `ruleId`
  - `fll-notifications`: `recipient_sub` + `createdAt_id` (composite key)

### SES Email
- Domain `fll.sa` DKIM verified in us-east-1 (Route53 zone: Z08011502Q9BI0871UM72)
- Sender: `no-reply@fll.sa` via `boto3.client('ses', region_name='us-east-1')`
- Always send email **async** (threading) — SES can take 10s+ and cause timeout
- me-south-1 SES is DEAD

### Cognito
- Always `.toLowerCase().trim()` on email before ANY auth call
- OTP verify returns `{verified: true}` not `{success: true}` — check both
- Auth routes go **directly** to `fll-auth-handler` (not proxied through platform API)

### API Gateway
- Max timeout: 30s — never proxy slow Lambdas through platform API
- Auth routes: direct integration `ejc7n20` → `fll-auth-handler`
- Platform routes: integration `u6r67ur` → `fll-platform-api-prod`
- AI chat: separate API `agr6khtuu9`

### PageBuilder Sidebar
- Config: localStorage `fll_page_config_v2` — bump version to force reset
- `loadConfig()` merges saved + defaults — new pages auto-appear

### Deployment
- Frontend: `npx vercel --prod` (NOT GitHub Pages — disabled)
- Lambda zip: platform API = `index.js`, auth = `app.py`
- Edge Functions: `npx supabase functions deploy <name> --no-verify-jwt`
- SQL: `npx supabase db query --linked -f <file.sql>`
- Repo: **PRIVATE** (changed 2026-04-01)

### Edge Functions (39 total)
- Cron: `pg_cron` + `pg_net` — daily-report 8AM + license-alerts 7AM Saudi time
- auto-payroll, license-alerts, daily-report, vector-search (deployed + tested)
