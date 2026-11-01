# Architecture

## Overview

Playlist Deduper is a deliberately small Manifest V3 extension with two execution contexts:

```text
┌───────────────────────────────┐
│ Chrome extension popup        │
│ popup.html / popup.css / js   │
│                               │
│ - workflow UI                 │
│ - selections                  │
│ - local preferences           │
│ - report / CSV export         │
└──────────────┬────────────────┘
               │ chrome.tabs.sendMessage
               │
               ▼
┌───────────────────────────────┐
│ Injected page helper          │
│ content.js                    │
│                               │
│ - page context                │
│ - lazy loading                │
│ - DOM scanning                │
│ - exact-ID grouping           │
│ - visible-menu removal        │
│ - progress / verification     │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│ Current YouTube playlist DOM  │
└───────────────────────────────┘
```

There is no service worker, backend, YouTube API integration, remote configuration, or remote executable code.

## Why `activeTab` + `scripting`

The extension does not declare a persistent `https://www.youtube.com/*` host permission.

When the user explicitly opens/invokes the extension on the current tab, `activeTab` provides temporary access. `popup.js` uses `chrome.scripting.executeScript` to inject the packaged `content.js` helper if needed.

This keeps site access tied to direct user intent and reduces the scope of persistent browsing access.

## Popup responsibilities

`popup.js` owns presentation/session state:

- determines the active tab and page context;
- ensures the helper is injected;
- requests loaded/full scans;
- stores duplicate-group selection in memory;
- renders cards, counts, filters, sorting, keep markers, and diagnostics;
- resets confirmation if the planned operation changes;
- stores non-sensitive UI preferences in `chrome.storage.local`;
- creates report text and CSV locally;
- sends cleanup/cancel requests;
- renders progress events from the helper.

The popup intentionally does not implement YouTube DOM manipulation.

## Content-script responsibilities

`content.js` is an IIFE injected into the active YouTube tab. It owns page state:

- playlist ID tracking;
- scan cache invalidation across YouTube SPA navigation;
- lazy loading;
- renderer inspection;
- video ID extraction;
- duplicate grouping;
- menu discovery;
- conservative remove-action recognition;
- per-action verification;
- cancellation;
- progress events.

## Duplicate identity

The duplicate key is the exact YouTube video ID extracted from links inside `ytd-playlist-video-renderer`.

For each identified entry the helper records:

```text
videoId
video title
DOM index
1-based playlist position
href
```

Entries without a usable ID are separated into `skippedEntries`.

Groups are built with a `Map<videoId, group>` and become duplicate groups only when `count > 1`.

## Scan result model

A scan contains approximately:

```text
playlistId
playlistTitle
totalCount
identifiedCount
uniqueCount
duplicateCount
duplicateGroupCount
skippedCount
skippedPositions
largestGroupCount
groups[]
scanMode
scannedAt
```

Each group contains:

```text
videoId
title
count
positions[]
url
```

The popup keeps the scan in memory. It is not written to persistent storage.

## Lazy loading

A full scan repeatedly scrolls to the document bottom and watches the count of `ytd-playlist-video-renderer` elements.

Loading stops when:

- the count remains stable for several rounds;
- the user cancels; or
- a hard loop limit is reached.

The hard limit prevents an unexpected YouTube DOM state from creating an unbounded loop.

## Removal algorithm

Conceptually, for each selected video ID:

```text
find all matching renderers
choose first or last as survivor
for every other matching renderer:
    scroll item into view
    find its action-menu button
    open menu
    enumerate visible menu-service items
    require one exact English current-playlist removal command
    if no confident match: abort that action
    click match
    wait
    verify renderer count decreased
```

A cleanup request includes the reviewed scan token and playlist ID. The helper holds a tab-owned operation lock, records renderer identities and video IDs in order, fixes a survivor for every selected group, and revalidates them before each click. Trusted pointer or keyboard activity interrupts cleanup. Existing or ambiguous menus are rejected; popup identity and available aria-controls ownership are checked. Without aria-controls, association still depends on timing and absence of intervening interaction, and requires live compatibility testing. The expected snapshot is advanced only after one verified target removal. A changed snapshot or first failure stops further actions. Reopening the popup retrieves operation status and exposes Stop.

## Message protocol

The popup and injected helper communicate with `chrome.runtime` / tab messages. Progress is emitted as `YTPD_PROGRESS` events so the popup can update loading/removal state without polling.

When changing message types, update both contexts and test older injected-helper state during extension reloads.

## State lifetime

- **Popup state:** destroyed when the popup closes.
- **Injected helper state:** lives in the YouTube tab until navigation/page lifecycle removes it.
- **Persistent extension state:** only UI preferences in `chrome.storage.local`.

This design intentionally avoids persistent scan history.
