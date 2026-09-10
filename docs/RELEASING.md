# Release Process

## 1. Update version and changelog

- Set `manifest.json.version`.
- Add dated release notes to `CHANGELOG.md`.
- Update version references in `TEST_PLAN.md`, publishing docs, and Store copy where relevant.

## 2. Validate

```bash
npm test
```

Resolve every static validation failure.

## 3. Run live regression

Use a disposable editable playlist and complete `TEST_PLAN.md`, especially:

- full lazy-load scan;
- 2-copy group;
- 3+ copy group;
- multiple groups;
- selective cleanup;
- keep first;
- keep last;
- cancellation;
- uneditable playlist safety;
- current default YouTube language;
- any additional language claimed as supported.

## 4. Package

PowerShell:

```powershell
./scripts/package.ps1
```

or Bash:

```bash
./scripts/package.sh
```

Expected output:

```text
dist/playlist-deduper-for-youtube-vX.Y.Z-store.zip
dist/playlist-deduper-for-youtube-vX.Y.Z-source.zip
```

The Store ZIP must have `manifest.json` at archive root and should contain runtime files only.

## 5. Inspect the archives

Confirm the Store package contains no:

- `.git` metadata;
- docs not required at runtime;
- test captures;
- secrets;
- editor metadata;
- remote-code loaders;
- source maps containing unintended local paths.

## 6. Tag GitHub

After the tested commit is final:

```bash
git tag -a vX.Y.Z -m "Playlist Deduper vX.Y.Z"
git push origin vX.Y.Z
```

Create a GitHub Release for the tag and attach the source/offline archive if desired.

## 7. Chrome Web Store

Follow `CHROME_WEB_STORE.md` and `../PUBLISHING.md`.

Keep the exact source corresponding to every submitted Store ZIP so reviewer questions and future regressions can be reproduced.
