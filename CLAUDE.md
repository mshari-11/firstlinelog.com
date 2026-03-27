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

## Infrastructure (updated 2026-03-27)
- **Lambda Functions**: 20 (Python + Node.js) in `/lambda-code/`
- **Supabase Edge Functions**: 35 in `/supabase/functions/`
- **API Gateways**: 2 (public + admin)
- **DynamoDB Tables**: 38
- **Supabase Schemas**: public, finance, master, staging, ops, audit, admin, hr
- **Admin Pages**: 54+ (all wired to real Supabase/API data with fallback)
- **Governance Pages**: 6 (PermissionManager, FeatureToggles, WorkflowBuilder, SLAConfig, AuditDashboard, InfrastructureOverview)
- **Public Pages**: 20 (marketing + auth + courier)
- **Legacy HTML**: 9 files → 301 redirects to SPA routes via vercel.json

## Conventions
- Arabic RTL UI throughout
- Prettier for formatting (auto on save)
- ESLint for linting
- Path alias: `@/` → `./src/`
- Admin pages use `try/fetch/catch → keep fallback` pattern for data
- Supabase client can be null — always guard with `if (!supabase)`
