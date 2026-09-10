# Chrome Web Store Publication Guide

This document complements the root `PUBLISHING.md` checklist.

## Single purpose

Use a narrow statement consistently:

> Find, review, and safely remove exact duplicate video entries from YouTube playlists that the user opens in the browser.

New features should remain directly connected to that workflow.

## Permission rationale

### `activeTab`

Temporary access only to the tab where the user explicitly invokes the extension.

### `scripting`

Injects the packaged helper into that temporarily authorized tab. No remote executable code.

### `storage`

Persists local UI preferences only.

## Privacy positioning

Be precise rather than claiming the extension “accesses no data.” It does process page content locally because that is necessary to find duplicates.

The important distinctions are:

- local processing;
- no developer/third-party transmission;
- no analytics/advertising;
- no persistent scan storage;
- no account OAuth/API credentials.

## Listing assets

Recommended live screenshots:

1. Full playlist scan entry point.
2. Duplicate cards with positions and selected groups.
3. Keep-first / keep-last visualization.
4. Search/sort plus report export.
5. Explicit cleanup confirmation and removal count.

Do not fabricate UI that differs from the submitted build.

## Reviewer notes

Explain that removal uses the visible YouTube item menu and deliberately aborts when it cannot identify the intended command safely.

Provide a simple disposable-playlist test path if reviewer access allows editing their own playlist.

## Branding

- Keep independent extension artwork.
- Do not use or modify the YouTube play-button logo as the extension icon.
- Use compatibility wording such as “for YouTube”.
- Keep the non-affiliation and trademark notice visible in the detailed listing/support docs.

## Release discipline

For every Store update retain:

- exact submitted ZIP;
- corresponding source commit/tag;
- release notes;
- completed live-test checklist;
- screenshots used in the listing if they changed.
