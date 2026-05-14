#!/usr/bin/env pwsh
# Post-rotation verification — run AFTER rotate-supabase-jwt.ps1
# Triggers cron functions manually and checks logs.

$ErrorActionPreference = "Stop"
$ProjectRef = "djebhztfewjfyyoortvv"

Write-Host "=== Verifying Lambda env vars updated ===" -ForegroundColor Cyan
foreach ($fn in @("fll-jahez-sync", "fll-auth-handler", "fll-toyou-sync", "fll-driver-onboarding")) {
    $iat = aws lambda get-function-configuration --region us-east-1 --function-name $fn `
        --query "Environment.Variables.SUPABASE_SERVICE_KEY" --output text |
        ForEach-Object { ($_ -split '\.')[1] } |
        ForEach-Object {
            $pad = $_.Length % 4
            if ($pad) { $_ + ('=' * (4 - $pad)) } else { $_ }
        } |
        ForEach-Object { [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($_.Replace('-','+').Replace('_','/'))) } |
        ConvertFrom-Json | Select-Object -ExpandProperty iat
    $issued = (Get-Date "1970-01-01").AddSeconds($iat)
    Write-Host "  $fn → JWT issued $issued"
}

Write-Host "`n=== Trigger cron functions manually ===" -ForegroundColor Cyan
Write-Host "  Run these in Supabase SQL Editor to test cron auth:"
Write-Host @"
  SELECT net.http_post(
    url     := 'https://$ProjectRef.supabase.co/functions/v1/daily-report',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_service_role_jwt'),
      'Content-Type', 'application/json'
    ),
    body    := '{}'::jsonb
  );
"@

Write-Host "`n=== Check Vercel deployment ===" -ForegroundColor Cyan
npx vercel ls --scope mshari --yes 2>&1 | Select-Object -First 5

Write-Host "`n✓ Run /admin-panel login and confirm Supabase queries still work" -ForegroundColor Green
