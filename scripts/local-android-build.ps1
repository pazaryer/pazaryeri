# Yerel Android APK derle + USB kurulum (Windows, ASCII yol: C:\pz)
$ErrorActionPreference = 'Stop'
$src = Split-Path $PSScriptRoot -Parent
$dst = 'C:\pz'
$sdk = "$env:LOCALAPPDATA\Android\Sdk"
$adb = "$sdk\platform-tools\adb.exe"

Write-Host '==> Eski surecler kapatiliyor...' -ForegroundColor Cyan
Get-Process java,gradle -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host '==> Proje C:\pz senkronize ediliyor...' -ForegroundColor Cyan
if (-not (Test-Path $dst)) { New-Item -ItemType Directory -Path $dst | Out-Null }
robocopy $src $dst /MIR /XD node_modules .git dist .firebase "artifacts\mobile\android" "artifacts\mobile\dist" /XF pazaryeri-debug.apk /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null

# pnpm hoisted: Windows MAX_PATH / uzun .pnpm yollarını önler
@'
node-linker=hoisted
auto-install-peers=false
'@ | Set-Content -Path (Join-Path $dst '.npmrc') -Encoding ASCII

Write-Host '==> pnpm install...' -ForegroundColor Cyan
Push-Location $dst
if (Test-Path 'node_modules') { Remove-Item -Recurse -Force 'node_modules' }
pnpm install --no-frozen-lockfile --filter @workspace/mobile...
if ($LASTEXITCODE -ne 0) { throw "pnpm install failed" }
Pop-Location

$mobile = Join-Path $dst 'artifacts\mobile'
$android = Join-Path $mobile 'android'
$sdkProps = "sdk.dir=$($sdk.Replace('\','\\'))`nndk.dir=$($sdk.Replace('\','\\'))\\ndk\\27.1.12297006"

$env:ANDROID_HOME = $sdk
$env:ANDROID_NDK_HOME = "$sdk\ndk\27.1.12297006"
$env:GRADLE_USER_HOME = 'C:\gh'
$env:TEMP = 'C:\tmp'
$env:TMP = 'C:\tmp'
$env:PATH = "$sdk\cmake\3.22.1\bin;$sdk\platform-tools;$env:PATH"

Write-Host '==> Gradle assembleDebug (C:\pm kisa yol)...' -ForegroundColor Cyan
$flat = 'C:\pm'
if (Test-Path $flat) { Remove-Item -Recurse -Force $flat }
New-Item -ItemType Directory -Path $flat | Out-Null
robocopy $mobile $flat /E /XD android .expo .cxx dist /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
if (Test-Path (Join-Path $mobile 'node_modules')) {
  robocopy (Join-Path $mobile 'node_modules') (Join-Path $flat 'node_modules') /E /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
}
robocopy (Join-Path $dst 'node_modules') (Join-Path $flat 'node_modules') /E /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null

Push-Location $flat
node scripts/generate-notification-sounds.mjs
if (Test-Path 'android') { Remove-Item -Recurse -Force 'android' }
npx expo prebuild --platform android --no-install
if ($LASTEXITCODE -ne 0) { throw 'expo prebuild failed' }
node scripts/patch-android-settings.mjs
Set-Content -Path (Join-Path $flat 'android\local.properties') -Value $sdkProps -Encoding ASCII

$androidFlat = Join-Path $flat 'android'
$cxx = Join-Path $androidFlat 'app\.cxx'
if (Test-Path $cxx) { Remove-Item -Recurse -Force $cxx }

Push-Location $androidFlat
.\gradlew.bat assembleDebug -PreactNativeArchitectures=arm64-v8a --no-daemon
$gradleExit = $LASTEXITCODE
Pop-Location
Pop-Location
if ($gradleExit -ne 0) { throw 'gradle build failed' }

$apk = Join-Path $androidFlat 'app\build\outputs\apk\debug\app-debug.apk'
$out = Join-Path $mobile 'pazaryeri-debug.apk'
Copy-Item $apk $out -Force
Write-Host "APK: $out" -ForegroundColor Green

$adbDevice = if ($env:ADB_SERIAL) { $env:ADB_SERIAL } else { 'R58M77182JJ' }

Write-Host '==> USB kurulum...' -ForegroundColor Cyan
& $adb devices
& $adb -s $adbDevice install -r $apk
if ($LASTEXITCODE -ne 0) { throw 'adb install failed' }

& $adb -s $adbDevice shell am start -n com.pazaryerim/.MainActivity
Write-Host '==> Logcat (15 sn)...' -ForegroundColor Cyan
& $adb -s $adbDevice logcat -c
Start-Sleep -Seconds 3
& $adb -s $adbDevice logcat -d -t 200 ReactNative:V ReactNativeJS:V ExpoModules:V AndroidRuntime:E *:S
