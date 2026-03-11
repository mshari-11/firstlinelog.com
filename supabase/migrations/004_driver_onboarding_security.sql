-- ============================================================
-- Driver onboarding security hardening
-- Migration: 004_driver_onboarding_security.sql
-- ============================================================

create table if not exists driver_email_otps (
  id             uuid primary key default gen_random_uuid(),
  email          text not null unique,
  otp_hash       text,
  otp_expires_at timestamptz,
  attempts       smallint not null default 0,
  verified_at    timestamptz,
  ip_address     text,
  last_sent_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_driver_email_otps_verified_at on driver_email_otps(verified_at desc);

create or replace function touch_driver_email_otps_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_driver_email_otps on driver_email_otps;
create trigger trg_touch_driver_email_otps
before update on driver_email_otps
for each row execute function touch_driver_email_otps_updated_at();
