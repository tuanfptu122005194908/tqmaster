# Validation

## Implemented behavior

- Content-hashed assets have a one-year immutable browser cache policy; HTML, API paths and non-hashed files do not match the rule.
- Concurrent access refreshes share one request. An order/online/visibility event arriving during a read produces one follow-up load. Complete pagination and Auth verification remain in loadSubjectIds.
- Auth bootstrap/login/token refresh do not redundantly invoke the hook-owned initial grants read. USER_UPDATED and explicit refresh still refresh grants.
- Subject metadata and FE/PT list require two reads when opening a purchased subject, instead of the previous four datasets plus preview signing. Theory and PE are filtered by category on the server and requested on selection. Announcements load on selection. Revisiting a fresh tab reuses the five-minute in-memory cache.
- Private keys contain user, subject, admin role, access revision and resource. Auth identity changes cancel/remove all user-prefixed queries; a revoked/regranted access scope cannot reuse an old content query. Viewers close on access changes.
- Only existing public settings and active/free subject IDs use shared public-prefixed entries, with 60-second freshness. Explicit settings refresh invalidates its entry. This is browser memory reuse, not a new shared server cache.
- No database migration or production data write is part of this change. No persistent exam cache was added.

## Checks

- `npm test -- --reporter=dot`: 18 files / 93 tests passed.
- `npx tsc --noEmit -p tsconfig.app.json`: passed.
- `npm run build`: passed; existing large-chunk/Browserslist/Bluebird warnings remain.
- ESLint for new content hook, access hook, queryClient and changed tests: passed.
- Whole modified legacy components still report existing lint: AppContext 9 any errors / 2 warnings, unchanged from HEAD; SubjectDetailPage 2 any errors versus 7 at HEAD. No unrelated legacy lint cleanup was added.
- Vercel CLI 53.1.0 bundled routing-utils `getTransformedRoutes` accepted vercel.json with no errors. Its actual `sourceToRegex` matched generated JS/font/image paths and excluded `/assets/logo.svg`, `/index.html`, `/auth` and `/api/orders`.
- `git diff --check`: passed (only normal CRLF notices).
- `graphify update .`: completed, 2,349 nodes / 3,982 edges. Existing SQL parser dependency is unavailable, so SQL contributes no new extraction; this change contains no SQL. The CLI updated the code graph, not semantic extraction of new documents.

Regression coverage includes coalesced calls, event-during-read, grant revisions, account/logout stale responses, request counts for tabs, cache reuse, retryable tab errors, private query cancellation, public-cache reuse, and canonical file downloads when thumbnails fail.

## Release

Both remote main branches matched the starting commit `3bfa0430c9fe4490f5264765d131ac4c16f69ff3` at the pre-push check. After the user explicitly authorized both destinations, main and feat/reduce-redundant-requests on both remotes were verified at `775a110f70b2fefb849f57a23b791ef9c69a2f77`. The Git-linked Vercel deployment completed successfully. No new deployment credentials were added.

Production checks on https://tuanvaquan.io.vn/ returned HTTP 200 for HTML and the updated bundles. `index-C_In7NGG.js` and `SubjectDetailPage-CrJJgqSX.js` both returned `Cache-Control: public, max-age=31536000, immutable`; HTML retained `public, max-age=0, must-revalidate`. The deployed entry contains the public query keys and purchasedRevision; the deployed subject bundle contains filtered theory/PE queries and tab-specific document/preview keys. Machine-readable results and the deployment link are recorded in `production-verification.json`. Production verification used only public asset reads, not authenticated customer data or a load test.
