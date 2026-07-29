@echo off
chcp 65001 >nul 2>&1
title Pazaryeri Admin - Expo Go
color 0A
cd /d "%~dp0..\artifacts\admin"

where node >nul 2>&1 || (echo Node.js gerekli & pause & exit /b 1)

if not exist node_modules call npm install --legacy-peer-deps

set EXPO_PORT=8082
netstat -ano | findstr ":8082 " | findstr LISTENING >nul && set EXPO_PORT=8083

echo Expo Admin - port %EXPO_PORT%
call npx --yes expo start --clear --port %EXPO_PORT%
pause
