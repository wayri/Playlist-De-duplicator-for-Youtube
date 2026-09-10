# Changelog

## 1.3.0 — 2026-09-06

- Added comprehensive GitHub repository documentation, contributor/security/support policies, CI validation, issue/PR templates, release packaging scripts, offline installation guide, and automated GitHub Release packaging.
- Adopted source-available dual licensing: PolyForm Noncommercial 1.0.0 for code and CC BY-NC 4.0 for documentation/original media.
- Redesigned popup around a guided Scan → Review → Clean flow.
- Added current-playlist context, scan-state badge, and clearer full-scan recommendation.
- Reworked duplicate groups into selectable cards with playlist-position chips.
- Highlights which occurrence will be preserved when using Keep First/Keep Last.
- Added live cleanup preview showing exactly how many extra copies and groups will be changed.
- Moved CSV/report tools into an uncluttered advanced section.
- Added a clean-playlist success state and clearer partial-scan warnings.
- Improved accessibility, keyboard focus styling, disabled states, and scroll behavior.
- Preserved the privacy-minimal permission model: activeTab, scripting, storage only.

## 1.2.0 — 2026-09-03

### Added

- Selective cleanup by duplicate group.
- Keep-first or keep-last playlist occurrence.
- Duplicate playlist positions.
- Search and sort duplicate groups.
- Selected-group and selected-copy counters.
- CSV export without requesting the Chrome downloads permission.
- Skipped/unidentified playlist-entry diagnostics.
- Shortcut from a YouTube watch-with-playlist page to the dedicated playlist page.
- Post-removal verification result and per-group failure details.
- Persisted local UI preferences.
- Chrome Web Store publication/privacy/testing documentation.
- New independent duplicate-list icon to avoid resembling the YouTube logo.

### Changed

- Renamed for publication branding to **Playlist Deduper for YouTube™**.
- Replaced persistent YouTube host access with the narrower `activeTab` + `scripting` model; the helper is injected only when the user invokes the extension.
- Expanded scan metadata and stale-playlist state handling.
- More explicit confirmation text and removal count.

## 1.0.0

- Initial exact-video-ID duplicate scan.
- Full lazy-load scan.
- Copyable report.
- Keep-first cleanup.
- Conservative localized remove-menu detection.
- Rate limiting and stop control.
