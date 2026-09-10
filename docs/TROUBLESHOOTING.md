# Troubleshooting

## The popup says to open a playlist

Open a dedicated YouTube playlist URL containing `/playlist?list=...`.

If you are on a video watch page with `&list=...`, use the popup shortcut to open the dedicated playlist view.

## Scan finds fewer videos than the playlist has

Use **Scan full playlist**, not **Scan loaded**.

If the count is still low:

1. refresh the YouTube page;
2. manually scroll partway through the playlist once;
3. run the full scan again;
4. check whether YouTube is showing an error/continuation spinner that never resolves.

## Duplicate titles are not grouped

This may be correct. The extension groups only identical **video IDs**. Two uploads with the same title are intentionally treated as different videos.

## Private/deleted videos are skipped

If a placeholder does not expose a video ID, the extension will not infer identity from its text/position. This is a safety choice.

## Remove button stays disabled

Confirm that:

- a scan has found duplicate groups;
- at least one group is selected;
- the final confirmation checkbox is checked;
- no scan/removal operation is currently running.

Changing keep mode or selection resets final confirmation.

## “Could not safely identify the Remove from playlist action”

YouTube's current menu text or DOM likely differs from the patterns supported by this build.

Do not repeatedly click or modify the source to choose a fixed menu index.

Please report:

- extension version;
- YouTube UI language;
- exact visible wording of the removal menu command;
- browser version;
- whether the menu appears inside the playlist row normally.

Use a disposable playlist for any manual debugging.

## Menu cannot be found

YouTube may have changed the renderer's menu-button markup.

Refresh the page, retry once, and if it persists file a compatibility issue with the details requested in `SUPPORT.md`.

## Operation was stopped but one more item disappeared

Cancellation prevents new work from starting, but a YouTube menu click that already occurred may finish asynchronously.

The final scan is the source of truth after cancellation.

## Popup stopped responding after reloading the extension

Existing YouTube tabs may still have an old injected helper/message context.

Refresh the YouTube tab after reloading the extension.

## CSV does not open correctly

The file is standard comma-separated UTF-8 text with quoted fields where needed. Import it explicitly as CSV in your spreadsheet application if automatic delimiter detection is wrong for your locale.

## Extension works today and breaks tomorrow

YouTube can roll out DOM changes and A/B tests without an extension update. See `SELECTORS_AND_COMPATIBILITY.md`.
