# Tasks: Admin data integrity and performance

## Audit and review

- [x] Review CodeGraph before source searches and traverse the existing Graphify graph.
- [x] Inspect data reads across all 14 admin routes and shared loaders/backup paths.
- [x] Reproduce revenue-scope mismatch, cross-year months, weekly gaps, and subject-name collisions using current calculation callbacks and controlled fixtures.
- [x] Run existing test suite: 7 files, 33 tests passed.
- [x] Run production build successfully.
- [x] Create audit, specification, implementation plan, and task checklist before code changes.
- [x] Obtain the user review required by `.agents/skills/speckit/SKILL.md`.

## Implementation after review

- [x] Add focused regressions for global financial totals, API caps, discounted subject values, duplicate names, calendar boundaries, and failed reads.
- [x] Inspect target schema, indexes, RLS and representative query plans through an authorized connection; test completeness under API caps of 100/500/1,000.
- [x] Implement admin-only aggregate migration and update typed database contracts.
- [x] Implement shared commerce queries/cache and Dashboard/Orders integration.
- [x] Separate summary/recent orders/chart/ranking loading, error, retry, and background refresh.
- [x] Correct chart intervals, year scope, ranking identifiers, and gross/net labels/allocation.
- [x] Correct Subjects aggregate and exam answer statistics, including shared-exam deduplication.
- [x] Add complete pagination/filtering/error states to Exams/questions, Theory, Announcements, News, Coupons, and Question Reports.
- [x] Protect Settings from failed-load blank state; retain AdminUsers' complete loader and error behavior.
- [x] Repair complete ordered pagination for local/background snapshots and Excel exports, including composite keys and low response caps.
- [x] Integrate realtime/restore invalidation and stale-response protection; ensure badge and summary remain consistent.
- [x] Guard prerequisite reads for order deletion/access checks and subject duplication; protect order detail requests from stale selections.
- [x] Document/label browser-local Reviews and remove unsupported financial growth labels.

## Verification and delivery

- [x] Run focused regressions and required full test/build checks (61 tests, build, typecheck, targeted lint).
- [x] Verify RPC role access and SQL results against independent database aggregates on the live project.
- [ ] Measure before/after payload, HTTP request count, query plans, and summary-ready latency under identical conditions.
- [ ] Exercise each affected admin route, failed reads, retry, filters, page changes, exports, and realtime refresh.
- [x] Update Graphify after implementation, review the final diff, and update spec/task status honestly.
- [x] Commit implementation, fast-forward main, push both repositories, and verify the production frontend serves the new modules.

Measurement and coverage limits are recorded in [verification.md](verification.md). Browser latency/HTTP bytes and every interactive admin action were not measured; the corresponding broad verification items remain open rather than being reported as completed.
