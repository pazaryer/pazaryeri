@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo  Pazaryeri - GitHub Push
echo  (Once GITHUB-TEMIZ-PUSH.bat kullanin)
echo ========================================
echo.
echo Bu script sadece normal push yapar.
echo Ilk kez push ediyorsaniz GITHUB-TEMIZ-PUSH.bat calistirin.
echo.
pause

git remote remove origin 2>nul
git remote add origin https://github.com/pazaryer/pazaryeri.git
git branch -M main
git push -u origin main
pause
