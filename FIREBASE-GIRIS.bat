@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo  Firebase Giris
echo  Proje: pazaryeri0
echo ========================================
echo.

where firebase >nul 2>&1
if errorlevel 1 (
  echo Firebase CLI yok. Kur: npm install -g firebase-tools
  pause
  exit /b 1
)

echo [1] Normal giris (tarayici acilir)...
firebase login --reauth
if errorlevel 1 (
  echo.
  echo [2] Alternatif: Manuel kod ile giris...
  firebase login --no-localhost
)

echo.
firebase projects:list
echo.
echo Giris tamam. WEB-DEPLOY.bat calistirin.
pause
