@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo  Temiz gecmis ile GitHub Push
echo ========================================
echo.

where git >nul 2>&1
if errorlevel 1 (
  echo HATA: Git bulunamadi.
  pause
  exit /b 1
)

git checkout --orphan temp-clean
if errorlevel 1 goto :fail

git add -A
git commit -m "Pazaryeri marketplace app with Firebase Auth"
if errorlevel 1 goto :fail

git branch -D main 2>nul
git branch -m main

git remote remove origin 2>nul
git remote add origin https://github.com/pazaryer/pazaryeri.git

echo.
echo GitHub kullanici: pazaryer
echo Sifre: Personal Access Token
echo Token: https://github.com/settings/tokens
echo.

git push -u origin main --force
if errorlevel 1 goto :fail

echo.
echo BASARILI! Render Manual Deploy yap.
pause
exit /b 0

:fail
echo.
echo HATA: Islem basarisiz.
pause
exit /b 1
