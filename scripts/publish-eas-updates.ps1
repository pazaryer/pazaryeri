# Pazaryeri mobil + admin EAS OTA yayın scripti
# Kullanım: powershell -ExecutionPolicy Bypass -File scripts/publish-eas-updates.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$mobile = Join-Path $root 'artifacts\mobile'
$admin = Join-Path $root 'artifacts\admin'

$tokenLine = Get-Content (Join-Path $mobile '.env') -ErrorAction SilentlyContinue | Where-Object { $_ -match '^\s*EXPO_TOKEN\s*=' } | Select-Object -First 1
if (-not $tokenLine) { throw 'EXPO_TOKEN bulunamadı: artifacts/mobile/.env' }
$env:EXPO_TOKEN = ($tokenLine -replace '^\s*EXPO_TOKEN\s*=\s*','').Trim().Trim('"').Trim("'")
$env:EAS_NO_VCS = '1'
Remove-Item Env:npm_config_devdir -ErrorAction SilentlyContinue

$otaVersion = '1.1.4'

function Sync-AdminEnvToken {
  $adminEnv = Join-Path $admin '.env'
  $lines = @(if (Test-Path $adminEnv) { Get-Content $adminEnv } else { @() })
  $lines = $lines | Where-Object { $_ -notmatch '^\s*EXPO_TOKEN\s*=' }
  $lines += "EXPO_TOKEN=$($env:EXPO_TOKEN)"
  $lines | Set-Content $adminEnv -Encoding utf8
}

function Publish-Ota($dir, $channel, $message) {
  Write-Host "`n=== $(Split-Path $dir -Leaf) | $channel ===" -ForegroundColor Cyan
  Push-Location $dir
  try {
    $env:EAS_SKIP_AUTO_FINGERPRINT = '1'
    npx --yes eas-cli@latest update --channel $channel --message $message --non-interactive
    if ($LASTEXITCODE -ne 0) { throw "eas update başarısız (exit $LASTEXITCODE)" }
  } finally {
    Pop-Location
  }
}

Sync-AdminEnvToken

Publish-Ota $mobile 'production' "Pazaryeri analytics GA4 screen tracking + web fixes"
Publish-Ota $mobile 'preview'    "Pazaryeri analytics GA4 screen tracking preview"
Publish-Ota $admin  'production' "Admin analytics presence improvements"
Publish-Ota $admin  'preview'    "Admin analytics preview"

Write-Host "`nTamamlandı. Expo dashboard > Updates bölümünden doğrulayın." -ForegroundColor Green
