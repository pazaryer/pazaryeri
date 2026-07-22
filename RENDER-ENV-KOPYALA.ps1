# Render Dashboard > Environment bölümüne yapıştırmak için değerleri gösterir.
# Mevcut değişkenleri DÜZENLE — yeniden ekleme (duplicate hatası verir).

$envFile = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envFile)) {
  Write-Host "HATA: .env dosyası bulunamadı" -ForegroundColor Red
  exit 1
}

$vars = @{}
Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
  $i = $_.IndexOf('=')
  if ($i -gt 0) {
    $k = $_.Substring(0, $i).Trim()
    $v = $_.Substring($i + 1).Trim()
    $vars[$k] = $v
  }
}

$renderKeys = @(
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'FIREBASE_PROJECT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_ENDPOINT',
  'R2_BUCKET_NAME',
  'R2_PUBLIC_URL',
  'CLOUDFLARE_ACCOUNT_ID',
  'NODE_ENV'
)

Write-Host "`n=== RENDER ENVIRONMENT VARIABLES ===" -ForegroundColor Cyan
Write-Host "Her satırı Render'da ilgili degiskenin VALUE alanına yapistir.`n" -ForegroundColor Yellow

foreach ($key in $renderKeys) {
  $val = if ($key -eq 'NODE_ENV') { 'production' } else { $vars[$key] }
  if (-not $val) {
    Write-Host "$key = (EKSIK - .env dosyasini kontrol et)" -ForegroundColor Red
  } else {
    Write-Host "$key" -ForegroundColor Green
    Write-Host "  $val`n"
  }
}

Write-Host "NOT: FIREBASE_SERVICE_ACCOUNT_JSON artik gerekli degil." -ForegroundColor Gray
Write-Host "Render'da duplicate hata alirsan sayfayi yenile ve mevcut key'leri duzenle.`n" -ForegroundColor Gray
