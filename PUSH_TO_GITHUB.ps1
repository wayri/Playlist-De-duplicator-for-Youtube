$ErrorActionPreference = "Stop"
$Repo = "https://github.com/wayri/Playlist-De-duplicator-for-Youtube.git"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "Git is not installed or is not on PATH. Install Git for Windows first."
}

if (Test-Path .git) {
  Write-Host "Existing Git repository detected."
} else {
  git init -b main
}

git add -A
$hasHead = $true
git rev-parse --verify HEAD *> $null
if ($LASTEXITCODE -ne 0) { $hasHead = $false; $global:LASTEXITCODE = 0 }

if (-not $hasHead) {
  git commit -m "Release v1.3.0: initial public GitHub release"
} else {
  git diff --cached --quiet
  if ($LASTEXITCODE -ne 0) {
    git commit -m "Release v1.3.0: initial public GitHub release"
  }
}

git remote get-url origin *> $null
if ($LASTEXITCODE -eq 0) {
  git remote set-url origin $Repo
} else {
  $global:LASTEXITCODE = 0
  git remote add origin $Repo
}

git branch -M main
git push -u origin main

Write-Host ""
Write-Host "Push complete. GitHub Actions should now validate the project and publish v1.3.0."
Write-Host "Actions:  https://github.com/wayri/Playlist-De-duplicator-for-Youtube/actions"
Write-Host "Releases: https://github.com/wayri/Playlist-De-duplicator-for-Youtube/releases"
