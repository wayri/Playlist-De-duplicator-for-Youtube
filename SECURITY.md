# Security Policy

## Supported versions

Security fixes are targeted at the latest released version and the current default branch.

## What counts as a security-sensitive issue

Examples include:

- A path that can make the extension click the wrong YouTube menu action.
- A bug that can remove the final/only copy of a selected video unexpectedly.
- Code injection, XSS, or execution of remote/untrusted code in extension pages.
- Unexpected access to pages beyond the user-invoked tab.
- Leakage or transmission of playlist/page content contrary to the privacy policy.
- A dependency or packaging change that introduces executable remote code.

Ordinary selector breakage that simply causes scanning/removal to stop is usually a compatibility bug, not a security issue.

## Reporting

Please avoid posting exploit details publicly before the maintainer has had a chance to assess the issue.

Use GitHub's private security-reporting feature if it is enabled for the repository. If private reporting is not enabled, contact the repository owner through GitHub and ask for a private reporting channel before sharing sensitive reproduction details.

## Design principles

The extension is built around least privilege and fail-closed destructive actions:

- no persistent YouTube host access;
- no OAuth/API token handling;
- no external backend or analytics SDK;
- no remote executable code;
- conservative matching of the visible removal command;
- explicit user confirmation;
- post-action verification.

See `docs/SECURITY_MODEL.md` for the complete threat model.
