-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily-report at 8:00 AM Saudi time (5:00 UTC)
SELECT cron.schedule('daily-report', '0 5 * * *',
  $$SELECT net.http_post(
    url := 'https://djebhztfewjfyyoortvv.supabase.co/functions/v1/daily-report',
    headers := jsonb_build_object('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZWJoenRmZXdqZnl5b29ydHZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA4MTY5NiwiZXhwIjoyMDg2NjU3Njk2fQ.K1hMsWE56-SdpGoBpYcnF73UYlaJnyzimEpv_onBDsY', 'Content-Type', 'application/json'),
    body := '{}'::jsonb
  )$$
);

-- Schedule license-alerts at 7:00 AM Saudi time (4:00 UTC)
SELECT cron.schedule('license-alerts', '0 4 * * *',
  $$SELECT net.http_post(
    url := 'https://djebhztfewjfyyoortvv.supabase.co/functions/v1/license-alerts',
    headers := jsonb_build_object('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZWJoenRmZXdqZnl5b29ydHZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA4MTY5NiwiZXhwIjoyMDg2NjU3Njk2fQ.K1hMsWE56-SdpGoBpYcnF73UYlaJnyzimEpv_onBDsY', 'Content-Type', 'application/json'),
    body := '{}'::jsonb
  )$$
);
