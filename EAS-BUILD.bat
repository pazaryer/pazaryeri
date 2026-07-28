@echo off
setlocal
cd /d "%~dp0"

if "%EXPO_TOKEN%"=="" (
  echo HATA: EXPO_TOKEN ortam degiskeni gerekli.
  echo Expo Dashboard - Access Tokens - yeni token olusturun.
  exit /b 1
)

set EAS_NO_VCS=1
set EAS_PROJECT_ROOT=%CD%

echo === EAS Android Production Build ===
cd artifacts\mobile
call npx --yes eas-cli@latest build -p android --profile production --non-interactive
if errorlevel 1 exit /b 1

echo.
echo Build basladi: https://expo.dev/accounts/pazaryeri/projects/pazaryeri/builds
echo Keystore Expo'da olusturuldu - credentials sayfasindan SHA-1 alin.
