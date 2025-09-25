param([switch]$DryRun)

$map = Get-Content .\translate_map.json -Raw | ConvertFrom-Json
$files = Get-ChildItem .\src -Recurse -Include *.tsx,*.ts,*.jsx,*.js

$stamp = (Get-Date).ToString('yyyyMMdd_HHmmss')
$logPath = ".\translate_log_$stamp.txt"
$log = @()

foreach ($f in $files) {
  $txt = Get-Content $f.FullName -Raw -Encoding UTF8
  $orig = $txt
  $changedKeys = @()

  foreach ($k in $map.PSObject.Properties.Name) {
    $v = [string]$map.$k
    if ($txt.Contains($k)) {
      # tel hits (alleen voor het log)
      $count = ([regex]::Matches($txt, [regex]::Escape($k))).Count
      $txt = $txt.Replace($k, $v)   # <-- plain text replace, géén regex!
      $changedKeys += "$k -> $v ($count)"
    }
  }

  if ($txt -ne $orig) {
    if (-not $DryRun) { Set-Content $f.FullName $txt -Encoding UTF8 }
    $log += "[$($f.FullName)]`n  " + ($changedKeys -join "`n  ")
  }
}

$mode = $DryRun ? "DRY-RUN" : "APPLIED"
"=== $mode $(Get-Date) ===`n" + ($log -join "`n") | Set-Content $logPath -Encoding UTF8
Write-Host "$mode complete. See log: $logPath"s