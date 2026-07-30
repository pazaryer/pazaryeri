# EAS preview APK derle, indir, USB kur
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$mobile = Join-Path $root 'artifacts\mobile'
$adb = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
$serial = if ($env:ADB_SERIAL) { $env:ADB_SERIAL } else { 'R58M77182JJ' }

$tokenLine = Get-Content (Join-Path $mobile '.env') -ErrorAction SilentlyContinue |
  Where-Object { $_ -match '^\s*EXPO_TOKEN\s*=' } | Select-Object -First 1
if (-not $tokenLine) { throw 'EXPO_TOKEN bulunamadı: artifacts/mobile/.env' }
$env:EXPO_TOKEN = ($tokenLine -replace '^\s*EXPO_TOKEN\s*=\s*','').Trim().Trim('"').Trim("'")
Remove-Item Env:EAS_NO_VCS -ErrorAction SilentlyContinue
Remove-Item Env:npm_config_devdir -ErrorAction SilentlyContinue

Push-Location $mobile
try {
  Write-Host '==> AdMob ID senkronize...' -ForegroundColor Cyan
  node scripts/sync-admob-ids.mjs

  Write-Host '==> EAS preview APK build (bekleyin ~20 dk)...' -ForegroundColor Cyan
  npx --yes eas-cli@latest build --profile preview --platform android --non-interactive --wait
  if ($LASTEXITCODE -ne 0) { throw 'EAS build failed' }

  $buildJson = npx --yes eas-cli@latest build:list --platform android --limit 1 --status finished --non-interactive --json 2>$null |
    ConvertFrom-Json
  $buildId = $buildJson[0].id
  if (-not $buildId) { throw 'Tamamlanan build bulunamadı' }
  Write-Host "Build ID: $buildId" -ForegroundColor Green

  Write-Host '==> APK indiriliyor...' -ForegroundColor Cyan
  npx --yes eas-cli@latest build:download --build-id $buildId --non-interactive
  if ($LASTEXITCODE -ne 0) { throw 'APK download failed' }

  $apk = Get-ChildItem "$env:TEMP\eas-cli-nodejs\eas-build-run-cache" -Filter "*.apk" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $apk) {
    $apk = Get-ChildItem $mobile -Recurse -Filter '*.apk' -ErrorAction SilentlyContinue |
      Sort-Object LastWriteTime -Descending | Select-Object -First 1
  }
  if (-not $apk) { throw 'APK dosyası bulunamadı' }

  $out = 'C:\tmp\pazaryeri-preview.apk'
  Copy-Item $apk.FullName $out -Force
  Write-Host "APK: $out" -ForegroundColor Green

  Write-Host '==> USB kurulum...' -ForegroundColor Cyan
  & $adb -s $serial install -r $out
  if ($LASTEXITCODE -ne 0) { throw 'adb install failed' }

  & $adb -s $serial shell am force-stop com.pazaryerim
  & $adb -s $serial logcat -c
  & $adb -s $serial shell am start -n com.pazaryerim/.MainActivity
  Start-Sleep -Seconds 10

  Write-Host '==> Loglar' -ForegroundColor Cyan
  & $adb -s $serial shell pidof com.pazaryerim
  & $adb -s $serial logcat -d -t 120 AndroidRuntime:E ReactNativeJS:E ReactNativeJS:I ExpoModules:I *:S
}
finally {
  Pop-Location
}
