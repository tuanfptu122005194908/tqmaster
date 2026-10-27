# Implementation plan

Status: Complete — approved scope implemented, both repositories synchronized and production verified on 2026-10-27.

1. Add a narrow Vercel header for content-hashed build assets, preserving security headers and SPA rewrites.
2. Make useSubjectAccess own initial reads and coalesce overlapping refreshes within the current committed identity generation. Events received while loading mark one trailing refresh; failures retain the last confirmed grants. Remove redundant startup refreshPurchased calls from AppContext, retaining explicit verification refresh.
3. Introduce selected-tab queries using TanStack Query. Keys distinguish user, subject, effective access and resource tab. Query functions propagate errors and consume cancellation signals. Query data is never authorization proof.
4. Keep canonical document metadata distinct from transient preview signatures. Request document rows and signatures only on document tabs. Display independent loading/error/retry states without waiting for unopened tabs.
5. Cancel/remove user caches on identity changes; retain only explicitly public cache entries across accounts. Existing order/result reads remain isolated and outside shared cache.
6. Test request counts, event races, stale responses, account changes, tab switches, cache reuse and errors. Run full tests, TypeScript/build and focused lint, inspect diff, refresh Graphify and commit/push both configured remotes per repository workflow.

Risks: inactive tab count badges must not imply zero before loading; FE/PT filtering must remain correct; access changes must invalidate content scope; private image signatures must remain current. Preserve original UI and existing manual refresh/retry capabilities. Short in-memory caching only; no localStorage exam cache or database changes.
