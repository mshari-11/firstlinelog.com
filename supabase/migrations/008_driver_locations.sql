create table if not exists driver_locations (
  driver_id uuid primary key references couriers(id) on delete cascade,
  latitude numeric(10, 7) not null,
  longitude numeric(10, 7) not null,
  accuracy_meters numeric(10, 2),
  heading numeric(10, 2),
  speed_mps numeric(10, 2),
  is_online boolean not null default true,
  source text not null default 'courier_portal' check (source in ('courier_portal', 'mobile_app', 'dispatch_manual', 'external_api')),
  battery_level integer,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_driver_locations_updated_at on driver_locations(updated_at desc);
create index if not exists idx_driver_locations_online on driver_locations(is_online);

alter table driver_locations enable row level security;

drop policy if exists driver_locations_select_authenticated on driver_locations;
create policy driver_locations_select_authenticated on driver_locations
for select to authenticated using (true);

drop policy if exists driver_locations_upsert_authenticated on driver_locations;
create policy driver_locations_upsert_authenticated on driver_locations
for insert to authenticated with check (true);

drop policy if exists driver_locations_update_authenticated on driver_locations;
create policy driver_locations_update_authenticated on driver_locations
for update to authenticated using (true) with check (true);
