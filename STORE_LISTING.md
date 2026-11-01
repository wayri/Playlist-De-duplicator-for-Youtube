# Chrome Web Store Listing Draft — v1.3.1

## Item title

**Playlist Deduper for YouTube™**

## Summary

Find, review, and safely remove exact duplicate videos from YouTube™ playlists. Local processing, no API key or data upload.

## Suggested category

**Tools**

Language: **English**. Submission status: **draft saved, not submitted**. Item ID: `gljlcpejifgfjkehhebekclcgoemggna`.

## Detailed description

Clean exact duplicate video entries out of YouTube™ playlists without an API key or separate Google account connection.

Playlist Deduper scans the playlist already open in your browser, groups repeated entries by exact YouTube video ID, shows where every copy occurs, and lets you choose what should be removed before anything changes.

### Guided workflow

**Scan → Review → Clean**

- Lazy-loading scan for long playlists; incomplete scans are labelled partial.
- Exact duplicate detection by video ID, not fuzzy title matching.
- Duplicate positions shown before cleanup.
- Select or exclude individual duplicate groups.
- Keep the first or last playlist occurrence.
- Search and sort duplicate groups.
- Copy a report or export CSV.
- Diagnostics for entries that do not expose a usable video ID.
- Cancellable, rate-limited cleanup using YouTube's visible playlist menu.
- Verification after removal.

### Privacy first

- No YouTube Data API key.
- No Google OAuth/account authorization.
- No analytics, ads, telemetry, or developer backend.
- No playlist-data upload.
- Playlist content is processed locally in the user-invoked tab.
- Only UI preferences are stored in extension storage; reports and CSV files are created locally when requested.
- No persistent YouTube host permission.

### Safety

Cleanup is deliberately explicit. You review/select duplicate groups, choose which occurrence to keep, see the exact number of entries that will be removed, and confirm before cleanup.

If the extension cannot safely recognize YouTube's visible “Remove from playlist” command in the current English interface, it does not guess another menu action.

### Limitations

You must be able to edit the playlist for removal to work. Some private/deleted/unavailable placeholders may not expose a video ID and are skipped. YouTube changes its web interface regularly, so future UI changes can require an extension update.

Playlist Deduper for YouTube™ is an independent extension and is not affiliated with, endorsed by, sponsored by, or maintained by Google LLC or YouTube.

YouTube is a trademark of Google LLC.

## Privacy practices — draft

### Single purpose

> Find, review, and safely remove exact duplicate video entries from YouTube playlists that the user opens in the browser.

### `activeTab`

> Grants temporary access only to the tab where the user explicitly invokes the extension. This allows the current YouTube playlist to be inspected/modified without persistent YouTube browsing access.

### `scripting`

> Injects the extension's packaged `content.js` helper into the temporarily authorized tab so it can scan playlist DOM entries and operate the visible playlist removal menu after explicit confirmation. No remotely hosted code is injected.

### `storage`

> Stores only local extension UI preferences such as keep-first/keep-last and duplicate-list sort order. Playlist content and scan results are not persistently stored in extension storage. A user-requested report may be copied to the clipboard or saved as a CSV file.

### Remote code

> No. All executable JavaScript is packaged with the extension.

### Data-handling note

The extension locally processes website content required for its single purpose. It does not send that content to the developer or third parties. At submission time, use the Chrome Web Store Dashboard's current exact category wording and do not under-disclose local page-content handling.

## Reviewer notes

> Test on an editable YouTube playlist page in the form `https://www.youtube.com/playlist?list=...`. “Scan full playlist” scrolls through lazy-loaded entries and groups repeated video IDs. Cleanup is disabled until duplicates are found, at least one group is selected, and the user checks the final confirmation. The extension uses the visible playlist-item menu and deliberately refuses to click an unrecognized removal action.

## URLs

- Homepage/source: `https://github.com/wayri/Playlist-De-duplicator-for-Youtube`
- Support: `https://github.com/wayri/Playlist-De-duplicator-for-Youtube/issues`
- Privacy policy: `https://github.com/wayri/Playlist-De-duplicator-for-Youtube/blob/release/v1.3.1/PRIVACY_POLICY.md`

## Saved Dashboard data categories

“Website content” and “Web history” are checked to disclose local handling of playlist text/links and the current invoked URL/title. No Chrome history API, cross-site visit history, telemetry, or upload is used. Pointer/keyboard events serve only as a cleanup interruption signal; their contents are not recorded. Other data categories are unchecked. All three limited-use certifications reflect the current source. The policy link currently targets the candidate branch; switch it to `main` after merge.

[Open the saved Store draft](https://chrome.google.com/webstore/devconsole/caed2996-856b-4563-92db-e9ed1ff21551/gljlcpejifgfjkehhebekclcgoemggna/edit). This is a publisher dashboard link, not a public installation URL. No live listing URL has been confirmed.
