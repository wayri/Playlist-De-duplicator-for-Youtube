# Test Plan — Playlist Deduper v1.3.0

Complete this checklist on the exact release commit before Chrome Web Store submission.

## A. Static validation and installation

- [ ] `npm test` passes.
- [ ] `manifest.json` parses as valid JSON.
- [ ] `manifest_version` is 3.
- [ ] Manifest version matches the intended release.
- [ ] Extension loads unpacked without warnings/errors.
- [ ] Popup opens on non-YouTube pages and explains what to do.
- [ ] Popup opens on YouTube without requesting persistent host access.
- [ ] Version shown in the UI matches manifest.

## B. Navigation/context

- [ ] Dedicated `/playlist?list=...` page is recognized.
- [ ] `/watch?...&list=...` page offers “Open dedicated playlist page”.
- [ ] Shortcut preserves the playlist ID.
- [ ] Ordinary YouTube page remains disabled rather than attempting a scan.
- [ ] Switching playlists through YouTube SPA navigation does not reuse stale results.
- [ ] Reloading the extension + refreshing tab restores normal messaging.

## C. Scan correctness

- [ ] No-duplicate playlist reports zero duplicates and clean-state UI.
- [ ] Two copies of one video => one group / one extra copy.
- [ ] Three copies => one group / two extra copies.
- [ ] Multiple duplicate groups produce correct totals.
- [ ] Same title with different video IDs is **not** treated as duplicate.
- [ ] Positions are 1-based and match playlist order.
- [ ] Unidentified/private placeholder is counted as skipped.
- [ ] Scan loaded is clearly shown as partial/quick.
- [ ] Full scan lazy-loads a long playlist.
- [ ] Full scan returns viewport to top.
- [ ] Stop during loading exits cleanly.

## D. Review UI

- [ ] Guided Scan → Review → Clean state is understandable.
- [ ] Duplicate cards show title, ID, count and positions.
- [ ] Keep marker moves correctly between first and last modes.
- [ ] Search filters by title.
- [ ] Search filters by video ID.
- [ ] Sort by repeat count.
- [ ] Sort by playlist order.
- [ ] Sort by title.
- [ ] Select all / none.
- [ ] Individual group checkboxes.
- [ ] Selected group/copy counts update correctly.
- [ ] Cleanup preview matches selection.
- [ ] Changing selection resets confirmation.
- [ ] Changing keep mode resets confirmation.
- [ ] Keep/sort preferences survive popup close/reopen.
- [ ] Keyboard focus is visible.
- [ ] Long duplicate lists scroll without breaking popup layout.

## E. Report/export

- [ ] Copy report contains playlist metadata, counts, selection state, positions, IDs, URLs.
- [ ] CSV exports without `downloads` permission.
- [ ] CSV quotes commas and double quotes correctly.
- [ ] Exported filename is safe on Windows/macOS/Linux.
- [ ] No report is transmitted externally by the extension.

## F. Removal safety — disposable playlist only

- [ ] Remove button disabled before scan.
- [ ] Remove button disabled with nothing selected.
- [ ] Remove button disabled until final confirmation checked.
- [ ] Selecting one group changes only that group.
- [ ] Keep first preserves earliest occurrence.
- [ ] Keep last preserves latest occurrence.
- [ ] 3+ copies reduce to one, never zero.
- [ ] Every successful click is verified by matching-renderer count reduction.
- [ ] Failure to recognize removal menu leaves item untouched.
- [ ] Uneditable playlist fails safely.
- [ ] Stop prevents additional groups/actions from starting.
- [ ] Final scan reflects remaining duplicates.
- [ ] No fixed menu-index behavior exists.

## G. Store/security/privacy

- [ ] No external executable script references.
- [ ] No `eval`, `new Function`, or remotely fetched executable code.
- [ ] No analytics/tracking requests.
- [ ] No credentials/API keys/secrets in package.
- [ ] No persistent host permission.
- [ ] `activeTab` used only after user invocation.
- [ ] `scripting` injects only packaged helper code.
- [ ] `storage` is local UI preferences only.
- [ ] Privacy policy matches current behavior.
- [ ] Store screenshots match shipping version.
- [ ] License/notice files present in source repository/release.
