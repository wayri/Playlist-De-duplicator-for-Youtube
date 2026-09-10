#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
node scripts/validate.mjs
VERSION="$(node -p "require('./manifest.json').version")"
mkdir -p dist
rm -rf dist/store-stage dist/offline-stage
mkdir -p dist/store-stage/icons
cp manifest.json popup.html popup.css popup.js content.js dist/store-stage/
cp icons/icon16.png icons/icon32.png icons/icon48.png icons/icon128.png dist/store-stage/icons/
(
  cd dist/store-stage
  rm -f "../playlist-deduper-for-youtube-v${VERSION}-store.zip"
  zip -qr "../playlist-deduper-for-youtube-v${VERSION}-store.zip" .
)

# Human-friendly offline package: the extension lives in a clearly named folder,
# with a short INSTALL.txt beside it so users know exactly which directory to load.
mkdir -p dist/offline-stage/Playlist-Deduper-for-YouTube/icons
cp manifest.json popup.html popup.css popup.js content.js dist/offline-stage/Playlist-Deduper-for-YouTube/
cp icons/icon16.png icons/icon32.png icons/icon48.png icons/icon128.png dist/offline-stage/Playlist-Deduper-for-YouTube/icons/
cp INSTALL.txt dist/offline-stage/
(
  cd dist/offline-stage
  rm -f "../playlist-deduper-for-youtube-v${VERSION}-offline.zip"
  zip -qr "../playlist-deduper-for-youtube-v${VERSION}-offline.zip" .
)

rm -f "dist/playlist-deduper-for-youtube-v${VERSION}-source.zip"
zip -qr "dist/playlist-deduper-for-youtube-v${VERSION}-source.zip" . \
  -x '.git/*' 'dist/*'

rm -rf dist/store-stage dist/offline-stage
printf 'Created:\n  dist/playlist-deduper-for-youtube-v%s-offline.zip\n  dist/playlist-deduper-for-youtube-v%s-store.zip\n  dist/playlist-deduper-for-youtube-v%s-source.zip\n' "$VERSION" "$VERSION" "$VERSION"
