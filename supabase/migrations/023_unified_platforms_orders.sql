-- ============================================================================
-- Migration 023 — Unified Platform Aggregation Schema
-- ============================================================================
-- Purpose: Provide the missing tables to aggregate driver/order data from the
-- 6 delivery platforms (HungerStation, Keeta, Ninja, Mrsool, ToYou, Careem)
-- into a single source of truth in Supabase Postgres.
--
-- This addresses the persistent "dashboard data disappears on exit" issue by
-- guaranteeing that all platform data is stored relationally and queryable.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ─── Platform enum ─────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'platform_code') then
    create type platform_code as enum (
      'hungerstation',
      'keeta',
      'ninja',
      'mrsool',
      'toyou',
      'careem',
      'jahez',
      'noon',
      'wasfaty',
      'the_chefs',
      'amazon',
      'keeta_mart'
    );
  end if;
end$$;

-- ─── 1. driver_platform_accounts ───────────────────────────────────────────
-- Links one courier (FLL identity) to their accounts across multiple platforms.
create table if not exists public.driver_platform_accounts (
  id uuid primary key default gen_random_uuid(),
  courier_id uuid not null,
  platform platform_code not null,
  external_id text not null,
  username text,
  account_status text default 'active',
  commission_rate numeric(5,2),
  linked_at timestamptz default now(),
  last_sync_at timestamptz,
  raw_metadata jsonb default '{}'::jsonb,
  unique (platform, external_id),
  unique (courier_id, platform)
);

create index if not exists idx_dpa_courier on public.driver_platform_accounts(courier_id);
create index if not exists idx_dpa_platform on public.driver_platform_accounts(platform);

-- ─── 2. platform_orders_unified ────────────────────────────────────────────
-- Single canonical orders table aggregating from all platforms.
create table if not exists public.platform_orders_unified (
  id uuid primary key default gen_random_uuid(),
  platform platform_code not null,
  external_order_id text not null,
  courier_id uuid,
  external_courier_id text,
  customer_name text,
  customer_phone text,
  pickup_address jsonb,
  dropoff_address jsonb,
  city text,
  status text not null default 'new',
  gross_amount numeric(12,2) default 0,
  commission_amount numeric(12,2) default 0,
  net_to_courier numeric(12,2) default 0,
  placed_at timestamptz,
  picked_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  raw_payload jsonb default '{}'::jsonb,
  synced_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (platform, external_order_id)
);

create index if not exists idx_pou_courier_placed on public.platform_orders_unified(courier_id, placed_at desc);
create index if not exists idx_pou_platform_status on public.platform_orders_unified(platform, status);
create index if not exists idx_pou_city_placed on public.platform_orders_unified(city, placed_at desc);
create index if not exists idx_pou_synced on public.platform_orders_unified(synced_at desc);

-- ─── 3. complaints ─────────────────────────────────────────────────────────
-- Was previously missing entirely from the schema.
create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  ticket_ref text unique not null default ('CMP-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6)),
  type text not null check (type in ('driver','platform','customer','internal')),
  courier_id uuid,
  platform platform_code,
  order_id uuid references public.platform_orders_unified(id) on delete set null,
  customer_name text,
  customer_phone text,
  description text not null,
  status text not null default 'open' check (status in ('open','in_progress','resolved','rejected','closed')),
  priority text default 'medium' check (priority in ('low','medium','high','critical')),
  assigned_to uuid,
  resolution_notes text,
  resolved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_complaints_status on public.complaints(status);
create index if not exists idx_complaints_courier on public.complaints(courier_id);
create index if not exists idx_complaints_created on public.complaints(created_at desc);

-- ─── 4. platform_sync_runs ─────────────────────────────────────────────────
-- Audit log for the platform sync Lambdas.
create table if not exists public.platform_sync_runs (
  id uuid primary key default gen_random_uuid(),
  platform platform_code not null,
  run_type text not null check (run_type in ('webhook','cron','manual','backfill')),
  started_at timestamptz default now(),
  finished_at timestamptz,
  records_fetched integer default 0,
  records_upserted integer default 0,
  records_failed integer default 0,
  status text default 'running' check (status in ('running','success','failed','partial')),
  error_message text,
  errors jsonb default '[]'::jsonb,
  trigger_source text
);

create index if not exists idx_psr_platform_started on public.platform_sync_runs(platform, started_at desc);
create index if not exists idx_psr_status on public.platform_sync_runs(status);

-- ─── 5. updated_at triggers ────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists trg_pou_updated_at on public.platform_orders_unified;
create trigger trg_pou_updated_at
  before update on public.platform_orders_unified
  for each row execute function public.set_updated_at();

drop trigger if exists trg_complaints_updated_at on public.complaints;
create trigger trg_complaints_updated_at
  before update on public.complaints
  for each row execute function public.set_updated_at();

-- ─── 6. Dashboard views ────────────────────────────────────────────────────
create or replace view public.v_courier_daily_stats as
select
  courier_id,
  external_courier_id,
  platform,
  date_trunc('day', placed_at) as day,
  count(*) as orders_count,
  count(*) filter (where status = 'delivered') as delivered_count,
  count(*) filter (where status in ('failed','cancelled','returned')) as failed_count,
  sum(gross_amount) as total_gross,
  sum(net_to_courier) as total_net
from public.platform_orders_unified
where placed_at is not null
group by courier_id, external_courier_id, platform, date_trunc('day', placed_at);

create or replace view public.v_platform_revenue_daily as
select
  platform,
  date_trunc('day', placed_at) as day,
  count(*) as orders_count,
  sum(gross_amount) as gross_revenue,
  sum(commission_amount) as commission_revenue,
  count(*) filter (where status = 'delivered') as delivered_count
from public.platform_orders_unified
where placed_at is not null
group by platform, date_trunc('day', placed_at);

-- ─── 7. RLS policies ───────────────────────────────────────────────────────
alter table public.driver_platform_accounts enable row level security;
alter table public.platform_orders_unified enable row level security;
alter table public.complaints enable row level security;
alter table public.platform_sync_runs enable row level security;

drop policy if exists "authenticated read dpa" on public.driver_platform_accounts;
create policy "authenticated read dpa" on public.driver_platform_accounts
  for select using (auth.role() = 'authenticated');

drop policy if exists "authenticated read pou" on public.platform_orders_unified;
create policy "authenticated read pou" on public.platform_orders_unified
  for select using (auth.role() = 'authenticated');

drop policy if exists "authenticated read complaints" on public.complaints;
create policy "authenticated read complaints" on public.complaints
  for all using (auth.role() = 'authenticated');

drop policy if exists "authenticated read sync runs" on public.platform_sync_runs;
create policy "authenticated read sync runs" on public.platform_sync_runs
  for select using (auth.role() = 'authenticated');

-- ─── 8. Service role full access (for Lambda sync) ─────────────────────────
drop policy if exists "service role full pou" on public.platform_orders_unified;
create policy "service role full pou" on public.platform_orders_unified
  for all using (auth.role() = 'service_role');

drop policy if exists "service role full dpa" on public.driver_platform_accounts;
create policy "service role full dpa" on public.driver_platform_accounts
  for all using (auth.role() = 'service_role');

drop policy if exists "service role full sync runs" on public.platform_sync_runs;
create policy "service role full sync runs" on public.platform_sync_runs
  for all using (auth.role() = 'service_role');

-- ============================================================================
-- End of migration 023
-- ============================================================================
