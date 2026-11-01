# User Guide

## 1. What the extension removes

Playlist Deduper removes **extra playlist entries for the same exact YouTube video ID**.

It does not attempt to decide that two different uploads are “the same video” because their titles, thumbnails, audio, or content look similar. If two entries have different video IDs, they are treated as distinct.

## 2. Recommended page

Use the dedicated playlist view:

```text
https://www.youtube.com/playlist?list=PLAYLIST_ID
```

If you open the extension while watching a video with a `list=` parameter, it offers a shortcut to the dedicated playlist page. Dedicated playlist pages provide a more stable DOM for scanning and editing.

## 3. Scan modes

### Scan full playlist

Recommended before cleanup. The extension scrolls the page to trigger YouTube's lazy loading until the visible playlist item count stabilizes, then scans the loaded renderers.

Use this for long playlists. Completion is heuristic: loading caps or continuation indicators can yield a partial scan, and stabilization alone does not prove every item loaded.

### Scan loaded

Scans only items already present in the DOM. This is faster but can be incomplete if YouTube has not loaded the whole playlist.

A quick scan should be treated as a preview, not a final cleanup basis for a long playlist.

## 4. Understanding the result cards

Each duplicate group shows:

- video title;
- exact video ID;
- total copies found;
- number of extra copies;
- playlist positions;
- the position that will be kept based on your current keep mode.

Positions are 1-based and refer to the playlist order observed during the scan.

## 5. Choosing what to keep

### Keep first

Preserves the earliest occurrence in playlist order and removes later copies.

### Keep last

Preserves the latest occurrence in playlist order and removes earlier copies.

This setting refers to playlist position, not upload date or save timestamp.

## 6. Selective cleanup

Duplicate groups are selected independently. You can:

- select all;
- select none;
- check/uncheck individual groups;
- filter the list by title or video ID;
- sort by repeat count, first playlist position, or title.

The cleanup panel updates live to show the exact number of extra copies that would be removed.

## 7. Cleanup confirmation

The remove button remains disabled until:

1. a scan found duplicates;
2. at least one duplicate group is selected; and
3. the explicit confirmation checkbox is checked.

Changing the selection or keep-first/keep-last setting resets confirmation so the review cannot silently become stale.

## 8. What happens during removal

For each selected duplicate group, the page helper:

1. finds all currently loaded playlist renderers matching that exact video ID;
2. determines which occurrence to preserve;
3. scrolls an extra copy into view;
4. opens that item's visible YouTube menu;
5. searches visible menu items for a conservatively recognized “remove from playlist” command;
6. clicks only that recognized command;
7. waits for YouTube to update the page; and
8. verifies the number of matching renderers decreased.

Cleanup is bound to the reviewed playlist and scan snapshot. It stops on stale context, changed survivor or ambiguous menu. Only the exact English commands “Remove from playlist” and “Remove from <current playlist title>” are recognized.

## 9. Stop/cancel

Long loading and removal operations expose a stop control. Cancellation prevents the helper from starting additional work. An action already clicked on YouTube may still finish.

## 10. Private/deleted/unavailable entries

Some placeholders do not expose a usable video ID. These are reported as skipped/unidentified rather than treated as duplicates.

That conservative behavior avoids merging or deleting entries based only on ambiguous text.

## 11. Reports

### Copy report

Copies a readable summary containing playlist metadata, duplicate counts, selected state, positions, IDs, and video URLs.

### CSV export

Creates a CSV locally through a browser Blob/download link. The extension does not request the Chrome `downloads` permission and does not send the report anywhere. Formula-like cells are neutralized for spreadsheet safety.

## 12. After cleanup

Review the final scan. If duplicates remain, possible reasons include:

- an unselected group;
- a failed/unrecognized YouTube menu action;
- a YouTube DOM update during cleanup;
- a playlist entry loaded differently after navigation;
- a private/unavailable placeholder with no usable ID.

See `TROUBLESHOOTING.md` for recovery steps.
