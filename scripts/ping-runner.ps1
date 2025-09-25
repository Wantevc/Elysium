# C:\Users\Wante\OneDrive\AI-social-manager\web\scripts\ping-runner.ps1

$secret = "200fd327eae044d284dcdcc8f42def37"
$uri    = "http://localhost:3000/api/schedule/cron?secret=$secret"

# --- Bepaal scriptmap (fallbacks als $PSScriptRoot leeg is) ---
$scriptDir = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($scriptDir)) {
  try { $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path } catch { }
  if ([string]::IsNullOrWhiteSpace($scriptDir)) { $scriptDir = (Get-Location).Path }
}
$log = Join-Path $scriptDir "runner.log"

# Logbestand zeker aanmaken
if (-not (Test-Path $log)) { New-Item -Path $log -ItemType File -Force | Out-Null }

try {
  $res = Invoke-WebRequest -Uri $uri -Method POST -UseBasicParsing -TimeoutSec 25
  ("{0:u} OK {1}" -f (Get-Date), $res.StatusCode) | Out-File -FilePath $log -Append -Encoding utf8
} catch {
  ("{0:u} ERROR {1}" -f (Get-Date), $_.Exception.Message) | Out-File -FilePath $log -Append -Encoding utf8
}