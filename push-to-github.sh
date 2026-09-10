#!/usr/bin/env bash
set -euo pipefail
REPO='https://github.com/wayri/Playlist-De-duplicator-for-Youtube.git'

command -v git >/dev/null || { echo 'Git is required.' >&2; exit 1; }

if [[ ! -d .git ]]; then
  git init -b main
fi

git add -A
if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
  git commit -m 'Release v1.3.0: initial public GitHub release'
elif ! git diff --cached --quiet; then
  git commit -m 'Release v1.3.0: initial public GitHub release'
fi

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REPO"
else
  git remote add origin "$REPO"
fi

git branch -M main
git push -u origin main
printf '\nPush complete. GitHub Actions should validate and publish v1.3.0.\nActions:  https://github.com/wayri/Playlist-De-duplicator-for-Youtube/actions\nReleases: https://github.com/wayri/Playlist-De-duplicator-for-Youtube/releases\n'
