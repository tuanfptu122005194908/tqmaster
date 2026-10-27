# Plan: Refresh private document downloads

Status: Active — user approved implementation and deployment.

1. Audit every Theory/PE download and preview action. Inspect the screenshot object and stored URL formats read-only; distinguish expired tokens from missing objects or RLS failures.
2. Add a canonical current-project Storage URL resolver that recognizes signed URLs and safely strips transient query tokens. Extend the shared signer with explicit fresh-sign behavior, correct expiry validation, and error propagation instead of stale/private-URL fallback.
3. Add a shared attachment-download action/component: mint a new short-lived URL with a safe filename on click, show pending/error/retry state, prevent duplicate clicks, and start browser-native attachment handling without a new browsing tab.
4. Integrate all user Theory/PE, preview ZIP, and admin original-file actions. Preserve canonical data in state and separate temporary preview URLs.
5. Refresh viewer image URLs at open/retry with request version guards and a bounded retry. Clear cached signing results on auth identity changes; preserve current RLS and purchased-course checks.
6. Add targeted unit/UI regressions using fake clocks and delayed/failed sign requests. Verify missing-file/permission paths and native-download URL/filename handling without exporting real file contents.
7. Run full checks, update the knowledge graph, commit, synchronize both repositories, and verify the production bundle includes the new download mechanism.

Important limits: previously copied signed links expire by design and cannot be repaired in place; users must initiate a new download from the app. Browser/network failures after a native transfer starts are handled by the browser's download manager. The app must never intentionally navigate to an expired/private fallback URL.
