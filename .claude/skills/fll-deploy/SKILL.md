---
name: fll-deploy
description: "Deployment and infrastructure management for FLL: Lambda deployment, Vercel configuration, database migrations, environment setup, and health checks. Use when deploying code, managing infrastructure, or troubleshooting deployment issues."
---

# FLL Deployment & Infrastructure Skill

You are managing the deployment infrastructure for First Line Logistics (fll.sa).

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                    Vercel                        │
│  ┌─────────────┐  ┌──────────────────────────┐  │
│  │ Static HTML  │  │ React SPA (dist/)        │  │
│  │ (15 pages)   │  │ (25+ pages)              │  │
│  └─────────────┘  └──────────────────────────┘  │
└───────────────────────┬─────────────────────────┘
                        │ API calls
┌───────────────────────▼─────────────────────────┐
│           AWS API Gateway (me-south-1)           │
│           xr7wsfym5k                             │
├──────────────────────────────────────────────────┤
│  Lambda Functions (8)                            │
│  ├── fll-auth-api (Python 3.12)                  │
│  ├── fll-finance-engine (Node.js)                │
│  ├── fll-finance-insights (Python 3.12)          │
│  ├── fll-driver-onboarding (Python 3.12)         │
│  ├── fll-kyc-upload (Python 3.12)                │
│  ├── fll-otp-email (Python 3.12)                 │
│  ├── fll-chatbot (Python 3.12)                   │
│  └── fll-contact-confirm (Python 3.12)           │
├──────────────────────────────────────────────────┤
│  Data Stores                                     │
│  ├── DynamoDB (16 tables)                        │
│  ├── Supabase PostgreSQL (14+ tables)            │
│  ├── Aurora PostgreSQL (designed, not live)       │
│  ├── S3 (fll-kyc-documents, fll-ops-raw)         │
│  └── Cognito User Pool                           │
└──────────────────────────────────────────────────┘
```

## Deployment Script

**File:** `deploy-lambdas.sh`

```bash
./deploy-lambdas.sh auth           # Deploy auth API only
./deploy-lambdas.sh onboarding     # Deploy driver onboarding
./deploy-lambdas.sh all            # Deploy both
```

**Region:** me-south-1 (Bahrain)
**API ID:** xr7wsfym5k
**Account:** 230811072086

## Environment Variables

**File:** `env.example` — Reference for all required variables.

### Critical Variables
| Variable | Service | Required |
|----------|---------|----------|
| `VITE_SUPABASE_URL` | Supabase | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase | Yes |
| `VITE_API_BASE` | API Gateway | Yes |
| `VITE_MAPBOX_TOKEN` | Mapbox | Yes |
| `USER_POOL_ID` | Cognito | Yes |
| `COGNITO_CLIENT_ID` | Cognito | Yes |
| `AURORA_HOST` | Aurora | When FEATURE_AURORA_ENABLED=true |

### Feature Flags (DynamoDB `fll-system-settings`)
```
FEATURE_FINANCE_ENGINE=false
FEATURE_AURORA_ENABLED=false
FEATURE_WALLET_LEDGER=false
FEATURE_RECONCILIATION=false
FEATURE_FRAUD_DETECTION=false
FEATURE_NECTED_ENABLED=false
FEATURE_N8N_ENABLED=false
FEATURE_VERI5NOW_ENABLED=false
FEATURE_AI_FINANCE_INSIGHTS=false
FEATURE_TURIYA_ENABLED=false
```

## Frontend Build

```bash
npm run build    # Vite build → dist/ + rename dist/spa.html → dist/index.html
```

**Config:** `vite.config.ts`
- Base: `/dist/`
- Input: `spa.html`
- Output: `dist/`
- Alias: `@` → `./src`

**Vercel:** `vercel.json`
- 31 rewrite rules
- SPA routes → `/dist/spa.html`
- Static routes → root HTML files
- Cache: `no-cache` on HTML

## Database Migrations

**Location:** `supabase/migrations/`

```
002_driver_wallet_ledger.sql     — Wallets, ledger, payouts
003_driver_applications.sql      — Driver onboarding
004_driver_onboarding_security.sql — OTP management
005_admin_otp_codes.sql          — Admin OTP login
```

**Aurora schema:** Defined in architecture docs, not yet in migrations folder.

## Integration Health

**File:** `lambda-code/integrations/tools-health.js`
- Checks: Nected, n8n, Veri5now, Turiya, AWS services
- Method: `checkAllHealth()` → returns status object

## Deployment Checklist

### Before Deploy
1. Check `env.example` for any new variables
2. Verify feature flags in DynamoDB `fll-system-settings`
3. Run `npm run build` locally to verify frontend builds
4. Check Supabase migrations are applied

### Lambda Deploy
1. Package the function code (zip)
2. Use `aws lambda update-function-code` (see `deploy-lambdas.sh`)
3. Update environment variables if needed
4. Test the API endpoint after deploy

### Frontend Deploy
1. Push to branch → Vercel auto-deploys
2. Verify rewrite rules in `vercel.json`
3. Check that `/dist/` is generated
4. Test key routes: `/admin-panel/dashboard`, `/staff-finance`, `/courier-dashboard`

### Rollback
1. Lambda: Use `aws lambda update-function-code` with previous zip
2. Frontend: Revert commit → Vercel re-deploys
3. Database: Write reverse migration (never drop tables in production)
4. Feature flags: Disable via DynamoDB `fll-system-settings`

## Security Reminders
- Never commit `.env` files
- Never expose `SUPABASE_SERVICE_KEY` in frontend code
- Never use `COGNITO_CLIENT_SECRET` in browser code
- API keys for integrations go in Lambda env vars only
- Use pre-signed URLs for S3 access (time-limited)
