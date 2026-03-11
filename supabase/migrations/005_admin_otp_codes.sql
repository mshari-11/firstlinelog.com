-- ============================================================
-- Admin OTP Codes — used by fll-auth-api Lambda for
-- custom OTP login via AWS SES (no-reply@fll.sa)
-- Migration: 005_admin_otp_codes.sql
-- ============================================================

create table if not exists admin_otp_codes (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  code        text not null,                -- 6-digit OTP (plain — Lambda validates)
  expires_at  bigint not null,              -- Unix epoch seconds
  used        boolean not null default false,
  created_at  bigint not null default extract(epoch from now())::bigint
);

-- Indexes for fast lookup + rate limiting
create index if not exists idx_admin_otp_email       on admin_otp_codes(email, created_at desc);
create index if not exists idx_admin_otp_code_lookup on admin_otp_codes(email, code, used, expires_at);

-- Cleanup: auto-delete expired OTPs older than 1 hour (run via pg_cron or manual)
-- If pg_cron is available:
-- select cron.schedule('cleanup-admin-otp', '*/30 * * * *',
--   $$delete from admin_otp_codes where created_at < extract(epoch from now())::bigint - 3600$$
-- );

-- RLS: This table is accessed ONLY via Supabase service role key from Lambda.
-- No client-side access should be allowed.
alter table admin_otp_codes enable row level security;

-- No policies = no client access (service role key bypasses RLS)
