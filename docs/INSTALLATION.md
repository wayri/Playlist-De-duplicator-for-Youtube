# Installation and Updates

Playlist Deduper for YouTube™ currently ships as an offline Chromium extension package. Chrome Web Store installation will be added after the Store listing is approved.

## Recommended: install the GitHub release

### 1. Download

Open the repository's **Releases** page and download:

`playlist-deduper-for-youtube-vX.Y.Z-offline.zip`

The offline archive is intended for normal users. It contains:

```text
INSTALL.txt
Playlist-Deduper-for-YouTube/
  manifest.json
  popup.html
  popup.css
  popup.js
  content.js
  icons/
```

### 2. Extract the archive

Do not run the extension directly from inside the ZIP.

Extract it to a folder that you intend to keep, for example:

```text
Windows: C:\Users\<you>\Documents\Extensions\Playlist-Deduper-for-YouTube\
macOS:   ~/Documents/Extensions/Playlist-Deduper-for-YouTube/
Linux:   ~/Extensions/Playlist-Deduper-for-YouTube/
```

Chrome remembers the folder you select. Moving or deleting that folder later will break the unpacked installation.

### 3. Open the extensions page

In Chrome, enter:

```text
chrome://extensions
```

### 4. Enable Developer mode

Turn on **Developer mode** in the upper-right corner.

This is required only while installing the GitHub/offline edition. It will not be necessary once the Chrome Web Store edition is available.

### 5. Load the extension

Click **Load unpacked**.

Select the extracted folder named:

```text
Playlist-Deduper-for-YouTube
```

Select the folder itself, not the ZIP and not its parent directory. The correct folder contains `manifest.json` directly inside it.

### 6. Pin it

Click Chrome's extensions/puzzle icon and pin **Playlist Deduper for YouTube™**.

### 7. Test it

Open an editable YouTube playlist using the dedicated playlist page:

```text
https://www.youtube.com/playlist?list=...
```

Click the extension and run **Scan full playlist**.

A scan is read-only. Playlist entries are changed only after you explicitly select duplicate groups, confirm the cleanup, and click the removal action.

---

## Updating an offline installation

Chrome does not automatically update extensions installed with **Load unpacked**.

To update safely:

1. Download the newer `*-offline.zip` release.
2. Extract it to a new temporary location.
3. Close any Playlist Deduper popup that is open.
4. Replace the contents of your existing `Playlist-Deduper-for-YouTube` folder with the new release contents.
5. Open `chrome://extensions`.
6. Find Playlist Deduper and click the **Reload** button on its card.
7. Confirm the displayed version matches the release you downloaded.

Your small UI preferences are stored in `chrome.storage` and normally survive a code-folder update.

## Clean reinstall

If an update behaves unexpectedly:

1. Open `chrome://extensions`.
2. Remove Playlist Deduper.
3. Delete the old extracted extension folder.
4. Extract the latest offline ZIP into a fresh folder.
5. Use **Load unpacked** again.

Removing the extension may also remove its locally stored preferences. It does not modify your playlists merely by being uninstalled.

## Uninstall

1. Open `chrome://extensions`.
2. Find Playlist Deduper.
3. Click **Remove**.
4. Optionally delete the extracted extension folder.

## Microsoft Edge, Brave, Vivaldi, and other Chromium browsers

The extension uses Manifest V3 and standard Chromium extension APIs. It may work in other Chromium-based browsers, but Chrome is the primary supported browser before Store publication.

Typical extension pages are:

- Edge: `edge://extensions`
- Brave: `brave://extensions`
- Vivaldi: `vivaldi://extensions`

Enable the browser's developer mode and use its **Load unpacked** command, then select the folder containing `manifest.json`.

## Which release file should I download?

| File | Intended audience | Contents |
| --- | --- | --- |
| `*-offline.zip` | Normal GitHub users | Ready-to-extract extension folder plus a short install guide. |
| `*-store.zip` | Chrome Web Store submission/review | Runtime extension files only, with `manifest.json` at ZIP root. |
| `*-source.zip` | Developers/auditors | Complete repository source and documentation for that release. |

For ordinary manual installation, use **`*-offline.zip`**.

## Why isn't there a one-click `.crx` installer?

Modern Chrome intentionally restricts direct installation of arbitrary `.crx` files outside approved distribution mechanisms. Providing a downloaded `.crx` would therefore not give most users a reliable one-click install experience.

Until the Chrome Web Store version is live, **Load unpacked** from the offline release is the most transparent and reliable supported installation path.

## Troubleshooting installation

### “Manifest file is missing or unreadable”

You selected the wrong folder. Choose the folder that contains `manifest.json` directly.

### The extension disappears after I delete the extracted files

An unpacked extension runs from that folder. Restore the folder or reinstall it from the release ZIP.

### Chrome says the extension is from an unknown source

That is expected for an unpacked GitHub build. The repository contains the complete source and release artifacts are built by the project's GitHub workflow. The Chrome Web Store edition will use Chrome's normal signed Store distribution path.

### It installs but does not scan the page

Make sure you are on `youtube.com`, preferably the dedicated playlist page, and invoke the extension from that tab. The extension deliberately has no persistent YouTube host permission; `activeTab` grants temporary access only when you invoke it.

For functional problems after installation, see [Troubleshooting](TROUBLESHOOTING.md).
