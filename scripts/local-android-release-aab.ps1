# Yerel production AAB — önce pnpm deploy klasörü, yoksa C:\pz monorepo
param(
  [string]$Version = '1.1.9',
  [int]$VersionCode = 17
)
$ErrorActionPreference = 'Stop'

function Write-Utf8NoBom([string]$Path, [string]$Content) {
  $utf8 = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

$src = Split-Path $PSScriptRoot -Parent
$desktop = [Environment]::GetFolderPath('Desktop')
if (-not (Test-Path $desktop)) { $desktop = "$env:USERPROFILE\OneDrive\Masaüstü" }
$buildRoot = Join-Path $env:USERPROFILE 'pz-build'
$deployDir = $buildRoot
$outAab = Join-Path $desktop "pazaryeri-$Version.aab"
$sdk = "$env:LOCALAPPDATA\Android\Sdk"

$keystoreSrc = Join-Path $src 'artifacts\mobile\android-release.keystore'
$propsSrc = Join-Path $src 'artifacts\mobile\android-release.properties'
if (-not (Test-Path $keystoreSrc)) {
  Push-Location (Join-Path $src 'artifacts\mobile')
  node scripts/pull-eas-android-keystore.mjs
  Pop-Location
}

$props = @{}
Get-Content $propsSrc | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') { $props[$matches[1].Trim()] = $matches[2].Trim() }
}

Write-Host '==> pnpm deploy (standalone)...' -ForegroundColor Cyan
if (-not (Test-Path $buildRoot)) { New-Item -ItemType Directory -Path $buildRoot -Force | Out-Null }
if (Test-Path $deployDir) {
  cmd /c "rmdir /s /q `"$deployDir`"" 2>$null
}
Push-Location $src
pnpm --filter @workspace/mobile deploy $deployDir
if ($LASTEXITCODE -ne 0) { throw 'pnpm deploy failed' }
Pop-Location

Write-Host '==> Flatten node_modules (Windows path)...' -ForegroundColor Cyan
Push-Location $deployDir
node scripts/flatten-deploy-for-android.mjs
if ($LASTEXITCODE -ne 0) { throw 'flatten-deploy failed' }
Pop-Location

Copy-Item $keystoreSrc (Join-Path $deployDir 'android-release.keystore') -Force
Copy-Item $propsSrc (Join-Path $deployDir 'android-release.properties') -Force

$env:ANDROID_HOME = $sdk
$env:ANDROID_NDK_HOME = "$sdk\ndk\27.1.12297006"
$env:GRADLE_USER_HOME = Join-Path $env:USERPROFILE '.gradle-pz'
$env:TEMP = Join-Path $env:USERPROFILE 'AppData\Local\Temp\pz-build'
$env:TMP = $env:TEMP
if (-not (Test-Path $env:GRADLE_USER_HOME)) { New-Item -ItemType Directory -Path $env:GRADLE_USER_HOME | Out-Null }
if (-not (Test-Path $env:TEMP)) { New-Item -ItemType Directory -Path $env:TEMP | Out-Null }
if (Test-Path $env:GRADLE_USER_HOME\caches) { Remove-Item -Recurse -Force "$env:GRADLE_USER_HOME\caches" -ErrorAction SilentlyContinue }
$env:PATH = "$sdk\cmake\3.22.1\bin;$sdk\platform-tools;$env:PATH"
$env:EAS_BUILD_PROFILE = 'production'

Get-Process java, gradle -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Push-Location $deployDir
node scripts/generate-notification-sounds.mjs
node scripts/sync-admob-ids.mjs
if (Test-Path 'android') { Remove-Item -Recurse -Force 'android' }
npx expo prebuild --platform android --no-install
if ($LASTEXITCODE -ne 0) { throw 'expo prebuild failed' }
node scripts/patch-android-settings.mjs

$appGradle = Join-Path $deployDir 'android\app\build.gradle'
$gradleText = Get-Content $appGradle -Raw
if ($gradleText -notmatch 'signingConfigs\.release') {
  $releaseBlock = @"
    signingConfigs {
        release {
            storeFile file('../../android-release.keystore')
            storePassword '$($props.storePassword)'
            keyAlias '$($props.keyAlias)'
            keyPassword '$($props.keyPassword)'
        }
        debug {
"@
  $gradleText = $gradleText -replace 'signingConfigs\s*\{\s*\n\s*debug\s*\{', $releaseBlock
  $gradleText = $gradleText -replace 'signingConfig signingConfigs\.debug(\s*\n\s*crunchPngs)', 'signingConfig signingConfigs.release$1'
}
$gradleText = $gradleText -replace 'versionCode \d+', "versionCode $VersionCode"
$gradleText = $gradleText -replace 'versionName "[^"]+"', "versionName `"$Version`""
Write-Utf8NoBom $appGradle $gradleText

$sdkProps = "sdk.dir=$($sdk.Replace('\','\\'))`nndk.dir=$($sdk.Replace('\','\\'))\\ndk\\27.1.12297006"
$androidDir = Join-Path $deployDir 'android'
Set-Content -Path (Join-Path $androidDir 'local.properties') -Value $sdkProps -Encoding ASCII

Write-Host '==> Gradle bundleRelease...' -ForegroundColor Cyan
Push-Location $androidDir
.\gradlew.bat bundleRelease '-PreactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64' --no-build-cache --no-daemon
$gradleExit = $LASTEXITCODE
Pop-Location
Pop-Location
if ($gradleExit -ne 0) { throw 'gradle bundleRelease failed' }

$aab = Join-Path $androidDir 'app\build\outputs\bundle\release\app-release.aab'
Copy-Item $aab $outAab -Force
$sizeMb = [math]::Round((Get-Item $outAab).Length / 1MB, 1)
Write-Host "AAB: $outAab ($sizeMb MB)" -ForegroundColor Green

if (Test-Path $deployDir) { cmd /c "rmdir /s /q `"$deployDir`"" 2>$null }
if (Test-Path $env:GRADLE_USER_HOME) { Remove-Item $env:GRADLE_USER_HOME -Recurse -Force -ErrorAction SilentlyContinue }
if (Test-Path $env:TEMP) { Remove-Item $env:TEMP -Recurse -Force -ErrorAction SilentlyContinue }
