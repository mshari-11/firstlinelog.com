# FLL Architecture Upgrade Plan
**Date**: 2026-03-11 | **Version**: 1.0

## Current State Summary

### Tech Stack
- **Frontend**: React (Vite) + Vanilla HTML dashboards, RTL Arabic, Lucide icons
- **Auth**: AWS Cognito (me-south-1) with Email OTP MFA, JWT in localStorage
- **Backend**: AWS Lambda (Node.js + Python), API Gateway
- **Databases**: DynamoDB (operational), Supabase PostgreSQL (real-time), Aurora PostgreSQL (finance — schema defined, not deployed)
- **Storage**: S3 (reports: fll-ops-raw, KYC: fll-kyc-documents)
- **AI**: Bedrock (Claude Sonnet chatbot)
- **Hosting**: Vercel (frontend) + AWS (backend)
- **Region**: me-south-1 (Bahrain)

### Architecture Gaps
1. Aurora finance engine schema exists (`fll-finance-schema.sql`) but is not deployed or connected
2. No append-only wallet ledger active — DynamoDB payout tables lack immutability
3. No Step Functions for payout orchestration
4. No EventBridge as event bus
5. Nected, n8n, Veri5now, AI Financial Report Analyst, Turiya AI — not integrated
6. RBAC exists in Cognito groups but no server-side route guards
7. No reconciliation engine active
8. Finance pages exist in staff-finance.html but use DynamoDB, not Aurora

---

## Implementation Phases

### Phase 0: Infrastructure Files ✅
- [x] CLAUDE.md
- [x] .claude/commands/fll-world-class-upgrade.md
- [x] .claude/settings.json (hooks)
- [x] .claude/hooks/security-check.sh
- [x] .claude/hooks/check-style.sh

### Phase 1: Finance Core
**Goal**: Build the finance engine Lambda functions and connect Aurora schema

#### 1.1 Finance Engine Lambda
- Create `lambda-code/fll-finance-engine/` with modular handlers:
  - `wallet.js` — Wallet CRUD + append-only ledger
  - `payouts.js` — Payout batch creation, calculation, approval
  - `reconciliation.js` — Platform vs internal variance detection
  - `adjustments.js` — Manual adjustment with approval workflow
  - `fraud.js` — Anomaly detection and fraud flags
  - `ingestion.js` — Platform report upload → staging → fact tables
  - `rules.js` — Rate card and rules management
  - `reports.js` — Profitability and financial reporting

#### 1.2 Finance API Routes
New API Gateway routes:
```
POST   /finance/wallets                    → List driver wallets
GET    /finance/wallets/:driverId          → Driver wallet + ledger
POST   /finance/wallets/:driverId/credit   → Credit (append ledger)
POST   /finance/wallets/:driverId/debit    → Debit (append ledger)

POST   /finance/payout-batches             → Create payout batch
GET    /finance/payout-batches             → List batches
GET    /finance/payout-batches/:id         → Batch detail
POST   /finance/payout-batches/:id/approve → Approve batch
POST   /finance/payout-batches/:id/execute → Execute payouts

POST   /finance/reconciliation/run         → Run reconciliation
GET    /finance/reconciliation             → List runs
GET    /finance/reconciliation/:id         → Run detail + variances

POST   /finance/adjustments                → Request manual adjustment
GET    /finance/adjustments                → List adjustments
POST   /finance/adjustments/:id/approve    → Approve adjustment

GET    /finance/fraud-queue                → List fraud flags
POST   /finance/fraud-queue/:id/review     → Review flag

POST   /finance/reports/ingest             → Ingest platform report
GET    /finance/reports/profitability      → Profitability report

GET    /finance/rules/rate-cards           → List rate cards
POST   /finance/rules/rate-cards           → Create/update rate card
GET    /finance/rules/bonuses              → List bonus rules
GET    /finance/rules/penalties            → List penalty rules
```

#### 1.3 Feature Flags
Add to system-settings DynamoDB:
```json
{
  "FEATURE_FINANCE_ENGINE": false,
  "FEATURE_AURORA_ENABLED": false,
  "FEATURE_WALLET_LEDGER": false,
  "FEATURE_RECONCILIATION": false,
  "FEATURE_FRAUD_DETECTION": false
}
```

### Phase 2: Nected Integration
**Goal**: Connect Nected as rules/decision engine for financial calculations

#### 2.1 Nected Adapter
- Create `lambda-code/integrations/nected-adapter.js`
- Call Nected API for: payout calculation, bonus eligibility, penalty assessment, approval routing
- Feature flag: `FEATURE_NECTED_ENABLED`
- Required env: `NECTED_API_URL`, `NECTED_API_KEY`

#### 2.2 Rules Explorer Page
- New page: `/finance/rules` showing active rules from Nected
- Read-only view of rate cards, bonuses, penalties with effective dates

### Phase 3: n8n Integration Hub
**Goal**: Use n8n for external integrations and automations

#### 3.1 n8n Webhook Adapter
- Create `lambda-code/integrations/n8n-adapter.js`
- Webhook endpoints for: report ingestion triggers, notification dispatch, external platform APIs
- Feature flag: `FEATURE_N8N_ENABLED`
- Required env: `N8N_WEBHOOK_BASE_URL`, `N8N_API_KEY`

### Phase 4: Veri5now
**Goal**: eSign and contract management for driver onboarding

#### 4.1 Veri5now Adapter
- Create `lambda-code/integrations/veri5now-adapter.js`
- Document signing, contract status webhooks
- Feature flag: `FEATURE_VERI5NOW_ENABLED`
- Required env: `VERI5NOW_API_URL`, `VERI5NOW_API_KEY`
- Note: Saudi eKYC NOT activated — awaiting vendor confirmation

### Phase 5: AI Financial Report Analyst
**Goal**: Read-only financial insights via Bedrock AgentCore

#### 5.1 Finance Insights Lambda
- Create `lambda-code/fll-finance-insights/lambda_function.py`
- Bedrock agent for financial commentary
- Feature flag: `FEATURE_AI_FINANCE_INSIGHTS`
- Read-only access to curated finance views

### Phase 6: Turiya AI (Pilot)
**Goal**: Feature-flagged multi-agent orchestration

#### 6.1 Turiya Adapter
- Create `lambda-code/integrations/turiya-adapter.js`
- Feature flag: `FEATURE_TURIYA_ENABLED` (default: false)
- Read-only API access only

### Phase 7: RBAC + Pages + Navigation
**Goal**: Role-based pages with unified navigation

#### 7.1 New Finance Pages
Create standalone HTML pages matching existing design:
- `/finance-upload-center.html`
- `/finance-reconciliation.html`
- `/finance-rules.html`
- `/finance-wallets.html`
- `/finance-payout-batches.html`
- `/finance-adjustments.html`
- `/finance-profitability.html`
- `/finance-fraud-queue.html`
- `/finance-insights.html`

#### 7.2 Route Guards
- Extend `fll-shared.js` with `requireRole(allowedRoles)` function
- Check Cognito groups on page load

#### 7.3 Navigation
- Unified sidebar component in `fll-shared.js`
- Role-based menu visibility

### Phase 8: Tests, Docs, Delivery
- `env.example` with all required variables
- Integration docs per tool
- Runbooks for deployment
- Rollback notes
- Test coverage for finance Lambda functions

---

## Environment Variables Required

```env
# Aurora PostgreSQL
AURORA_HOST=
AURORA_PORT=5432
AURORA_DATABASE=fll_finance
AURORA_USERNAME=
AURORA_PASSWORD=
AURORA_SSL=true

# Nected Rules Engine
NECTED_API_URL=
NECTED_API_KEY=

# n8n Integration Hub
N8N_WEBHOOK_BASE_URL=
N8N_API_KEY=

# Veri5now eSign
VERI5NOW_API_URL=
VERI5NOW_API_KEY=

# AI Financial Report Analyst
BEDROCK_AGENT_ID=
BEDROCK_AGENT_ALIAS=

# Turiya AI (Pilot)
TURIYA_API_URL=
TURIYA_API_KEY=

# Feature Flags
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

---

## Risks
1. **Aurora not provisioned** — Finance engine Lambda will scaffold but cannot connect until Aurora cluster is created
2. **Nected CloudFormation** — Requires subdomain + ACM certificate setup
3. **Veri5now** — Saudi eKYC not confirmed; eSign only for now
4. **Dual write** — DynamoDB + Aurora coexistence requires careful migration
5. **No package.json** — Lambda dependencies must be bundled or use layers

## Rollback Strategy
- All new features behind feature flags (default: off)
- No existing code modified (additive only)
- New files can be deleted without impact
- Vercel.json changes are backward-compatible
