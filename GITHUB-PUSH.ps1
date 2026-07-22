# Pazaryeri - GitHub'a Push (PowerShell)

$ErrorActionPreference = "Stop"
Set-Location "C:\Users\hasan\OneDrive\Masaüstü\pazaryeri"

$git = "C:\Program Files\Git\bin\git.exe"
if (-not (Test-Path $git)) {
  $git = (Get-Command git -ErrorAction SilentlyContinue).Source
}
if (-not $git) {
  Write-Host "HATA: Git kurulu degil. https://git-scm.com/download/win" -ForegroundColor Red
  exit 1
}

Write-Host "`n=== GitHub Push ===" -ForegroundColor Cyan
& $git status
& $git remote remove origin 2>$null
& $git remote add origin https://github.com/pazaryer/pazaryeri.git
& $git branch -M main

Write-Host "`nPush basliyor..." -ForegroundColor Yellow
Write-Host "Kullanici: pazaryer" -ForegroundColor Gray
Write-Host "Sifre: GitHub Personal Access Token (https://github.com/settings/tokens)`n" -ForegroundColor Gray

& $git push -u origin main

if ($LASTEXITCODE -eq 0) {
  Write-Host "`nBASARILI! Render'da Manual Deploy yap." -ForegroundColor Green
} else {
  Write-Host "`nPush basarisiz. Token ile tekrar dene." -ForegroundColor Red
}
