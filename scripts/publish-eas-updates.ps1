# Pazaryeri mobil + admin EAS OTA yayın scripti
# Kullanım: powershell -ExecutionPolicy Bypass -File scripts/publish-eas-updates.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$mobile = Join-Path $root 'artifacts\mobile'
$admin = Join-Path $root 'artifacts\admin'

$tokenLine = Get-Content (Join-Path $mobile '.env') -ErrorAction SilentlyContinue | Where-Object { $_ -match '^\s*EXPO_TOKEN\s*=' } | Select-Object -First 1
if (-not $tokenLine) { throw 'EXPO_TOKEN bulunamadı: artifacts/mobile/.env' }
$env:EXPO_TOKEN = ($tokenLine -replace '^\s*EXPO_TOKEN\s*=\s*','').Trim().Trim('"').Trim("'")
Remove-Item Env:EAS_NO_VCS -ErrorAction SilentlyContinue
Remove-Item Env:npm_config_devdir -ErrorAction SilentlyContinue

$otaMessage = 'Pazaryeri: sessiz OTA güncelleme — splash sırasında otomatik yükleme'
# Play Store'daki mevcut native sürümler — her runtime için ayrı OTA gerekir
$mobileRuntimes = @('1.1.4', '1.1.5', '1.1.6', '1.1.7', '1.1.8', '1.1.9')

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

function Publish-MobileOtaForRuntimes($channel, $message) {
  $appJsonPath = Join-Path $mobile 'app.json'
  $original = Get-Content $appJsonPath -Raw -Encoding UTF8
  foreach ($rt in $mobileRuntimes) {
    Write-Host "`n>>> Mobil OTA runtime $rt -> $channel" -ForegroundColor Yellow
    $patched = $original -replace '"runtimeVersion"\s*:\s*"[^"]+"', "`"runtimeVersion`": `"$rt`""
    [System.IO.File]::WriteAllText($appJsonPath, $patched, (New-Object System.Text.UTF8Encoding $false))
    Publish-Ota $mobile $channel "$message (runtime $rt)"
  }
  [System.IO.File]::WriteAllText($appJsonPath, $original, (New-Object System.Text.UTF8Encoding $false))
  Write-Host 'app.json runtimeVersion geri yüklendi.' -ForegroundColor DarkGray
}

Sync-AdminEnvToken

Publish-MobileOtaForRuntimes 'production' $otaMessage
Publish-MobileOtaForRuntimes 'preview'    "$otaMessage [preview]"

Write-Host "`nTamamlandı. Expo dashboard > Updates bölümünden doğrulayın." -ForegroundColor Green
