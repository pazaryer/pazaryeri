# Pazaryeri — AAB/APK derle, masaüstüne kaydet
$ErrorActionPreference = 'Stop'
$mobile = Join-Path (Split-Path -Parent $PSScriptRoot) 'artifacts\mobile'
$desktop = [Environment]::GetFolderPath('Desktop')
if (-not (Test-Path $desktop)) { $desktop = "$env:USERPROFILE\OneDrive\Masaüstü" }
$adb = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
$serial = if ($env:ADB_SERIAL) { $env:ADB_SERIAL } else { 'R58M77182JJ' }
$ver = '1.1.7'
$AabOnly = $args -contains '-AabOnly'

$tokenLine = Get-Content (Join-Path $mobile '.env') -ErrorAction SilentlyContinue |
  Where-Object { $_ -match '^\s*EXPO_TOKEN\s*=' } | Select-Object -First 1
if (-not $tokenLine) { throw 'EXPO_TOKEN bulunamadi: artifacts/mobile/.env' }
$env:EXPO_TOKEN = ($tokenLine -replace '^\s*EXPO_TOKEN\s*=\s*','').Trim().Trim('"').Trim("'")
Remove-Item Env:npm_config_devdir -ErrorAction SilentlyContinue
# Git arsivi kullanilsin (.gitignore + .easignore); yoksa 300MB+ gereksiz upload olur
Remove-Item Env:EAS_NO_VCS -ErrorAction SilentlyContinue

Push-Location $mobile
try {
  Write-Host "==> AdMob sync..." -ForegroundColor Cyan
  node scripts/sync-admob-ids.mjs

  if (-not $AabOnly) {
    Write-Host "==> APK build (preview)..." -ForegroundColor Cyan
    npx --yes eas-cli@latest build --platform android --profile preview --non-interactive --wait --message "Pazaryeri v$ver APK"
    if ($LASTEXITCODE -ne 0) { throw 'APK build failed' }

    $apkJson = npx --yes eas-cli@latest build:list --platform android --limit 1 --status finished --non-interactive --json 2>$null | ConvertFrom-Json
    $apkUrl = $apkJson[0].artifacts.buildUrl
    $apkOut = Join-Path $desktop "pazaryeri-$ver.apk"
    if ($apkUrl) {
      Invoke-WebRequest -Uri $apkUrl -OutFile $apkOut
      Write-Host "APK: $apkOut" -ForegroundColor Green
    }
  }

  Write-Host "==> AAB build (production)..." -ForegroundColor Cyan
  npx --yes eas-cli@latest build --platform android --profile production --non-interactive --wait --message "Pazaryeri v$ver AAB"
  if ($LASTEXITCODE -ne 0) {
    Write-Host 'EAS cloud build basarisiz (aylik ucretsiz Android kotasi dolmus olabilir).' -ForegroundColor Yellow
    Write-Host 'Yerel deneme: scripts\local-android-release-aab.ps1' -ForegroundColor Yellow
    throw 'AAB build failed'
  }

  $aabJson = npx --yes eas-cli@latest build:list --platform android --limit 1 --status finished --non-interactive --json 2>$null | ConvertFrom-Json
  $aabUrl = $aabJson[0].artifacts.buildUrl
  $aabOut = Join-Path $desktop "pazaryeri-$ver.aab"
  if ($aabUrl) {
    Invoke-WebRequest -Uri $aabUrl -OutFile $aabOut
    Write-Host "AAB: $aabOut" -ForegroundColor Green
  }

  if (-not $AabOnly -and (Test-Path $apkOut)) {
    Write-Host '==> USB install + test...' -ForegroundColor Cyan
    & $adb -s $serial install -r $apkOut
    & $adb -s $serial shell am force-stop com.pazaryerim
    & $adb -s $serial logcat -c
    & $adb -s $serial shell am start -n com.pazaryerim/.MainActivity
    Start-Sleep -Seconds 18
    Write-Host 'PID:' (& $adb -s $serial shell pidof com.pazaryerim)
    & $adb -s $serial logcat -d -t 200 AndroidRuntime:E ReactNativeJS:E ReactNativeJS:I ExpoModules:I ExpoImage:I *:S
  }
}
finally {
  Pop-Location
}
