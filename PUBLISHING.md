# Chrome Web Store Publishing Plan

This repository is prepared around **v1.3.0** and a narrow single purpose: exact YouTube playlist duplicate discovery/review/cleanup.

## 1. GitHub/public project setup

- Publish this repository.
- Enable Issues.
- Enable private vulnerability reporting if available.
- Add repository description and topics.
- Host the privacy policy at a stable public URL (the GitHub-rendered policy can be linked from a project site; confirm Store acceptance at submission time).
- Add live extension screenshots to `store-assets/` after testing.

## 2. Publisher decisions

- Choose the Chrome Web Store publisher/developer name.
- Choose a monitored support/privacy contact.
- Decide whether to offer separate commercial licenses for the source-available code.

## 3. Developer account

- Register/maintain a Chrome Web Store developer account.
- Complete the current registration/payment requirements shown by the Dashboard.
- Enable required account security such as 2-step verification.
- Keep publisher contact details current.

## 4. Production test before upload

Complete `TEST_PLAN.md` on the exact commit that will be submitted.

Minimum live tests:

- no-duplicate playlist;
- one 2-copy duplicate group;
- one 3+ copy duplicate group;
- multiple duplicate groups;
- long lazy-loaded playlist;
- keep first and keep last;
- selective cleanup;
- cancellation;
- uneditable/public playlist failure safety;
- current YouTube default UI language;
- every additional locale claimed as supported;
- watch-with-playlist routing;
- CSV/report generation.

## 5. Package validation

Before each Store upload:

- increment `manifest.json.version`;
- run `npm test`;
- confirm Manifest V3;
- confirm only `activeTab`, `scripting`, `storage` permissions;
- confirm there are no persistent host permissions;
- confirm no remote JavaScript, `eval`, `new Function`, or dynamic code loading;
- confirm `manifest.json` is at ZIP root;
- exclude source-only/docs/test/local files from Store ZIP.

Use `scripts/package.ps1` or `scripts/package.sh`.

## 6. Store listing

Use `STORE_LISTING.md` as the source copy and `docs/CHROME_WEB_STORE.md` for the rationale.

Prepare actual current-build screenshots and promotional assets described in `store-assets/README.md`.

## 7. Privacy tab

Disclose the extension's handling accurately:

- it processes YouTube playlist page content locally;
- it does not send playlist contents to the developer/third parties;
- no OAuth/authentication;
- no analytics or ads;
- local preference storage only;
- no remote code.

Review the Store Dashboard's exact current category wording at submission time rather than relying on old screenshots/guides.

## 8. Submission

- Upload the runtime Store ZIP as a draft.
- Resolve automated validation/installation warnings.
- Fill listing/privacy/distribution sections.
- Add reviewer notes from `STORE_LISTING.md`.
- Submit for review.

## 9. After approval

- Tag the exact approved source commit.
- Keep the exact submitted ZIP.
- Monitor GitHub issues/support for YouTube DOM regressions.
- Keep future Store features within the single purpose.
- Run a periodic smoke test even without code changes because YouTube UI changes independently.
