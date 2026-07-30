# Pazaryeri — güvenli proje temizliği (uygulama/admin/api bozulmaz)
$ErrorActionPreference = 'Continue'
$root = Split-Path $PSScriptRoot -Parent

function Remove-IfExists([string]$Path, [string]$Label) {
  if (Test-Path $Path) {
    Remove-Item -LiteralPath $Path -Recurse -Force -ErrorAction SilentlyContinue
    if (-not (Test-Path $Path)) { Write-Host "OK silindi: $Label" }
    else { Write-Host "UYARI kaldi: $Label" }
  }
}

function Remove-FileIfExists([string]$Path, [string]$Label) {
  if (Test-Path $Path) {
    Remove-Item -LiteralPath $Path -Force -ErrorAction SilentlyContinue
    Write-Host "OK silindi: $Label"
  }
}

Write-Host "=== Pazaryeri temizlik basladi ===" -ForegroundColor Cyan

# Eski test export klasorleri
Remove-IfExists "$root\artifacts\mobile\dist-test" "mobile/dist-test"
Remove-IfExists "$root\artifacts\admin\dist-test" "admin/dist-test"
Remove-IfExists "$root\artifacts\mobile\dist" "mobile/dist (bos/eski)"
Remove-IfExists "$root\artifacts\admin\dist" "admin/dist (bos/eski)"

# Kullanilmayan mockup sandbox (uretimde yok)
Remove-IfExists "$root\artifacts\mockup-sandbox" "mockup-sandbox"

# CDN kullaniliyor — yerel kategori kopyalari gereksiz
Remove-IfExists "$root\artifacts\mobile\assets\images\categories" "mobile/assets/images/categories"

# Kullanilmayan mobil gorseller (app.json icon.png kullaniyor)
Remove-FileIfExists "$root\artifacts\mobile\assets\images\splash-icon.png" "mobile splash-icon.png"
Remove-FileIfExists "$root\artifacts\mobile\assets\images\adaptive-icon.png" "mobile adaptive-icon.png"
Remove-FileIfExists "$root\artifacts\mobile\assets\images\logo-mark.png" "mobile logo-mark.png"

# Kullanilmayan kod
Remove-FileIfExists "$root\artifacts\mobile\lib\resolve-local-image.ts" "resolve-local-image.ts"

# Yinelenen ses dosyalari (tireli — kod underscore kullaniyor)
$dupSounds = @(
  "$root\artifacts\mobile\assets\sounds\pazaryeri-push.wav",
  "$root\artifacts\mobile\assets\sounds\pazaryeri-message.wav",
  "$root\artifacts\mobile\assets\sounds\pazaryeri-favorite.wav",
  "$root\artifacts\mobile\assets\sounds\pazaryeri-inapp.wav",
  "$root\artifacts\admin\assets\sounds\pazaryeri-push.wav",
  "$root\artifacts\admin\assets\sounds\pazaryeri-message.wav",
  "$root\artifacts\admin\assets\sounds\pazaryeri-favorite.wav",
  "$root\artifacts\admin\assets\sounds\pazaryeri-inapp.wav"
)
foreach ($f in $dupSounds) { Remove-FileIfExists $f (Split-Path $f -Leaf) }

# Kok gereksiz / yinelenen dosyalar
Remove-FileIfExists "$root\google14696a33d8fd7777.html" "kok google verification (public'te var)"
Remove-FileIfExists "$root\replit.md" "replit.md"
Remove-FileIfExists "$root\.replitignore" ".replitignore"

# Android build artiklari
Remove-IfExists "$root\artifacts\admin\android\app\build" "admin android build"
Remove-IfExists "$root\artifacts\admin\android\.gradle" "admin android .gradle"
Remove-IfExists "$root\artifacts\mobile\android\app\build" "mobile android build"
Remove-IfExists "$root\artifacts\mobile\android\.gradle" "mobile android .gradle"
Remove-IfExists "$root\artifacts\mobile\.expo" "mobile .expo cache"
Remove-IfExists "$root\artifacts\admin\.expo" "admin .expo cache"

# Log dosyalari
Get-ChildItem -Path $root -Recurse -Include *.log -File -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -notmatch 'node_modules' } |
  ForEach-Object { Remove-FileIfExists $_.FullName $_.Name }

# Cursor gecici play store gorselleri (masaustunde kopya var)
$cursorAssets = "$env:USERPROFILE\.cursor\projects\c-Users-hasan-OneDrive-Masa-st-pazaryeri\assets"
Remove-IfExists $cursorAssets "Cursor gecici play gorselleri"

# Masaustu eski APK/AAB (1.1.3 — 1.1.4 kalir)
$desktop = [Environment]::GetFolderPath('Desktop')
if (-not (Test-Path $desktop)) { $desktop = "$env:USERPROFILE\OneDrive\Masaüstü" }
Remove-FileIfExists "$desktop\pazaryeri-1.1.3.apk" "eski pazaryeri-1.1.3.apk"
Remove-FileIfExists "$desktop\pazaryeri-1.1.3.aab" "eski pazaryeri-1.1.3.aab"

Write-Host "=== Temizlik tamamlandi ===" -ForegroundColor Green
