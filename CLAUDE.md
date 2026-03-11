# FLL World-Class Additive Upgrade Charter

You are working on FLL, a multi-platform logistics operating system running on AWS.

## Mission
Upgrade the existing project to a world-class, finance-first, production-grade architecture by ADDING capabilities only. Do not break, rename, delete, or rewrite core existing flows unless absolutely required and protected behind feature flags. Preserve all current business behavior by default.

## Non-negotiable rules
1. ADDITIVE CHANGES ONLY.
   - Do not remove or rename existing modules, pages, routes, APIs, tables, or env variables unless there is no alternative.
   - Prefer wrappers, adapters, new modules, new migrations, new feature flags, and parallel services.

2. DO NOT CHANGE ORIGINAL PROJECT BEHAVIOR.
   - New functionality must be behind feature flags or opt-in configuration.
   - Existing production flows must keep working unchanged.

3. FINANCE IS THE PRIORITY.
   - Finance system of record = Aurora/PostgreSQL relational database.
   - All financial writes must be append-only to a wallet ledger.
   - Never update wallet balances directly as the source of truth.
   - Balances must be derived from ledger entries or maintained by projection with full replayability.
   - Every manual financial adjustment must be approval-based and audited.

4. ORCHESTRATION RULES.
   - Use EventBridge as the event bus.
   - Use Step Functions Standard for durable, auditable financial workflows.
   - Use S3 + Glue/Lambda for platform report ingestion.
   - Use Athena + QuickSight for analytics only.
   - Keep AI tools read-only for finance unless explicitly approved.

5. PURCHASED TOOL PLACEMENT.
   - Nected = rules engine for payouts, pricing, eligibility, penalties, bonuses, approval logic.
   - n8n = external integrations and automations only.
   - Veri5now = HR/legal onboarding, eSign, contract/document workflow only.
   - AI Financial Report Analyst = read-only finance insights.
   - Turiya AI = pilot-only multi-agent layer, read-only, not in core finance path.

6. SECURITY.
   - Never commit secrets.
   - Use AWS Secrets Manager / existing secret provider abstractions.
   - Minimize privileges.
   - Add audit trails for all admin/finance writes.
   - Protect admin tools behind existing auth and role-based access control.

7. OUTPUT QUALITY.
   - Think in PR-sized, reviewable increments.
   - Reuse the current stack and design system first.
   - Add tests, migrations, docs, and runbooks.
   - Do not leave partial refactors.

## What to do first
Before making major changes, inspect the repository and produce:
1. Tech stack summary.
2. Current architecture map.
3. Existing auth and RBAC map.
4. Existing finance-related modules.
5. Existing pages/routes/services.
6. Existing database schema summary.
7. Integration risk report.
8. Proposed additive migration plan with phases.

Then execute the plan.

## Required architecture targets

### A. Finance Core
Build or extend these capabilities:
- platform report ingestion pipeline
- canonical normalized financial data model
- rules-based payout engine
- append-only wallet ledger
- payout batching
- reconciliation engine
- variance detection
- fraud flags and anomaly queue
- profitability reporting

### B. Core finance entities to add if missing
- platforms
- platform_rate_cards
- platform_bonus_rules
- platform_penalty_rules
- platform_reports_raw
- platform_reports_staging
- platform_orders_fact
- driver_contract_history
- driver_vehicle_assignment_history
- wallet_accounts
- wallet_ledger_entries
- wallet_balance_projections
- payout_batches
- payout_batch_items
- reconciliation_runs
- reconciliation_items
- manual_adjustments
- approval_requests
- audit_events
- fraud_flags

### C. Financial invariants
- Every payout calculation must depend on:
  platform + city + contract_type + vehicle_type + ownership_type + effective_date
- Use effective-dated rules.
- Never calculate payout from "current driver state" if historical state exists.
- Support both:
  - order-level inputs
  - driver-day summary inputs
- Reconciliation must compare platform totals vs internal totals and create a variance queue.

### D. Tool-specific implementation rules

#### Nected
- Deploy or integrate as decision/rules service only.
- Call it from finance orchestration.
- It returns decisions; it does not write directly to finance tables.
- Add rule versioning and effective dates.
- Add a finance rules explorer page.

#### n8n
- Use for email/SFTP/report ingestion helpers, notifications, ticketing, and non-critical automations.
- Do not place n8n in the core payout/ledger write path.
- Use it to fetch platform reports, trigger alerts, and integrate external systems.

#### Veri5now
- Use only for contract signing, onboarding, and document workflow.
- Add webhook handling to update contract status in the core DB.
- Keep Saudi eKYC as configurable/disabled unless explicitly confirmed by business/compliance.

#### AI Financial Report Analyst
- Keep read-only.
- Feed reconciled curated data only.
- Expose daily/weekly financial commentary in a finance insights page.

#### Turiya AI
- Add as phase-3 pilot only.
- Use read-only internal APIs/views.
- Initial use cases: finance copilot, ops copilot, HR assistant.

## Required UI pages

### Finance
- /finance/upload-center
- /finance/reconciliation
- /finance/rules
- /finance/wallets
- /finance/payout-batches
- /finance/adjustments
- /finance/profitability
- /finance/fraud-queue
- /finance/insights

### Admin
- /admin/tools-health
- /admin/feature-flags
- /admin/rbac
- /admin/integrations
- /admin/audit

### HR
- /hr/onboarding
- /hr/contracts
- /hr/documents
- /hr/signature-status

### Ops
- /ops/live
- /ops/alerts
- /ops/performance

### Fleet
- /fleet/vehicles
- /fleet/costs
- /fleet/assignments

### Driver
- /driver/wallet
- /driver/earnings
- /driver/payouts
- /driver/contract
- /driver/vehicle

## Required roles
- super_admin
- finance_manager
- finance_analyst
- ops_manager
- ops_supervisor
- hr_manager
- fleet_manager
- driver

Implement role-based route guards, API authorization, menu visibility, and dashboard scoping.

## Navigation and icons
Use the project's existing design system first. If no icon system exists, add a single consistent icon system and map:
- finance = wallet/chart icons
- ops = activity/map icons
- hr = users/file-signature icons
- fleet = vehicle/wrench icons
- fraud = shield/alert icons
- integrations = plugs/workflow icons

## Technical standards
- Prefer modular architecture.
- Prefer typed contracts/schemas.
- Add migrations safely.
- Add idempotency for ingestion.
- Add retry, DLQ, and error handling where appropriate.
- Add observability hooks/logging/metrics.
- Add smoke tests and rollback notes.

## Implementation phases
Phase 0: audit and architecture map
Phase 1: finance data model and wallet ledger
Phase 2: Nected integration and rules explorer
Phase 3: n8n integration hub and external report ingestion helpers
Phase 4: Veri5now onboarding integration
Phase 5: AI Financial Report Analyst read-only insights
Phase 6: Turiya read-only pilot
Phase 7: RBAC, pages, navigation, icons, audits
Phase 8: tests, docs, deployment notes, rollback plan

## Deliverables required in repo
- architecture-upgrade-plan.md
- finance-engine-design.md
- erd-finance-and-operations.md
- migrations
- env.example updates
- integration docs for each purchased tool
- runbooks
- rollback notes
- test coverage for new critical paths

## Execution style
- Start with audit.
- Then implement phase by phase.
- After each phase, summarize:
  - files changed
  - migrations added
  - feature flags added
  - env vars added
  - risks
  - rollback steps
- Keep changes minimal, additive, and production-safe.
