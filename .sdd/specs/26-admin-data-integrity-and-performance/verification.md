# Verification and delivery

Date: 2026-10-27. Source baseline: `cd347c5`. User approved this specification before implementation.

## Implemented behavior

- Dashboard and Orders share an admin-only, full-dataset commerce aggregate and account-scoped query cache. Their revenue is approved `final_amount`, independent of chart period, list page, and API row caps.
- Summary, ten recent orders, period series, and subject ranking load independently. The Recharts module loads lazily after the page can render its summary.
- Vietnam calendar buckets use half-open intervals; months include their year and annual history includes all years. Subject ranking uses IDs, proportionally allocates net revenue with deterministic VND rounding, and explicitly reports missing item detail.
- Exam answer statistics aggregate in PostgreSQL, count shared exams once globally, retain empty exams, and avoid a correlated scan for every question.
- Management reference datasets and per-exam editors use complete ordered ID cursors, preserving existing local search/filter behavior. These metadata reads are intentionally distinct from financial/history aggregates; they can still grow with catalog size.
- Errors are visible with retry. Settings cannot save after a failed initial load. Request versions protect metadata selections and order detail. Failed competing-order reads stop access-revocation actions; subject-copy source reads complete before writes begin.
- Local snapshots, background backup, and Excel exports use complete primary/composite-key cursors and reject partial database exports. Realtime and restore events invalidate shared analytics; browser-local mock reviews are labeled accurately.

## Automated checks

- `npm test`: **13 files / 61 tests passed**.
- PostgreSQL WASM tests apply the actual migration, independently reconcile more than 50,000 mixed/old orders, verify exact discount allocation and calendar boundaries, preserve row isolation, and aggregate 10,000 questions / 40,000 options within a bounded statement timeout.
- Bulk-reader tests exercise response caps of 100, 500, and 1,000; failed later pages, repeated cursors, composite keys, and quoted text keys.
- UI tests verify independent Dashboard rendering, shared revenue across Dashboard/Orders, failed background refresh retaining previous revenue, seven management pages exposing read failures and retrying, and Settings retaining values after a failed save.
- TypeScript application check passed. Targeted ESLint checks passed for the new modules/tests. Production build passed. Existing broad build warnings about large chunks, dependency eval, and browser compatibility data remain.

## Live database verification

The configured project was identified from the application's API hostname and inspected through the existing authorized Supabase CLI session. Only aggregate business figures were returned; no customer records were exported. Actual business totals are intentionally omitted from repository documentation and graph artifacts.

- Schema, relevant indexes, and RLS policies were inspected before migration.
- The exact migration was applied through the Management API transactionally with lock/statement timeouts; existing baseline migrations were not replayed. It adds four admin-only aggregate functions, two indexes, and equivalent statement-constant admin checks in existing RLS policies. No order, price, discount, or grant records were edited.
- In a read-only repeatable-read transaction, all checks passed: summary versus independent database revenue, net subject allocation versus summary, annual chart versus summary, unique exam count, and question count.
- On the live database, both authenticated non-admin and anonymous roles were denied all four analytics functions.
- Measured SQL execution: the complete new summary took **3.002 ms**; all exam answer statistics took **97.053 ms**. The previous standalone question count under admin RLS took **2455.854 ms**; a later optimized read measured **638.868 ms**. These are individual SQL measurements, not browser load time or a controlled production p95 benchmark.
- Representative item lookup improved from **41.266 ms** to **15.370 ms**; recent-order lookup from **10.973 ms** to **5.859 ms**. Measurements are snapshots and may vary with cache/server load.

Re-runnable read-only scripts: [diagnostics.sql](diagnostics.sql), [query-plans.sql](query-plans.sql), [verify-live.sql](verify-live.sql), [verify-access.sql](verify-access.sql).

## Transfer and rendering evidence

- Dashboard has four independent data requests, compared with eight initial requests plus six sequential item requests for a 900-approved-order sample: **14 → 4**, a 71% reduction for that sample. The component test verifies the new request count and absence of item-detail requests.
- Dashboard's own JavaScript chunk decreased from **434.02 kB** to **19.59 kB**. The **412.90 kB** chart module is now separate and lazy. The shared entry remains approximately the same size; the separate analytics validation module adds 55.96 kB when admin analytics is used.
- No claim is made about end-to-end production latency or exact HTTP byte savings: an authenticated browser waterfall was not captured.

## Practical limits

- Catalog metadata still loads completely to preserve its existing all-record filters/counts. Very large future catalogs should move to purpose-built server search and pagination; financial and exam-statistics aggregates no longer depend on those metadata downloads.
- Exports use stable cursors but do not claim a transactional snapshot across independent HTTP requests during concurrent writes. Actual production backup/restore jobs were not started for testing.
- Complete interactive browser testing of every admin action was not performed. Source checks, role tests, database reconciliations, reader tests, and UI failure/retry tests provide the recorded coverage.
- Graphify's code graph was refreshed. Its installed environment lacks `tree_sitter_sql`, so SQL AST extraction is unavailable; migration correctness is verified by PostgreSQL tests and live execution instead.

## Release status

- Database migration: applied and verified.
- Background backup function: deployed successfully with its shared cursor reader; no backup job was started.
- Frontend: implementation commit `d67c998` synchronized to `main` on both repositories. Production at `https://tqmaster.vercel.app` served the new shared-analytics and lazy-chart modules; its API hostname matched the verified database project.
