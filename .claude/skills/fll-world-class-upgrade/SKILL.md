---
name: fll-world-class-upgrade
description: "Perform a full additive, finance-first upgrade of the FLL project. Use when asked to upgrade the system, implement new phases, or execute the architecture upgrade plan."
---

# FLL World-Class Additive Upgrade Skill

You are executing a phased, additive upgrade of First Line Logistics (fll.sa) to a world-class, finance-first, production-grade architecture.

## Golden Rules

1. **ADDITIVE ONLY** — Do not remove, rename, or rewrite existing code unless absolutely necessary
2. **PRESERVE BEHAVIOR** — All current production flows must keep working unchanged
3. **FEATURE FLAGS** — New functionality behind flags in DynamoDB `fll-system-settings`
4. **FINANCE FIRST** — Finance = source of truth, append-only ledger, no direct balance mutation

## Implementation Phases

### Phase 0: Audit & Architecture Map ✅ DONE
- `CLAUDE.md` — Project charter
- `architecture-upgrade-plan.md` — Phase-by-phase plan
- `finance-engine-design.md` — Finance system design
- `INFRASTRUCTURE-REVIEW.md` — Full infrastructure audit
- `.claude/commands/fll-world-class-upgrade.md` — Upgrade command

### Phase 1: Finance Data Model & Wallet Ledger ✅ DONE
- `supabase/migrations/002_driver_wallet_ledger.sql` — Double-entry ledger
- `lambda-code/fll-finance-engine/index.js` — Finance Lambda (DynamoDB)
- Wallet CRUD, payout batching, reconciliation, adjustments, fraud detection, rules

### Phase 2: Nected Integration (Rules Engine)
- `lambda-code/integrations/nected-adapter.js` ✅ Adapter ready
- TODO: Deploy Nected, configure API keys, connect to payout calculation
- Feature flag: `FEATURE_NECTED_ENABLED`

### Phase 3: n8n Integration Hub
- `lambda-code/integrations/n8n-adapter.js` ✅ Adapter ready
- TODO: Deploy n8n, configure webhooks, connect report ingestion
- Feature flag: `FEATURE_N8N_ENABLED`

### Phase 4: Veri5now Onboarding
- `lambda-code/integrations/veri5now-adapter.js` ✅ Adapter ready
- TODO: Deploy Veri5now, configure API keys, connect to onboarding
- Feature flag: `FEATURE_VERI5NOW_ENABLED`
- Note: Saudi eKYC NOT activated — eSign only

### Phase 5: AI Financial Report Analyst
- `lambda-code/fll-finance-insights/lambda_function.py` ✅ Lambda ready
- TODO: Configure Bedrock Agent, connect curated finance data
- Feature flag: `FEATURE_AI_FINANCE_INSIGHTS`

### Phase 6: Turiya AI Pilot
- `lambda-code/integrations/turiya-adapter.js` ✅ Adapter ready
- TODO: Deploy Turiya, pilot with read-only access
- Feature flag: `FEATURE_TURIYA_ENABLED` (disabled by default)

### Phase 7: RBAC, Pages, Navigation, Icons
- `fll-rbac.js` ✅ Client-side RBAC
- `src/components/admin/PermissionGuard.tsx` ✅ React guard
- Lambda `requireRole()` ✅ Server-side
- TODO: Complete remaining UI pages from CLAUDE.md list
- Required pages:
  - Finance: /finance/upload-center, /finance/reconciliation, /finance/rules, /finance/wallets, /finance/payout-batches, /finance/adjustments, /finance/profitability, /finance/fraud-queue, /finance/insights
  - Admin: /admin/tools-health, /admin/feature-flags, /admin/rbac, /admin/integrations, /admin/audit
  - HR: /hr/onboarding, /hr/contracts, /hr/documents, /hr/signature-status
  - Ops: /ops/live, /ops/alerts, /ops/performance
  - Fleet: /fleet/vehicles, /fleet/costs, /fleet/assignments
  - Driver: /driver/wallet, /driver/earnings, /driver/payouts, /driver/contract, /driver/vehicle

### Phase 8: Tests, Docs, Deployment
- TODO: Unit tests for finance functions
- TODO: Integration tests for Lambda
- TODO: E2E tests for dashboards
- TODO: Runbooks for each phase
- TODO: Rollback plans

## Current Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + Radix UI + TanStack Query |
| Styling | Custom CSS (`fll-design-system.css`) + Tailwind v4 |
| Auth | AWS Cognito + Supabase Auth (dual) |
| API | AWS API Gateway + Lambda (Node.js + Python) |
| DB Live | Supabase PostgreSQL |
| DB Planned | AWS Aurora PostgreSQL |
| NoSQL | AWS DynamoDB (16 tables) |
| Storage | AWS S3 |
| AI | AWS Bedrock (Claude Sonnet) |
| Hosting | Vercel |

## Tool Placement Rules

| Tool | Use For | NOT For |
|------|---------|---------|
| **Nected** | Rules: payouts, bonuses, penalties, approvals | Direct DB writes |
| **n8n** | Email, SFTP, report ingestion, notifications | Core payout/ledger path |
| **Veri5now** | Contract signing, onboarding, eSign | Core finance |
| **AI Analyst** | Read-only finance insights | Finance writes |
| **Turiya AI** | Read-only copilot (pilot only) | Any writes |

## After Each Phase, Document

- Files changed
- Migrations added
- Feature flags added
- Env vars added
- Risks
- Rollback steps
