# Pazaryeri - Tek Tıkla Kurulum (Windows)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PAZARYERI - Kurulum Baslatiyor" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

# 1. SQL dosyasini panoya kopyala
$sqlPath = Join-Path $root "supabase\setup.sql"
if (Test-Path $sqlPath) {
    Get-Content $sqlPath -Raw | Set-Clipboard
    Write-Host "`n[OK] setup.sql panoya kopyalandi!" -ForegroundColor Green
    Write-Host "     Supabase SQL Editor'de Ctrl+V ile yapistirin" -ForegroundColor Yellow
}

# 2. Supabase SQL Editor'i ac
$sqlUrl = "https://supabase.com/dashboard/project/vqllsqrgwwzrehcgeyot/sql/new"
Start-Process $sqlUrl
Write-Host "[OK] Supabase SQL Editor acildi: $sqlUrl" -ForegroundColor Green

# 3. API build
Write-Host "`n[*] API sunucusu build ediliyor..." -ForegroundColor Yellow
Set-Location "$root\artifacts\api-server"
node ./build.mjs
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] API build basarili!" -ForegroundColor Green
} else {
    Write-Host "[HATA] API build basarisiz!" -ForegroundColor Red
}

# 4. API baslat
Write-Host "`n[*] API sunucusu baslatiliyor (port 5000)..." -ForegroundColor Yellow
$env:PORT = "5000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\artifacts\api-server'; `$env:PORT='5000'; node --env-file='$root\.env' --enable-source-maps ./dist/index.mjs"
Write-Host "[OK] API sunucusu baslatildi: http://localhost:5000/api/healthz" -ForegroundColor Green

# 5. Expo baslat
Write-Host "`n[*] Expo mobil uygulama baslatiliyor..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\artifacts\mobile'; pnpm exec expo start"
Write-Host "[OK] Expo baslatildi!" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  YAPMANIZ GEREKEN TEK SEY:" -ForegroundColor Cyan
Write-Host "  Supabase SQL Editor'de Ctrl+V + RUN" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
