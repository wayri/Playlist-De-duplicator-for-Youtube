# Privacy Policy — Playlist Deduper for YouTube™

**Effective date:** 4 September 2026

Playlist Deduper for YouTube™ is designed to process playlist information locally in the browser while minimizing permissions and persistent data.

## Data the extension processes

When the user invokes the extension on YouTube, it may read information already present in the current playlist page that is required for duplicate-cleanup functionality. This can include:

- current YouTube page URL and playlist ID;
- playlist title;
- video titles;
- video IDs;
- playlist positions;
- visible YouTube menu text required to identify the playlist removal action.

This information is processed locally to find exact duplicate video IDs, display the review interface, and operate the visible playlist removal controls only when the user explicitly requests cleanup.

## Data stored

The extension stores only local user-interface preferences, currently:

- keep-first or keep-last selection; and
- duplicate-list sort preference.

These preferences are stored using Chrome's local extension storage on the user's device.

Playlist contents and scan results are not persistently stored by the extension.

## Data transmitted or shared

The extension does **not** transmit playlist contents, scan results, browsing activity, or usage analytics to the developer or to third parties.

The extension has no analytics service, advertising service, developer backend, or remote-code service.

Normal requests made by the YouTube website itself remain subject to YouTube/Google's own services and policies.

## Google/YouTube account access

The extension does not request Google OAuth authorization, does not use a YouTube Data API key, and does not directly handle Google Account credentials or access tokens.

Playlist modifications are performed through YouTube controls already available in the user's signed-in browser session.

## Permissions

- `activeTab`: temporary access to the tab where the user explicitly invokes the extension.
- `scripting`: injects the packaged playlist helper into that temporarily authorized tab.
- `storage`: stores the local UI preferences described above.

The extension does not request a persistent YouTube host permission.

## Data sale, advertising, and profiling

The extension does not sell user data and does not use playlist/page data for advertising, behavioral profiling, creditworthiness, or purposes unrelated to duplicate playlist cleanup.

## Retention and deletion

The only persistent data created by the extension is the local UI preference record described above. It can be removed by uninstalling the extension or clearing the extension's local storage.

## Changes to this policy

If data handling changes, this policy and applicable Chrome Web Store disclosures will be updated before the changed practice is introduced to users.

## Contact

Support and privacy questions can be raised through the project's GitHub repository at:

<https://github.com/wayri/playlist-deduper-for-youtube>

Do not post sensitive account information, cookies, tokens, or private playlist details in a public issue.

## Trademark notice

YouTube is a trademark of Google LLC. Playlist Deduper for YouTube™ is independent and is not affiliated with, endorsed by, sponsored by, or maintained by Google LLC or YouTube.
