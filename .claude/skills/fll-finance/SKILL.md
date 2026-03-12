---
name: fll-finance
description: "Finance engine operations for FLL: wallet ledger, payouts, reconciliation, rate cards, fraud detection, and financial reporting. Use when working on any finance-related feature, Lambda, migration, or dashboard."
---

# FLL Finance Engine Skill

You are working on the FLL Finance Engine — a double-entry, append-only ledger system for First Line Logistics (fll.sa).

## Architecture

```
Platform Reports → Upload Center → Raw → Staging → Fact Tables
                                                        ↓
                                                Rate Card Lookup (Nected)
                                                        ↓
                                              Net Driver Pay Calculation
                                                        ↓
                                                Wallet Ledger Entry (append-only)
                                                        ↓
                                              Payout Batch → Execution
```

## Key Files

### Lambda (Backend)
- `lambda-code/fll-finance-engine/index.js` — Main finance Lambda (Node.js)
  - DynamoDB tables: `fll-driver-wallets`, `fll-wallet-ledger`, `fll-payout-batches`, `fll-payout-items`, `fll-reconciliation-runs`, `fll-reconciliation-items`, `fll-manual-adjustments`, `fll-finance-approvals`, `fll-fraud-flags`, `fll-rate-cards`, `fll-bonus-rules`, `fll-penalty-rules`, `fll-system-settings`, `fll-audit-log`
- `lambda-code/fll-finance-insights/lambda_function.py` — AI financial analysis (Bedrock)
- `lambda-code/integrations/nected-adapter.js` — Rules engine for payouts/bonuses/penalties

### Database (Supabase — Live)
- `supabase/migrations/002_driver_wallet_ledger.sql` — Wallet, ledger, payouts schema
- Tables: `driver_wallets`, `ledger_accounts`, `ledger_entries`, `wallet_transactions`, `payout_batches`, `payout_items`
- Functions: `record_wallet_event()`, `create_driver_wallet_on_insert()`
- Immutability rules: `ledger_no_update`, `ledger_no_delete`

### Database (Aurora — Designed, behind feature flag)
- Schemas: `finance`, `ops`, `master`
- 24+ tables including `wallet_ledger_entries`, `platform_orders_fact`, `reconciliation_batches`

### Frontend
- `src/pages/admin/Finance.tsx` — Finance console (React SPA)
- `src/pages/admin/DriverWallet.tsx` — Wallet ledger view
- `src/pages/admin/Reconciliation.tsx` — Reconciliation
- `staff-finance.html` — Finance dashboard (vanilla HTML, 737 lines)
- `finance-wallets.html`, `finance-payout-batches.html`, `finance-reconciliation.html`, `finance-adjustments.html`, `finance-rules.html`, `finance-fraud-queue.html`, `finance-insights.html`, `finance-profitability.html`

## Non-Negotiable Finance Rules

1. **Append-only ledger** — NEVER update or delete `ledger_entries` or `wallet_ledger_entries`. Corrections via reversal entries only.
2. **Double-entry** — Every `record_wallet_event()` creates debit + credit entries that sum to zero per `transaction_id`.
3. **Derived balances** — `driver_wallets.balance` = sum of all ledger entries. Balance is a projection, not source of truth.
4. **Separation of duties** — Creator of a payout batch cannot approve it. Requester of an adjustment cannot approve it.
5. **Audit trail** — Every finance write must create an `audit_log` entry.
6. **Feature flags** — All new finance features behind flags in `fll-system-settings` DynamoDB table.
7. **Currency** — All amounts in SAR, 2 decimal places.
8. **Rate card lookup** — Payout calculation depends on: platform + city + contract_type + vehicle_type + ownership_type + effective_date.

## API Endpoints

```
POST   /finance/wallets                    → List driver wallets
GET    /finance/wallets/:driverId          → Driver wallet + ledger
POST   /finance/wallets/:driverId/credit   → Credit (append ledger)
POST   /finance/wallets/:driverId/debit    → Debit (append ledger)
POST   /finance/payout-batches             → Create batch
GET    /finance/payout-batches             → List batches
POST   /finance/payout-batches/:id/approve → Approve
POST   /finance/payout-batches/:id/execute → Execute
POST   /finance/reconciliation/run         → Run reconciliation
GET    /finance/reconciliation             → List runs
POST   /finance/adjustments                → Request adjustment
POST   /finance/adjustments/:id/approve    → Approve
GET    /finance/fraud-queue                → List fraud flags
POST   /finance/fraud-queue/:id/review     → Review flag
POST   /finance/reports/ingest             → Ingest platform report
GET    /finance/rules/rate-cards           → List rate cards
```

## Auth & Roles

- All endpoints require Cognito JWT (`AccessToken`)
- Finance write: `finance_manager` only
- Finance read: `finance_manager`, `finance_analyst`
- Feature flags: `super_admin`, `SystemAdmin` only
- Fraud queue: `finance_manager`, `finance_analyst`, `ops_manager`

## When Modifying Finance Code

1. Read the existing Lambda code first (`lambda-code/fll-finance-engine/index.js`)
2. Maintain backward compatibility — ADDITIVE changes only
3. Add feature flags for new capabilities
4. Add audit logging for every write operation
5. Test double-entry balance invariant
6. Update `env.example` if new env vars are needed
7. Add migration if schema changes are needed
8. Never expose raw financial data without role checks
