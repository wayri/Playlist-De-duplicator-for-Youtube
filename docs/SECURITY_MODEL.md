# Security and Safety Model

This extension performs destructive actions on user-managed playlists, so “security” includes both conventional extension security and protection against accidental playlist modification.

## Assets to protect

- Correct contents/order of the user's playlist.
- User expectation that only reviewed duplicate groups are changed.
- Browsing/page data visible in the invoked tab.
- Extension execution integrity.

## Trust boundaries

### Trusted

- Packaged extension code installed by the user.
- Chrome extension APIs.
- Explicit user selections and confirmation in the popup.

### Untrusted / unstable

- YouTube's current DOM structure.
- YouTube menu ordering.
- Localized YouTube menu text not explicitly recognized.
- Page timing/lazy-loading behavior.
- Future YouTube SPA updates.

## Major failure modes and mitigations

### Wrong video identified as duplicate

**Risk:** removing an unrelated playlist entry.

**Mitigation:** duplicate identity uses exact video ID, not title similarity.

### Wrong menu command clicked

**Risk:** a menu entry such as save, share, move, or another future action is activated.

**Mitigation:** visible menu items are searched by conservative text patterns for removal. The code does not use a hard-coded item index. Failure to recognize the command aborts that action.

### Every copy removed

**Risk:** selected video disappears entirely.

**Mitigation:** the algorithm chooses an explicit survivor (first or last) and targets only the other matching renderers.

### DOM changes after scan

**Risk:** stale positions/elements cause wrong operations.

**Mitigation:** removal re-queries renderers by exact video ID while the DOM changes, and each click is verified by a renderer-count reduction.

### Accidental click

**Risk:** user scans and unintentionally starts removal.

**Mitigation:** destructive action is disabled until groups are selected and a separate confirmation checkbox is checked. Selection/keep-mode changes reset confirmation.

### Overbroad browsing access

**Risk:** extension can inspect unrelated browsing activity.

**Mitigation:** no persistent host permission; temporary `activeTab` access is tied to explicit invocation.

### Data exfiltration

**Risk:** playlist/page content is sent elsewhere.

**Mitigation:** no backend, telemetry, analytics SDK, OAuth integration, or remote report upload. Scan data remains local and ephemeral.

### Remote code substitution

**Risk:** external JavaScript changes after Store review.

**Mitigation:** executable JavaScript is packaged with the extension. CI/static checks reject obvious remote script tags and dynamic code constructs.

## Residual risk

No DOM-driven automation can guarantee compatibility with a frequently changing third-party web application. YouTube can change markup, menu wording, timing, or interaction behavior without notice.

The design goal is therefore not “never break”; it is **break safely**:

- scanning may fail;
- menu detection may fail;
- an item may be skipped;

but an unrecognized state should not be converted into a guessed destructive click.
