@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo  Pazaryeri Web - Firebase Hosting
echo  Site: https://pazaryeri0.web.app
echo ========================================
echo.

where pnpm >nul 2>&1
if errorlevel 1 (
  echo HATA: pnpm bulunamadi.
  pause
  exit /b 1
)

echo [1/2] Web build...
cd artifacts\mobile
call pnpm exec expo export -p web
if errorlevel 1 goto :fail
cd ..\..

echo.
echo [2/2] Firebase deploy...
where firebase >nul 2>&1
if errorlevel 1 (
  echo Firebase CLI yok. Kur: npm install -g firebase-tools
  echo Sonra: firebase login
  pause
  exit /b 1
)

firebase deploy --only hosting
if errorlevel 1 goto :fail

echo.
echo BASARILI: https://pazaryeri0.web.app
pause
exit /b 0

:fail
echo.
echo HATA: Deploy basarisiz.
pause
exit /b 1
