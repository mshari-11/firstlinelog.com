# CLAUDE.md — FLL Platform (firstlinelog.com)

## Project Overview
First Line Logistics (FLL) web platform — internal operations dashboard for managing delivery riders, orders, and performance tracking.

- **Repo:** mshari-11/firstlinelog.com
- **Deployed:** Vercel
- **Stack:** React + Vite + JavaScript

---

## Architecture

### Frontend
- **Framework:** React + Vite
- **Language:** JavaScript (JSX)
- **Styling:** (to be confirmed — likely Tailwind or CSS modules)
- **Routing:** React Router
- **Deployment:** Vercel (auto-deploy from main branch)

### Backend / Cloud (AWS)
- **Auth:** AWS Cognito (OTP-based, email via SES)
- **API:** API Gateway → Lambda functions
- **Logs:** CloudWatch
- **Region:** (confirm: me-south-1 or us-east-1?)

### Auth Flow
- User enters email → receives OTP via AWS SES → confirms OTP → Cognito issues tokens
- Known issues: SES in Sandbox mode, Suppression List blocks some emails, SPF/DKIM/DMARC DNS records need verification

---

## Naming Conventions (Claude-Suggested — confirm or override)

### Files & Folders
```
src/
├── components/        # Reusable UI pieces
│   └── Button.jsx     # PascalCase for components
├── pages/             # Route-level pages
│   └── Dashboard.jsx  # PascalCase for pages
├── hooks/             # Custom React hooks
│   └── useAuth.js     # camelCase with "use" prefix
├── services/          # API calls & external integrations
│   └── authService.js # camelCase with "Service" suffix
├── utils/             # Pure helper functions
│   └── formatDate.js  # camelCase
├── constants/         # Static values & config
│   └── apiConfig.js   # camelCase
└── context/           # React Context providers
    └── AuthContext.jsx # PascalCase with "Context" suffix
```

### Component Naming
| Type | Convention | Example |
|------|-----------|---------|
| Component file | PascalCase | `RiderCard.jsx` |
| Page file | PascalCase + "Page" suffix | `DashboardPage.jsx` |
| Hook file | camelCase + "use" prefix | `useRiderData.js` |
| Service file | camelCase + "Service" suffix | `riderService.js` |
| Utility file | camelCase | `formatOrders.js` |
| Constant file | camelCase | `riderConfig.js` |

### Variables & Functions
- Components: `PascalCase` → `RiderTable`
- Functions: `camelCase` → `fetchRiderOrders()`
- Constants: `UPPER_SNAKE_CASE` → `MAX_RIDERS_PER_PAGE`
- Boolean vars: `is/has/can` prefix → `isLoading`, `hasError`, `canEdit`

---

## Business Domain (FLL-Specific)

### Rider Categories
- **كفالة (Kefala):** Sponsored riders — tracked via Ninja Captain CSVs
- **حر (Freelance):** Freelance riders — tracked via 3PL Hunger Station CSV

### Key Metrics
- Orders per rider (daily/weekly)
- Attendance rate
- Performance vs target

### Data Sources
- Ninja Captain: cumulative data → use MAX across files
- 3PL Hunger Station: cumulative data → use subtraction logic for daily increments
- Kita Excel: attendance & base data

---

## Known Issues & Context
- Cognito OTP emails sometimes blocked → check SES Suppression List first
- API Gateway has had breaking changes → always verify endpoint URLs in AWS Console
- Sidebar CSS layout issue → (describe fix here once resolved)
- Vercel deployment: environment variables must be set in Vercel dashboard, not just .env

---

## Claude Behavior Guidelines

### Always
- Use JavaScript (JSX), not TypeScript
- Follow the naming conventions defined above
- Keep components small and single-responsibility
- Check if a utility function already exists in `/utils` before creating a new one
- When touching AWS/Cognito code, note any SES or auth edge cases

### Never
- Don't add TypeScript or convert JS files to TS
- Don't change the Vite config without explaining why
- Don't use `var` — use `const` and `let` only
- Don't create files outside the `src/` structure without asking

### When Debugging AWS Issues
1. Check CloudWatch logs first
2. Verify environment variables in Vercel dashboard
3. Confirm API Gateway endpoint is deployed (not just saved)
4. Check Cognito User Pool settings before touching code

---

## Environment Variables (Vercel + Local)
```
VITE_COGNITO_USER_POOL_ID=
VITE_COGNITO_CLIENT_ID=
VITE_API_GATEWAY_URL=
VITE_AWS_REGION=
```
> ⚠️ Never commit actual values. Always use Vercel dashboard for production secrets.

---

## Quick Commands
```bash
npm run dev          # Local development
npm run build        # Production build
npm run preview      # Preview production build locally
```

---

*Last updated: April 2026 — update this file whenever architecture changes*

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

## Testing & Quality (April 2026)

### Playwright E2E Tests
- Config: `playwright.config.ts` (chromium only)
- Tests: `e2e/admin/` directory
- Run: `npm run test:e2e` or `npm run test:e2e:ui`
- Auth mocking: `e2e/helpers/auth-mock.ts` (localStorage injection)
- Tested pages: Dashboard, Feedbacks, Settings, Navigation

### Pyright Type Checking
- Config: `pyrightconfig.json` (basic mode)
- Scope: `src/` only (excludes lambda-code, supabase, e2e)
- Run via Pyright LSP in editor

### Custom Commands
- `/deploy` — Build + commit + push (auto-deploy to Vercel)
- `/review` — Code review of recent changes
- `/db-check` — Supabase database health check
- `/test` — Run full test suite (types + e2e + build)

### API Documentation
- Location: `docs/admin-panel-api.md`
- Covers all admin panel API endpoints
- Arabic descriptions with English endpoint paths

### Code Review Reports
- Location: `docs/code-review-*.md`
- Generated per feature/sprint
- Severity levels: 🔴 Critical, 🟡 Warning, 🟢 Info
