# YouTube Selectors and Compatibility

YouTube's web UI is not a stable public API. Treat every selector and visible menu string as compatibility code.

## Current primary renderer

The scanner currently targets:

```text
ytd-playlist-video-renderer
```

Video identity is extracted from links such as:

```text
a#video-title
a[href*="watch?v="]
a[href*="/shorts/"]
```

A usable `/watch?v=...` or `/shorts/...` ID is required for exact duplicate grouping.

## Playlist title fallbacks

The helper checks multiple header/meta candidates and finally falls back to the document title.

This is non-destructive metadata; adding reasonable fallbacks here is low risk.

## Menu-button discovery

Several menu-button selector variants are attempted because YouTube has historically changed wrapper elements and accessibility markup.

The important invariant is that menu discovery is scoped to the target playlist renderer.

## Removal menu discovery

After opening a renderer menu, the helper enumerates visible `ytd-menu-service-item-renderer` elements within known popup/dropdown containers.

It then checks normalized visible text against a conservative list of anchored patterns for languages explicitly represented in the code.

## Rules for adding a language

Do not add a translation based only on machine translation.

Prefer:

1. observe the exact current YouTube menu text in that language;
2. capture enough context to distinguish “Remove from playlist” from unrelated deletion/removal actions;
3. use an anchored pattern where practical;
4. test on a disposable playlist;
5. document the language in the PR.

## What not to do

Never replace semantic matching with:

- “click the third menu item”;
- `menuItems[n]` based on current ordering;
- a broad pattern such as `/delete|remove/i` with no contextual guard;
- global menu-button selection not scoped to the intended renderer;
- title-only matching of the playlist item being removed.

## Diagnosing a break

If scanning fails:

- confirm the playlist renderer tag changed;
- inspect title/video-link structure;
- compare dedicated playlist vs watch-with-playlist DOM.

If cleanup fails closed:

- inspect the target renderer's current menu button;
- inspect where YouTube mounts the popup;
- record the exact visible remove command in the active UI language;
- verify menu service items are actually visible when queried.

If cleanup clicks but verification fails:

- inspect whether YouTube updates the DOM asynchronously later than expected;
- check for toasts/undo behavior;
- confirm the matching renderer count eventually decreases;
- increase timing only with evidence rather than arbitrary long delays.

## Compatibility policy

A release should support the currently tested Chrome + YouTube layout. The project does not claim compatibility with every A/B test, every locale, or historical YouTube interface.

When uncertain, prefer skipping a destructive action over expanding matching heuristics aggressively.
