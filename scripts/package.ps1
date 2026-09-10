$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

node scripts/validate.mjs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$Manifest = Get-Content manifest.json -Raw | ConvertFrom-Json
$Version = $Manifest.version
$Dist = Join-Path $Root "dist"
$StoreStage = Join-Path $Dist "store-stage"
$OfflineStage = Join-Path $Dist "offline-stage"
$OfflineExtension = Join-Path $OfflineStage "Playlist-Deduper-for-YouTube"

Remove-Item $StoreStage, $OfflineStage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $StoreStage | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $StoreStage "icons") | Out-Null

$Runtime = @("manifest.json", "popup.html", "popup.css", "popup.js", "content.js")
foreach ($File in $Runtime) { Copy-Item $File $StoreStage }
Copy-Item "icons/icon16.png", "icons/icon32.png", "icons/icon48.png", "icons/icon128.png" (Join-Path $StoreStage "icons")

$StoreZip = Join-Path $Dist "playlist-deduper-for-youtube-v$Version-store.zip"
$OfflineZip = Join-Path $Dist "playlist-deduper-for-youtube-v$Version-offline.zip"
$SourceZip = Join-Path $Dist "playlist-deduper-for-youtube-v$Version-source.zip"
Remove-Item $StoreZip, $OfflineZip, $SourceZip -Force -ErrorAction SilentlyContinue
Compress-Archive -Path (Join-Path $StoreStage "*") -DestinationPath $StoreZip

# Human-friendly offline package.
New-Item -ItemType Directory -Force -Path $OfflineExtension | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $OfflineExtension "icons") | Out-Null
foreach ($File in $Runtime) { Copy-Item $File $OfflineExtension }
Copy-Item "icons/icon16.png", "icons/icon32.png", "icons/icon48.png", "icons/icon128.png" (Join-Path $OfflineExtension "icons")
Copy-Item "INSTALL.txt" $OfflineStage
Compress-Archive -Path (Join-Path $OfflineStage "*") -DestinationPath $OfflineZip

$SourceItems = Get-ChildItem $Root -Force | Where-Object { $_.Name -notin @(".git", "dist") }
Compress-Archive -Path $SourceItems.FullName -DestinationPath $SourceZip
Remove-Item $StoreStage, $OfflineStage -Recurse -Force

Write-Host "Created:"
Write-Host "  $OfflineZip"
Write-Host "  $StoreZip"
Write-Host "  $SourceZip"
