@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

set "LOG=%~dp0web-deploy.log"
echo [%date% %time%] Deploy basladi > "%LOG%"

echo ========================================
echo  Pazaryeri Web - Firebase Hosting
echo  Site: https://pazaryeri0.web.app
echo ========================================
echo.
echo Log: %LOG%
echo.

where pnpm >nul 2>&1
if errorlevel 1 (
  echo HATA: pnpm bulunamadi. >> "%LOG%"
  echo HATA: pnpm bulunamadi.
  echo Node.js + pnpm kurun: https://pnpm.io/installation
  goto :fail
)

where firebase >nul 2>&1
if errorlevel 1 (
  echo HATA: firebase CLI yok. >> "%LOG%"
  echo Firebase CLI yok. Kur: npm install -g firebase-tools
  goto :fail
)

echo [1/3] Firebase giris kontrolu...
firebase projects:list 2>&1 | findstr /i "pazaryeri0" >nul
if errorlevel 1 (
  echo Firebase girisi gerekli. Tarayici aciliyor... >> "%LOG%"
  echo Firebase girisi gerekli. Tarayici aciliyor...
  firebase login
  if errorlevel 1 (
    echo HATA: Firebase girisi basarisiz. >> "%LOG%"
    echo HATA: Firebase girisi basarisiz.
    echo FIREBASE-GIRIS.bat dosyasini calistirin.
    goto :fail
  )
)
echo Giris OK.
echo.

echo [2/3] Web build...
cd /d "%~dp0artifacts\mobile"
if errorlevel 1 goto :fail

call pnpm exec expo export -p web >> "%LOG%" 2>&1
if errorlevel 1 (
  echo HATA: Web build basarisiz. >> "%LOG%"
  echo HATA: Web build basarisiz. Detay: %LOG%
  goto :fail
)
cd /d "%~dp0"
echo Build OK.
echo.

echo [3/3] Firebase deploy...
firebase deploy --only hosting --project pazaryeri0 >> "%LOG%" 2>&1
if errorlevel 1 (
  echo HATA: Firebase deploy basarisiz. >> "%LOG%"
  echo HATA: Firebase deploy basarisiz.
  echo Detay icin acin: %LOG%
  goto :fail
)

echo.
echo ========================================
echo  BASARILI!
echo  Site: https://pazaryeri0.web.app
echo  Giris: https://pazaryeri0.web.app/login
echo ========================================
echo BASARILI >> "%LOG%"
pause
exit /b 0

:fail
echo.
echo ========================================
echo  HATA - Pencereyi kapatmayin
echo  Log dosyasi: %LOG%
echo ========================================
pause
exit /b 1
