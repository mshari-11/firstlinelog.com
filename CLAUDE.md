# FirstLine Logistics — Project Context

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
- **API Gateways**: 2 (HTTP API `xr7wsfym5k` ⚠️ BROKEN + REST API `qihrv9osed` OK)
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

## OTP System
- `input-otp@1.2.4` + shadcn wrapper: `src/components/ui/input-otp.tsx`
- Used in: UnifiedPortal, DriverLogin, ForgotPassword, Admin Login, Courier Register
- Lambda: POST `/auth/send-otp` + `/auth/verify-custom-otp` (from no-reply@fll.sa)
- Admin login: password → OTP → dashboard (2FA enforced)

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

## AWS Account (230811072086, me-south-1)
- 16 Lambda functions, 39 DynamoDB tables, 17 S3 buckets
- SES production: 50k/day, identities: fll.sa, noreply@fll.sa
- Cognito: `me-south-1_aJtmQ0QrN` (fll-platform-userpool-prod), MFA=OPTIONAL with TOTP
- 10 EventBridge rules (SLA hourly, backup daily, payout weekly)

### ⚠️ CRITICAL: API Gateway Issues (as of 2026-03-28)
- **HTTP API `xr7wsfym5k`**: Returns 500 on ALL requests — authorizer is broken
  - 26 source files reference this endpoint (src/lib/api.ts, auth.tsx, stores, etc.)
  - ALL OTP, Auth, Chat, AI endpoints are non-functional via this API
  - Fix: Remove or reconfigure the authorizer via AWS Console → HTTP APIs → xr7wsfym5k → Authorization
- **REST API `qihrv9osed`** (`fll-platform-api-prod`): Working (stage: prod, rate: 10k/s, burst: 5k)
  - Endpoint: `https://qihrv9osed.execute-api.me-south-1.amazonaws.com/prod`
  - No WAF/Web ACL configured
  - Cache cluster: Inactive
- **`fll-ai-finance-review`**: No invocations detected — function exists but has no trigger
