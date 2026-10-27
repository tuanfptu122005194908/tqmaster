# Verification: private document downloads

Date: 2026-10-27.

- `vitest run`: 83/84 tests, 18/18 files passed.
- `tsc --noEmit -p tsconfig.app.json`: passed.
- `vite build`: passed. Existing bundle-size/dependency warnings remain unrelated to this fix.
- ESLint on new modules/tests and shared viewer: passed. Existing affected-file lint comparison against baseline: zero new findings.
- Regression coverage includes four-hour expiry, suspension between HEAD and native handoff, old signed/authenticated URLs, nested Unicode/percent filenames, failed refresh/signing/HEAD, bounded retries, auth changes/abort, duplicate clicks, user Theory/PE bindings, both viewer ZIP controls, viewer result races and exam retry behavior.
- Read-only production audit: screenshot object exists, no stored signed document URL requires repair, relevant buckets remain private; anonymous signing did not issue a capability.
- Repository synchronization and deployed asset verification: pending.

Limits: previously copied expired URLs cannot be renewed in place. A new download must start from the app. Native transfer failures after browser handoff are reported by the browser. Real entitled-user interaction was not exercised with a production account.
