Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
$ErrorActionPreference = 'Stop'

$paths = @(
  "$env:USERPROFILE\OneDrive\Masaüstü\pazaryeri\artifacts\mobile"
  "$env:USERPROFILE\OneDrive\Desktop\pazaryeri\artifacts\mobile"
  "$PSScriptRoot\artifacts\mobile"
)

$mobileDir = $paths | Where-Object { Test-Path "$_\package.json" } | Select-Object -First 1

if (-not $mobileDir) {
  Write-Host ""
  Write-Host "HATA: Pazaryeri mobil klasoru bulunamadi." -ForegroundColor Red
  Read-Host "Kapatmak icin Enter"
  exit 1
}

Set-Location $mobileDir

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PAZARYERI - Expo Go QR Kodu" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Klasor: $mobileDir"
Write-Host ""
Write-Host "Expo Go ile QR kodu okutun."
Write-Host ""

$pnpm = "$env:APPDATA\npm\pnpm.cmd"
if (Test-Path $pnpm) {
  & $pnpm exec expo start --clear
} else {
  pnpm exec expo start --clear
}

Read-Host "Kapatmak icin Enter"
