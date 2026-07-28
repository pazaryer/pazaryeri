@echo off
chcp 65001 >nul 2>&1
title Render API Deploy
color 0E

echo ========================================
echo   RENDER - API Deploy (ilan ver fix)
echo ========================================
echo.
echo  Sorun: Canli API eski kod calistiriyor.
echo  Hata: isPostgresAvailable is not defined
echo.
echo  Cozum: GitHub'a push veya Render Manual Deploy
echo.
echo  1) GitHub: https://github.com/pazaryer/pazaryeri
echo  2) Render Dashboard - pazaryerim servisi
echo  3) Manual Deploy - Deploy latest commit
echo.
echo  Deploy sonrasi test:
echo  https://pazaryerim.onrender.com/api/healthz
echo  (google alani gorunmeli)
echo.
pause
