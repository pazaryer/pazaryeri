@echo off
chcp 65001 >nul 2>&1
title Pazaryeri - Expo Go
set "PATH=%PATH%;%ProgramFiles%\nodejs;%ProgramFiles(x86)%\nodejs;%APPDATA%\npm"
cd /d "%~dp0artifacts\mobile"
if not exist "package.json" (
  echo HATA: artifacts\mobile bulunamadi.
  pause
  exit /b 1
)
if not exist "node_modules\@expo\cli" (
  echo Paketler kuruluyor...
  cd /d "%~dp0"
  call pnpm install
  cd /d "%~dp0artifacts\mobile"
)
echo Pazaryeri Expo Go baslatiliyor...
call pnpm exec expo start --clear
pause
