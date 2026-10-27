# Plan: Admin data integrity and performance

**Status**: Implemented after user approval; see verification.md for evidence and release status.

## Architecture and data flow

1. Establish the canonical commerce contract: global net revenue is `SUM(final_amount)` for all approved orders; time-based analysis retains `created_at` attribution, now with explicit Vietnam calendar boundaries. `reviewed_at` is not silently substituted.
2. Add admin-only SQL aggregate functions for commerce summary, period series, subject sales, and exam answer statistics. Use a shared summary across Dashboard and Orders. Return small typed payloads; keep list/detail reads separate. Review RLS/security and grants for every new endpoint.
3. Add typed query functions/hooks using the existing React Query provider. Query keys include authorization identity and period/filter parameters. Realtime invalidation is debounced and in-flight queries are shared. Clear account-scoped cached admin data on sign-out/account changes.
4. Render Dashboard summary/recent/chart/ranking independently. Remove the sequential 150-order-ID item waterfall from its blocking path. Keep current theme and responsive layout.
5. Correct list pagination/filtering/counts on the remaining admin database routes. Use complete cursors only for exports, reference lists, and operations that genuinely need all rows. Avoid replacing capped one-shot reads with unbounded all-table downloads on every page.
6. Repair backup pagination using complete stable keys, explicit errors, and termination on empty pages. Composite-key tables need lexicographic cursor predicates or a proven stable paginated alternative. Excel must use the same complete read guarantees.
7. Preserve the already robust Users loader and tests. Document the local Reviews source. Improve read-failure state for Settings and backup history without expanding into unrelated business write logic.

## Server-side details

- Use PostgreSQL numeric aggregation; serialize consistently and format VND only at the presentation boundary.
- Global summary must aggregate the approved count and approved amount from a consistent snapshot. Handle the empty dataset with explicit zero values on successful responses only.
- Calendar buckets use `Asia/Ho_Chi_Minh` and `[start, end)` intervals; generate empty buckets on the server. Monthly buckets include year, annual history covers all recorded years.
- Keep gross subject sales separate from net order revenue. If net allocation is exposed, allocate proportional shares over existing item prices, distribute VND rounding remainders deterministically by item ID, and report orders with missing detail as unallocated. Do not rewrite historical item prices.
- Count unique exam IDs for global exam statistics; subject-level grouping can still show a shared exam under each relevant subject.
- Capture `EXPLAIN (ANALYZE, BUFFERS)` on representative reads. Consider `(created_at DESC, id DESC)`, `(status, created_at DESC, id DESC)`, and item join indexes only after inspecting actual index definitions and plans.

## Implementation order

1. Focused financial/calendar regressions and SQL contracts.
2. Commerce aggregate migration and typed client queries.
3. Dashboard/Orders integration and progressive rendering.
4. Subject totals and exam-statistics correctness.
5. Remaining admin read pagination and error states.
6. Backup/export completeness and realtime/cache integration.
7. Validation, graph refresh, semantic commit, and the repository's dual-remote push workflow once implementation is complete.

## Risks and verification

- Local migrations do not prove which schema/index/RLS changes are deployed. Inspect the target database read-only before applying migration or reporting live reconciliation.
- No authenticated production browser/database session was used in this audit. Real revenue and production latency remain unmeasured.
- Deploy aggregates before switching client consumers. Missing migrations must cause visible errors, not a silent fallback to capped financial totals.
- Offset pagination can shift under concurrent writes. Cursor ordering must include a unique tie-breaker; exports need an explicit consistency policy rather than a promise of transactional snapshots across unrelated HTTP requests.
- Large admin lists need server pagination; complete full-table cursor reads belong to deliberate exports/reference operations.
- Existing subject deletion can remove order-item detail while preserving order totals; report this discrepancy instead of inventing item history.
- Baseline on 2026-10-26: 7 test files / 33 tests passed; production build passed. Four controlled reproductions confirm current Dashboard defects. Build output includes a 434.02 kB Dashboard chunk (116.24 kB gzip), which is a secondary cold-load cost; runtime data transfer and latency still need measurement.
