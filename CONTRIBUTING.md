# Contributing

Thanks for helping improve Playlist Deduper for YouTube™.

## Project scope

The extension has one narrow purpose: **find, review, and safely remove exact duplicate entries from YouTube playlists**.

Contributions should support that purpose. Broad YouTube downloading, ad blocking, channel analytics, account automation, unrelated playlist organization, scraping, or other unrelated features are intentionally out of scope for the Chrome Web Store build.

## Before opening a change

For substantial features, open an issue first so the behavior, safety implications, and Store-permission impact can be discussed before implementation.

Small fixes, documentation corrections, selector updates, translations for the safe removal matcher, and accessibility improvements can usually go straight to a pull request.

## Development setup

No bundler or framework is required.

1. Clone the repository.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Load the repository root as an unpacked extension.
5. After code changes, use the extension card's **Reload** button and refresh the YouTube test page.
6. Run `npm test` before opening a pull request.

See `docs/DEVELOPMENT.md` for details.

## Safety requirements

Any change that can modify a playlist must preserve these invariants:

1. **No fuzzy duplicate deletion.** Destructive decisions must be keyed to exact video IDs.
2. **One survivor.** A selected duplicate group must never be reduced to zero copies.
3. **Explicit user intent.** Cleanup requires a reviewed selection plus the final confirmation control.
4. **Fail closed.** If the correct YouTube removal command cannot be identified, do not click another menu item as a fallback.
5. **Verify changes.** After each removal action, confirm the number of matching renderers decreased.
6. **Allow cancellation.** Long-running loads/removals must remain cancellable.
7. **No silent permission expansion.** New permissions require a documented need and maintainer approval.
8. **No remote executable code.** Store builds must remain self-contained.

## Coding style

- Plain modern JavaScript; no transpilation is currently required.
- Prefer small named functions over deeply nested anonymous callbacks.
- Treat DOM selectors as unstable external interfaces and isolate them where practical.
- Keep popup logic presentation-oriented; keep page/YouTube operations in `content.js`.
- Avoid adding dependencies unless they solve a material problem that cannot be handled cleanly in a few lines.
- Do not add telemetry by default.

## Testing a pull request

At minimum:

- Run `npm test`.
- Load unpacked without manifest warnings.
- Test a no-duplicate playlist.
- Test two copies of one video.
- Test 3+ copies.
- Test both keep-first and keep-last on a disposable playlist if removal logic changed.
- Test selective cleanup if selection/removal logic changed.
- Test cancellation if asynchronous control flow changed.

Changes to `content.js` removal selectors or text matching should run the full `TEST_PLAN.md` checklist before release.

## Pull requests

A good PR description includes:

- What changed.
- Why it changed.
- User-visible behavior before/after.
- Permissions/privacy impact.
- Tests performed.
- Screenshots for UI changes.
- Any assumptions about the current YouTube DOM.

## License of contributions

By intentionally submitting a contribution to this repository, you agree that your contribution may be distributed under the repository's applicable license described in `LICENSE.md`.
