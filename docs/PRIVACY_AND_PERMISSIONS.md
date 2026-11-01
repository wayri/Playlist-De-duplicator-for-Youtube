# Privacy and Permissions

## Permission inventory

### `activeTab`

Provides temporary access to the tab where the user explicitly invokes the extension. This avoids persistent permission to inspect all YouTube tabs/pages.

### `scripting`

Allows the popup to inject the packaged `content.js` helper into the temporarily authorized active tab.

The extension does not download or inject remote JavaScript.

### `storage`

Stores only local UI preferences, currently keep-first/keep-last and duplicate-list sort order.

## What page data is processed

On an invoked YouTube playlist page the helper may read:

- current URL and playlist ID;
- playlist title;
- visible/lazy-loaded playlist renderer nodes;
- video IDs;
- video titles;
- playlist positions;
- visible menu-item text required to identify the removal command.

This data is used to implement the extension's disclosed purpose.

## What is persisted

Playlist scans are held only in extension/tab memory for the active session. They are not written to Chrome storage by the extension.

Only UI preferences are persistently stored in extension storage. When requested, reports can also be copied to the clipboard or saved as CSV files under the user's control.

## What is transmitted

The extension itself transmits no playlist content, scan results, telemetry, analytics, or account information to the developer or a third party.

YouTube itself naturally receives normal browser interactions when its page is loaded and when its own visible playlist menu is used.

## Authentication

The extension does not handle Google credentials, cookies, OAuth tokens, or YouTube API keys. It relies on the existing signed-in browser session and visible controls supplied by YouTube.

## Future features

Any future feature requiring broader data access, persistent history, cloud sync, analytics, or additional host permissions must update:

- `manifest.json`;
- this document;
- `PRIVACY_POLICY.md`;
- Chrome Web Store privacy declarations;
- relevant tests and release notes.
