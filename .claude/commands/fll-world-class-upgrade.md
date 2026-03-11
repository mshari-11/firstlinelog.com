Perform a full additive, finance-first upgrade of the current FLL project.

Rules:
- Do not break the original project.
- Add only; do not remove/rename unless absolutely necessary.
- Respect CLAUDE.md as the primary contract.
- Use the existing stack, auth, design system, and project conventions first.

Execution order:
1. Audit the repository and infer the current stack, routing, auth, DB, finance flows, and integrations.
2. Create architecture-upgrade-plan.md before major edits.
3. Build the finance core first:
   - canonical platform report model
   - append-only wallet ledger
   - payout projection/balance view
   - reconciliation engine
   - variance queue
   - fraud flags
4. Integrate Nected as rules engine only.
5. Integrate n8n as integration hub only.
6. Integrate Veri5now for onboarding/contracts only.
7. Integrate AI Financial Report Analyst as read-only finance insights.
8. Add Turiya AI as a feature-flagged read-only pilot only.
9. Add role-based pages, menus, icons, and route guards.
10. Add tests, docs, env.example, migrations, and runbooks.

Non-negotiable finance constraints:
- finance source of truth = Aurora/PostgreSQL
- no direct wallet balance mutation as source of truth
- every finance write must create an auditable ledger entry
- every manual adjustment must be approval-based
- all AI outputs are advisory unless explicitly approved

Expected output:
- implemented code
- migrations
- new pages/components
- updated routes/menu
- integration adapters
- test coverage
- architecture docs
- final summary with rollback plan

If external credentials are missing:
- scaffold the integration
- add feature flags
- document the missing secret names
- do not stall
