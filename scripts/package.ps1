$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
node (Join-Path $Root "scripts/package.mjs")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
