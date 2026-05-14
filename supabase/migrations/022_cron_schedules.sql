-- Cron schedules for daily-report and license-alerts
-- SECURITY FIX (2026-05-14): Removed hardcoded service_role JWT.
-- Now reads the JWT from Supabase Vault.
--
-- ⚠️ ONE-TIME SETUP REQUIRED BEFORE APPLYING THIS MIGRATION:
--   1. Rotate the previously exposed service_role JWT in Supabase Dashboard
--      (Project Settings → API → Reset service_role key)
--   2. Store the new JWT in vault:
--        SELECT vault.create_secret(
--          '<NEW_SERVICE_ROLE_JWT>',
--          'cron_service_role_jwt',
--          'JWT used by pg_cron to invoke Edge Functions'
--        );
--   3. Apply this migration: it reads the secret at runtime, never stores it.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Idempotent cleanup of any previously scheduled jobs that may have leaked the JWT
SELECT cron.unschedule('daily-report')   WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-report');
SELECT cron.unschedule('license-alerts') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'license-alerts');

-- Schedule daily-report at 8:00 AM Saudi time (5:00 UTC)
SELECT cron.schedule(
  'daily-report',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://djebhztfewjfyyoortvv.supabase.co/functions/v1/daily-report',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_service_role_jwt'),
      'Content-Type', 'application/json'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- Schedule license-alerts at 7:00 AM Saudi time (4:00 UTC)
SELECT cron.schedule(
  'license-alerts',
  '0 4 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://djebhztfewjfyyoortvv.supabase.co/functions/v1/license-alerts',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_service_role_jwt'),
      'Content-Type', 'application/json'
    ),
    body    := '{}'::jsonb
  );
  $$
);
