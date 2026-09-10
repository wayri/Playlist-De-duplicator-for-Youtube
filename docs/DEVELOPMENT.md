# Development Guide

## Prerequisites

- Current Google Chrome or a Chromium browser supporting Manifest V3.
- Node.js 18+ for repository validation scripts.
- Git.

No npm dependencies are required.

## Clone and load

```bash
git clone https://github.com/wayri/playlist-deduper-for-youtube.git
cd playlist-deduper-for-youtube
npm test
```

Then open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select the repository root.

## Development loop

After changing popup files:

1. Click **Reload** on the extension card.
2. Reopen the popup.

After changing `content.js`:

1. Reload the extension.
2. Refresh the YouTube tab so an old injected copy cannot remain active.
3. Re-run the test scenario.

## Debugging the popup

Open the extension popup, right-click inside it, and choose **Inspect**. This opens DevTools for `popup.html`.

Useful checks:

- uncaught JavaScript exceptions;
- active-tab lookup failures;
- message-port errors after extension reload;
- storage preference values;
- CSV/report generation.

## Debugging `content.js`

Open DevTools on the YouTube tab. Injected extension content-script logs/errors appear in the page DevTools context.

When diagnosing selector failures, inspect the current `ytd-playlist-video-renderer`, item menu button, popup container, and visible `ytd-menu-service-item-renderer` nodes.

Do not “fix” a removal selector by clicking a fixed menu index. Menu ordering is not a safe destructive-action contract.

## Static validation

```bash
npm test
```

The validator checks:

- `manifest.json` parses and uses Manifest V3;
- version/name/description sanity;
- expected permissions only;
- referenced popup/icon files exist;
- no persistent host permissions;
- no obvious `eval` / `new Function` usage;
- no remote `<script src="http...">` tags;
- JavaScript parses via Node's syntax checker;
- required repository/publication files exist.

Static checks are not a substitute for live YouTube testing.

## Packaging

Windows PowerShell:

```powershell
./scripts/package.ps1
```

macOS/Linux:

```bash
./scripts/package.sh
```

Both scripts validate first and create a Store-oriented runtime ZIP plus a source archive in `dist/`.

## Making UI changes

The popup is intentionally a guided workflow rather than a generic settings panel.

Preserve:

- one obvious primary scan action;
- clear progression from scan to review to clean;
- removal count shown before destructive action;
- confirmation reset when planned removals change;
- keyboard focus visibility;
- readable behavior on long playlists without expanding the popup indefinitely.

## Making selector changes

See `SELECTORS_AND_COMPATIBILITY.md` before editing YouTube DOM selectors or localized removal patterns.

Selector changes require live regression because YouTube often has multiple renderer/menu variants active simultaneously.

## Adding permissions

Treat permission changes as an architectural change.

Before adding one, document:

1. the user-visible feature requiring it;
2. why current permissions cannot implement the feature;
3. whether a narrower optional permission exists;
4. privacy impact;
5. Chrome Web Store disclosure changes.

The current baseline is intentionally only `activeTab`, `scripting`, and `storage`.

## Dependencies

Avoid runtime dependencies unless necessary. Every bundled dependency increases audit surface and Store-package complexity.

If a dependency is ever added:

- pin it;
- document why it is necessary;
- ensure it is bundled locally;
- confirm the Store package does not fetch executable code remotely;
- review license compatibility with this repository.
