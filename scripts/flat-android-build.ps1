# Ultra-kisa yol (C:\m) ile debug APK — Windows MAX_PATH icin
$ErrorActionPreference = 'Stop'
$srcRoot = Split-Path $PSScriptRoot -Parent
$flat = 'C:\m'
$sdk = "$env:LOCALAPPDATA\Android\Sdk"
$adb = "$sdk\platform-tools\adb.exe"

Get-Process java,gradle -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

if (Test-Path $flat) { Remove-Item -Recurse -Force $flat }
New-Item -ItemType Directory -Path $flat | Out-Null
$mobileSrc = Join-Path $srcRoot 'artifacts\mobile'
$rc = robocopy $mobileSrc $flat /E /XD node_modules android dist .expo
if (-not (Test-Path (Join-Path $flat 'package.json'))) { throw "robocopy failed: package.json missing (exit $rc)" }
New-Item -ItemType Directory -Path (Join-Path $flat 'vendor\api-client-react') -Force | Out-Null
robocopy (Join-Path $srcRoot 'lib\api-client-react') (Join-Path $flat 'vendor\api-client-react') /E /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null

$pkgPath = Join-Path $flat 'package.json'
$pkg = Get-Content $pkgPath -Raw -Encoding UTF8 | ConvertFrom-Json
$pkg.PSObject.Properties.Remove('name')
$pkg | Add-Member -NotePropertyName 'name' -NotePropertyValue 'pazaryeri-mobile' -Force
$dev = $pkg.devDependencies
$dev.'@workspace/api-client-react' = 'file:./vendor/api-client-react'
$pkg.devDependencies = $dev
$json = $pkg | ConvertTo-Json -Depth 30
[System.IO.File]::WriteAllText($pkgPath, $json)

@'
node-linker=hoisted
auto-install-peers=false
'@ | Set-Content (Join-Path $flat '.npmrc') -Encoding ASCII

$env:ANDROID_HOME = $sdk
$env:ANDROID_NDK_HOME = "$sdk\ndk\27.1.12297006"
$env:GRADLE_USER_HOME = 'C:\gh'
$env:TEMP = 'C:\tmp'
$env:TMP = 'C:\tmp'
$env:PATH = "$sdk\cmake\3.22.1\bin;$sdk\platform-tools;$env:PATH"

Push-Location $flat
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) { throw 'npm install failed' }
node scripts/generate-notification-sounds.mjs
npx expo prebuild --platform android --no-install
if ($LASTEXITCODE -ne 0) { throw 'expo prebuild failed' }
node scripts/patch-android-settings.mjs
$sdkProps = "sdk.dir=$($sdk.Replace('\','\\'))`nndk.dir=$($sdk.Replace('\','\\'))\\ndk\\27.1.12297006"
Set-Content -Path (Join-Path $flat 'android\local.properties') -Value $sdkProps -Encoding ASCII

Push-Location (Join-Path $flat 'android')
.\gradlew.bat assembleDebug -PreactNativeArchitectures=arm64-v8a --no-daemon
if ($LASTEXITCODE -ne 0) { throw 'gradle failed' }
Pop-Location
Pop-Location

$apk = Join-Path $flat 'android\app\build\outputs\apk\debug\app-debug.apk'
Copy-Item $apk 'C:\tmp\pazaryeri-debug.apk' -Force
Write-Host "APK: C:\tmp\pazaryeri-debug.apk"

& $adb install -r $apk
& $adb shell am start -n com.pazaryerim/.MainActivity
& $adb logcat -c
Start-Sleep -Seconds 5
& $adb logcat -d -t 150 ReactNativeJS:V AndroidRuntime:E *:S
