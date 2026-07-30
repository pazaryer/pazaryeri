# Pazaryeri Cloudflare keep-alive Worker deploy
# Canlı API URL'ini değiştirmez; yalnızca Render'ı periyodik pingler.
# Gerekli: CLOUDFLARE_API_TOKEN (.env veya ortam değişkeni)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$workerDir = Join-Path $root "cloudflare\keepalive-worker"
$envFile = Join-Path $root ".env"

function Load-DotEnv([string]$path) {
  if (-not (Test-Path -LiteralPath $path)) { return }
  Get-Content -LiteralPath $path | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
    $name, $value = $_ -split '=', 2
    $name = $name.Trim()
    $value = $value.Trim().Trim('"').Trim("'")
    if ($name -and -not [string]::IsNullOrWhiteSpace($name)) {
      if (-not (Get-Item -Path "Env:$name" -ErrorAction SilentlyContinue)) {
        Set-Item -Path "Env:$name" -Value $value
      }
    }
  }
}

Load-DotEnv $envFile
$mobileEnv = Join-Path $root "artifacts\mobile\.env"
Load-DotEnv $mobileEnv

if (-not $env:CLOUDFLARE_API_TOKEN) {
  Write-Host "HATA: CLOUDFLARE_API_TOKEN bulunamadi."
  Write-Host "Cloudflare Dashboard > My Profile > API Tokens > Create Token"
  Write-Host "  Sablon: Edit Cloudflare Workers (Workers Scripts + Cron Triggers)"
  Write-Host "  .env dosyasina ekleyin: CLOUDFLARE_API_TOKEN=..."
  exit 1
}

function Register-WorkersSubdomain {
  $accountId = $env:CLOUDFLARE_ACCOUNT_ID
  if (-not $accountId) { return }
  try {
    $headers = @{
      Authorization = "Bearer $($env:CLOUDFLARE_API_TOKEN)"
      "Content-Type" = "application/json"
    }
    $sub = "pazaryeri"
    Invoke-RestMethod -Method PUT -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/workers/subdomain" -Headers $headers -Body (@{ subdomain = $sub } | ConvertTo-Json) | Out-Null
    Write-Host "workers.dev alt alani hazir: $sub.workers.dev"
  } catch {
    Write-Host "workers.dev alt alani (zaten kayitli olabilir): $($_.Exception.Message)"
  }
}

Register-WorkersSubdomain

Push-Location $workerDir
try {
  if (-not (Test-Path "node_modules")) {
    Write-Host "wrangler kuruluyor..."
    npm install --no-fund --no-audit
  }
  Write-Host "Keep-alive Worker deploy ediliyor..."
  npx wrangler deploy 2>&1 | Tee-Object -Variable deployOut
  $deployText = $deployOut | Out-String
  if ($LASTEXITCODE -ne 0 -and $deployText -match 'schedules\) failed') {
    Write-Host ""
    Write-Host "UYARI: Worker yuklendi ama Cron tetikleyici eklenemedi (token yetkisi)."
    Write-Host "Manuel: Cloudflare Dashboard > Workers > pazaryeri-keepalive > Triggers"
    Write-Host "  Cron ifadesi: */14 * * * *"
    Write-Host "Alternatif (ucretsiz): https://cron-job.org ile her 14 dk su URL'ye GET:"
    Write-Host "  https://pazaryerim.onrender.com/api/healthz"
    exit 0
  }
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Host ""
  Write-Host "Tamam. Worker her 14 dakikada API'yi pingler."
  Write-Host "Test: wrangler deployments list veya worker URL'sine GET istegi."
} finally {
  Pop-Location
}
