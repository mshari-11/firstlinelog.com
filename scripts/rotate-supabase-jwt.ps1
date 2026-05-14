#!/usr/bin/env pwsh
# Supabase JWT rotation — single-shot script.
# Updates: vault secret, 4 Lambda env vars, Vercel env, 2 static JS files.
#
# USAGE:
#   1. Generate new JWT secret in Supabase Dashboard → Settings → JWT Keys
#   2. Copy the NEW anon and service_role JWTs
#   3. Run: ./scripts/rotate-supabase-jwt.ps1
#   4. Paste each JWT when prompted (single line, no quotes)

param(
    [string]$NewAnon,
    [string]$NewServiceRole
)

$ErrorActionPreference = "Stop"

if (-not $NewAnon) {
    $NewAnon = Read-Host "Paste new ANON JWT"
}
if (-not $NewServiceRole) {
    $NewServiceRole = Read-Host "Paste new SERVICE_ROLE JWT" -MaskInput
}

if ($NewAnon -notmatch "^eyJ" -or $NewServiceRole -notmatch "^eyJ") {
    throw "JWTs must start with 'eyJ'"
}

$ProjectRef = "djebhztfewjfyyoortvv"
$SupabaseUrl = "https://$ProjectRef.supabase.co"

Write-Host "`n=== Step 1/5: Update Supabase Vault ===" -ForegroundColor Cyan
$sql = "UPDATE vault.secrets SET secret = '$NewServiceRole' WHERE name = 'cron_service_role_jwt'; SELECT name, updated_at FROM vault.secrets WHERE name = 'cron_service_role_jwt';"
$body = @{ query = $sql } | ConvertTo-Json -Compress
Write-Host "  → run this SQL manually in Supabase SQL Editor OR via supabase CLI" -ForegroundColor Yellow
Write-Host "  $sql" -ForegroundColor DarkGray

Write-Host "`n=== Step 2/5: Update 4 Lambda env vars ===" -ForegroundColor Cyan
$lambdas = @("fll-jahez-sync", "fll-auth-handler", "fll-toyou-sync", "fll-driver-onboarding")
foreach ($fn in $lambdas) {
    Write-Host "  Updating $fn..."
    $current = aws lambda get-function-configuration --region us-east-1 --function-name $fn --query "Environment.Variables" --output json | ConvertFrom-Json
    $current.SUPABASE_SERVICE_KEY = $NewServiceRole
    $envPayload = @{ Variables = @{} }
    $current.PSObject.Properties | ForEach-Object { $envPayload.Variables[$_.Name] = $_.Value }
    $tmp = New-TemporaryFile
    ($envPayload | ConvertTo-Json -Depth 5 -Compress) | Set-Content -Path $tmp -Encoding UTF8
    aws lambda update-function-configuration --region us-east-1 --function-name $fn --environment "file://$tmp" --output json | Out-Null
    Remove-Item $tmp
    Write-Host "    ✓ $fn updated" -ForegroundColor Green
}

Write-Host "`n=== Step 3/5: Update Vercel env ===" -ForegroundColor Cyan
npx vercel env rm VITE_SUPABASE_ANON_KEY production --yes 2>&1 | Out-Null
$NewAnon | npx vercel env add VITE_SUPABASE_ANON_KEY production 2>&1 | Out-Null
Write-Host "  ✓ VITE_SUPABASE_ANON_KEY updated on Vercel" -ForegroundColor Green

Write-Host "`n=== Step 4/5: Update static JS files ===" -ForegroundColor Cyan
$oldAnonPattern = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJ[A-Za-z0-9_-]*Imanon[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+'
$files = @("firstlinelog.com/fll-shared.js", "firstlinelog.com/fll-auth-connector.js")
foreach ($f in $files) {
    if (Test-Path $f) {
        $content = Get-Content $f -Raw
        $content = [regex]::Replace($content, $oldAnonPattern, $NewAnon)
        Set-Content -Path $f -Value $content -NoNewline
        Write-Host "  ✓ $f updated" -ForegroundColor Green
    }
}

Write-Host "`n=== Step 5/5: Redeploy frontend ===" -ForegroundColor Cyan
Write-Host "  Run manually after committing:" -ForegroundColor Yellow
Write-Host "    git add firstlinelog.com/fll-shared.js firstlinelog.com/fll-auth-connector.js" -ForegroundColor DarkGray
Write-Host "    git commit -m 'security: rotate Supabase anon JWT'" -ForegroundColor DarkGray
Write-Host "    git push origin main   # Vercel auto-deploys" -ForegroundColor DarkGray

Write-Host "`n✓ Rotation complete. Verify cron next:" -ForegroundColor Green
Write-Host "  SELECT vault.decrypted_secrets WHERE name='cron_service_role_jwt';" -ForegroundColor DarkGray
