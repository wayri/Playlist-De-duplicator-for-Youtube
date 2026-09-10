# FAQ

## Does it use the YouTube Data API?

No.

## Do I need a Google API key or OAuth consent?

No.

## Does it upload my playlist?

No. Playlist scanning and duplicate grouping are local to the browser.

## Does it permanently read all YouTube pages?

No. The extension uses `activeTab` plus `scripting` rather than a persistent YouTube host permission.

## Can it clean playlists I do not own?

It can scan visible playlist content, but removal requires YouTube to expose an edit/removal action in the signed-in session. It is designed to fail safely when editing is unavailable.

## Can it detect reuploads of the same underlying content?

No. It intentionally detects only exact repeated video IDs. Content-similarity detection would introduce false-positive risk and broaden the extension's purpose substantially.

## Why is full scan slower than a script that reads the current DOM once?

YouTube lazy-loads long playlists. Full scan scrolls until the renderer count stabilizes before grouping entries.

## Why is removal rate-limited?

Because the extension uses YouTube's visible UI and verifies each action. Slower sequencing reduces race conditions and makes cancellation/diagnostics more meaningful.

## Why doesn't it just call an internal YouTube endpoint?

The project avoids relying on private deletion APIs, tokens, undocumented request structures, or account credentials. It operates the same visible playlist controls available to the user.

## Why is the project called source-available rather than open source?

The code license restricts commercial use. OSI-defined open source licenses must permit use in business/commercial fields, so a non-commercial restriction is incompatible with that definition.

## Can I use it commercially?

Not under the repository's PolyForm Noncommercial license. Contact the repository owner for commercial licensing.

## Can I fork it?

For permitted non-commercial purposes, yes, subject to the code license and notices. Documentation/media are separately under CC BY-NC 4.0.
