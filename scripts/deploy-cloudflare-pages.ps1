# Opsiyonel: Web'i Cloudflare Pages'e PARALEL deploy (Firebase kalir, URL degismez)
# Sonuc: https://pazaryeri-web.pages.dev (yedek / test)
# Ana site: https://pazaryeri0.web.app (degismedi)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$dist = Join-Path $root "artifacts\mobile\dist"
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

if (-not $env:CLOUDFLARE_API_TOKEN) {
  Write-Host "HATA: CLOUDFLARE_API_TOKEN gerekli (.env)"
  exit 1
}

if (-not (Test-Path -LiteralPath $dist)) {
  Write-Host "dist yok, once web build..."
  Push-Location $root
  pnpm web:build
  Pop-Location
}

$projectName = if ($env:CF_PAGES_PROJECT) { $env:CF_PAGES_PROJECT } else { "pazaryeri-web" }

Write-Host "Cloudflare Pages deploy: $projectName (Firebase etkilenmez)"
npx --yes wrangler@4 pages deploy $dist --project-name=$projectName --branch=main --commit-dirty=true

if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "Pages yedek URL: https://${projectName}.pages.dev"
  Write-Host "Ana site hala: https://pazaryeri0.web.app"
}
