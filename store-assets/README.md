# Store Asset Checklist

The screenshot set depicts the actual extension UI with a local test playlist fixture; it is not a live account capture.

- `screenshots/01-scan.png` — scan.
- `screenshots/02-review.png` — review.
- `screenshots/03-cleanup.png` — cleanup.
- `icons/icon128.png` in the repository supplies the extension icon.

Review the screenshots against the shipping build and current Chrome Web Store asset requirements before submission. Do not add invented ratings, badges, download counts, or unearned claims. Use the independent duplicate-list mark and retain the trademark and non-affiliation notice in the listing.

## Capture provenance

The 1280×800 PNGs were captured by installed Chrome in headless mode from the unchanged shipping `popup.html`, CSS and JavaScript. A local HTML fixture runs the real `content.js` scanner against six sample entries (three unique IDs, two repeated groups, three extra copies). A test-only Chrome API bridge connects the two execution contexts. No YouTube account, private content, removal result, rating or Store approval is depicted. The cleanup screenshot shows the confirmation state before any removal. This is UI evidence, not live YouTube compatibility evidence.

`promo-tile.png` is an original 440×280 promotional tile using the existing independent extension icon. All screenshots and the promo tile are RGB PNGs. Store assets remain outside the runtime package. Third-party trademarks remain with their owners; original media follows the repository's CC BY-NC 4.0 terms.
