# Roadmap

The Chrome Web Store version should remain tightly focused on duplicate playlist cleanup.

## Release 1.3.x — hardening

- Live-test the redesigned UI across small and large playlists.
- Expand regression coverage for YouTube layout variants.
- Add real screenshots and Store artwork.
- Improve error diagnostics without exposing private playlist data.
- Add tested localized removal patterns where contributors can verify current YouTube wording.
- Improve accessibility labels and keyboard behavior where needed.

## Candidate 1.4 features

These fit the current single purpose:

- Optional duplicate thumbnails/channel metadata when reliably obtainable from the current DOM.
- More detailed cleanup result summary (removed / skipped / failed per group).
- Local, user-triggered pre-cleanup report download as a lightweight audit record.
- “Keep occurrence nearest position …” for advanced users, if it can remain intuitive and safe.
- Better detection/reporting of unavailable placeholders without inferring unsafe identity.
- A dry-run summary that can be copied before confirmation.

## Consider later

- Optional cleanup history stored locally, with a strict privacy design.
- Undo assistance based on exported reports where YouTube behavior makes it reliable.
- Automated selector smoke tests against stored DOM fixtures.

## Explicitly out of scope for the Store extension

- Video downloading.
- Ad blocking.
- Mass account automation.
- Subscriber/channel analytics.
- Credential/token scraping.
- Remote automation services.
- Fuzzy content/reupload matching that could delete distinct videos.
- Unrelated playlist organizers that weaken the extension's single-purpose Store posture.
