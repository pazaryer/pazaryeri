@echo off
chcp 65001 >nul 2>&1
title Pazaryeri - Expo Go QR
color 0A

set "MOBILE_DIR=%~dp0artifacts\mobile"

if not exist "%MOBILE_DIR%\package.json" (
  echo.
  echo  HATA: Mobil klasor bulunamadi:
  echo  %MOBILE_DIR%
  echo.
  pause
  exit /b 1
)

cd /d "%MOBILE_DIR%" || (
  echo.
  echo  HATA: Klasore gidilemedi.
  pause
  exit /b 1
)

set "PNPM=%APPDATA%\npm\pnpm.cmd"
if not exist "%PNPM%" (
  echo.
  echo  HATA: pnpm bulunamadi. npm install -g pnpm
  echo.
  pause
  exit /b 1
)

echo ========================================
echo   PAZARYERI - Expo Go QR Kodu
echo ========================================
echo.
echo  Klasor: %CD%
echo.
echo  Telefonunuzda Expo Go uygulamasini acin
echo  ve asagidaki QR kodu okutun.
echo.
echo  Durdurmak icin Ctrl+C
echo ========================================
echo.

call "%PNPM%" exec expo start --clear

echo.
if errorlevel 1 echo  HATA: Expo baslatilamadi.
pause
