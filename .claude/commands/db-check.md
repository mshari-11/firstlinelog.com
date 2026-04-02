# Database Health Check

Check the status of Supabase database tables and connections.

## Steps

1. Check Supabase connection status using MCP tools
2. List tables across all schemas:
   - `public` — Core application tables
   - `finance` — Financial engine (accounting_components, payout_run_stages)
   - `master` — Master data
   - `staging` — Staging/import tables
   - `ops` — Operations data
   - `audit` — Audit logs
   - `admin` — Admin configuration
   - `hr` — Human resources
3. Report table counts per schema
4. Check for any failed migrations via `list_migrations`
5. Verify edge functions are deployed: `list_edge_functions`
6. Check for recent logs/errors: `get_logs`

## Important Rules

- READ-ONLY operations — NEVER modify data or schema
- Report findings in Arabic
- Include schema breakdown with table counts
- Flag any tables with zero rows or missing indexes
- Check that all 35 edge functions are deployed
