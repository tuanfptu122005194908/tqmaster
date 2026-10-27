# Verification: private document downloads

Date: 2026-10-27.

- `vitest run`: 83/84 tests, 18/18 files passed.
- `tsc --noEmit -p tsconfig.app.json`: passed.
- `vite build`: passed. Existing bundle-size/dependency warnings remain unrelated to this fix.
- ESLint on new modules/tests and shared viewer: passed. Existing affected-file lint comparison against baseline: zero new findings.
- Regression coverage includes four-hour expiry, suspension between HEAD and native handoff, old signed/authenticated URLs, nested Unicode/percent filenames, failed refresh/signing/HEAD, bounded retries, auth changes/abort, duplicate clicks, user Theory/PE bindings, both viewer ZIP controls, viewer result races and exam retry behavior.
- Read-only production audit: screenshot object exists, no stored signed document URL requires repair, relevant buckets remain private; anonymous signing did not issue a capability.
- Implementation commit: `58e5d667d1e407258c9dba9564a78d7e4eaadca4`, synchronized to `origin/main` and `tqmaster/main`.
- Production: `https://tqmaster.vercel.app` now serves entry `index-HRe7wo5R.js` and viewer `ExamImageViewerModal-BEVkejTo.js`. Public bundle checks confirm fresh attachment signing, HEAD availability checks, the native download context and in-page pending/retry state.
- Baseline production entry was `index-BSXVXvC4.js`; all four new download markers were absent before deployment and present afterward.
- Both `SubjectDetailPage-DBTI5hO3.js` and `AdminTheory-DASnqvYK.js` returned HTTP 200 and reference the updated shared viewer/download module.
- The release also includes the preview retry/version guards and all canonical file-action integrations tested above. No database migration or Storage policy deployment was needed.

Limits: previously copied expired URLs cannot be renewed in place. A new download must start from the app. Native transfer failures after browser handoff are reported by the browser. Real entitled-user interaction was not exercised with a production account.
