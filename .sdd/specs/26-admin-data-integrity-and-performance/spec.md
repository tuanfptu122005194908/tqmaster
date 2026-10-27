# Feature Specification: Admin data integrity and performance

**Feature Branch**: `fix/admin-data-integrity` (audit performed on `main`)
**Status**: Implemented — approved, tested and deployed; verification limits recorded in verification.md
**Date**: 2026-10-26

## 1. Overview

Dashboard and order management currently calculate the same revenue label from different, potentially truncated datasets. Dashboard also waits for sequential item requests before rendering. An audit of all 14 admin routes identified additional incomplete list queries, calendar errors, and failures presented as empty data. See [audit.md](audit.md) for evidence, reproductions, coverage, and limitations.

The change must make admin figures complete, consistent, and responsive without modifying historical orders, prices, discounts, permissions, or approval rules. This specification supersedes the 1,000-order/400-day restriction in spec 02 wherever that restriction affects financial totals or complete chart aggregates.

## 2. User Scenarios & Testing

### US1 — Reconcile revenue (P1)

Given more than 1,000 orders, mixed statuses, discounts, and approved orders older than 400 days, when an admin opens Dashboard and Orders, then both global revenue cards equal the database sum of `orders.final_amount` for every approved order, and average order value uses the matching approved count. Pending/rejected orders contribute zero.

### US2 — Load Dashboard progressively (P1)

Given slow ranking or chart requests, when summary and recent orders are ready, then those sections render independently. When the admin navigates away or requests overlap, then obsolete responses cannot replace newer results. Realtime refresh preserves the last successful display while showing refresh/error state.

### US3 — Complete and correct period analysis (P1)

Given orders around midnight, week/month/year boundaries, when an admin changes the chart period, then every applicable order is counted exactly once in non-overlapping calendar buckets using `Asia/Ho_Chi_Minh`. Monthly analysis is limited to its stated year. Annual history is not cut off at 400 days.

### US4 — Retrieve all matching admin records (P1)

Given more records than the API response cap, when an admin searches, filters, pages through, exports, or opens the audited admin lists/details, then all matching records remain reachable. Totals describe the entire intended scope, not the current page. Given a response cap smaller than the requested batch, then a full export does not silently stop after the first short batch.

### US5 — Distinguish errors from empty data (P1)

Given a timeout, permission failure, or failed subsequent batch, when data loading completes, then the UI reports the error and offers retry. It does not replace an unknown figure with zero, present incomplete export data as complete, or allow a failed settings load to become an accidental blank save.

### US6 — Understand subject sales and review sources (P2)

Given discounted orders and different subjects with identical names, when viewing sales by subject, then subjects are grouped by ID and gross item value is explicitly distinguished from net order revenue. Any displayed net allocation reconciles to order totals, with missing item detail reported separately. Given the Reviews route, then its current browser-local mock source is documented and not represented as a verified database-backed review system.

## 3. Requirements

### Functional Requirements

- **FR-001**: A shared server-side commerce summary must compute global approved revenue, approved/pending/rejected counts, and matching average order value over the full dataset. Dashboard and Orders must consume the same definition and query cache.
- **FR-002**: Date/search/status filters on the Orders list must not silently change the scope of its global cards. Labels must say when figures cover all time or only a selected period.
- **FR-003**: Charts and subject rankings must aggregate in the database. Do not transfer all historical orders/items into the browser to obtain totals. Recent orders remain an independently bounded list of 10.
- **FR-004**: Summary, recent orders, chart, and ranking sections must have independent loading/error states. Background refresh must retain last good data and prevent stale response races.
- **FR-005**: Define calendar intervals explicitly in `Asia/Ho_Chi_Minh`: 14 calendar days, 8 calendar weeks starting Monday, 12 months of the selected/current year, and annual history. Use half-open intervals and stable ordering. Top rankings must state their 7-day/30-day/current-year scope.
- **FR-006**: Subject sales must group by `subject_id`, not subject name. Existing `order_items.price` is gross before order discount; it must not be labeled as net revenue. If a net subject figure is displayed, allocate each order's final amount proportionally with deterministic VND rounding, and expose an unallocated amount for orders without usable item details.
- **FR-007**: Fix incomplete retrieval in Subjects, Exams/questions, Theory, Announcements, News, Coupons, Question Reports, and exam statistics through server-side pagination/filtering or a verified complete cursor loader where full data is actually required. Counts, search, sort, and exports must preserve their intended scope. Question-report grouping must not imply that a partially loaded group is complete.
- **FR-008**: Replace large `.limit(10000/20000)` calls and unstable offset reads in exam statistics with bounded server aggregates or complete ordered retrieval. Global exam/question counts must deduplicate exams shared by multiple subjects.
- **FR-009**: Validate every read response, including Supabase's returned `error`; an outer `try/catch` alone is insufficient. Error and empty states must remain distinct, including subsequent batch failures and settings load failures.
- **FR-010**: Use the existing robust `fetchAllById` behavior for compatible flat tables: ordered cursor, error propagation, progress validation, termination on an empty page. Composite keys need a complete stable order/cursor. Apply equivalent guarantees to local snapshot, background backup, and Excel export; do not assume a short page means end-of-table.
- **FR-011**: Realtime must invalidate affected shared queries with debounce and no concurrent duplicate reload of the same query. Global summary remains authoritative after approval, rejection, deletion, restore/import, reconnect, and retry. Include dependent item/subject changes where applicable.
- **FR-012**: Preserve the existing complete AdminUsers loader and failure UI. Only change its full-table loading strategy if measured scale requires it; retain complete email exports and role/access behavior.
- **FR-013**: Admin aggregate endpoints require database-enforced admin access. Use invoker security/RLS where possible; any definer function requires explicit role checks and a fixed search path. No service-role key may enter the browser.
- **FR-014**: Inspect actual query plans before claiming a database performance fix. Candidate indexes cover order date/status and item foreign keys; local migration absence alone does not prove live index absence. Do not disable RLS or raise the API row cap as a correctness fix.
- **FR-015**: Reviews remains a documented separate backend gap. Do not silently build a new review database, alter historical order data, or redesign write workflows under this retrieval fix.
- **FR-016**: Remove or replace unsupported growth labels such as Orders' hard-coded `+8.4%` with measured values or neutral text.
- **FR-017**: Dependent admin actions must abort when a prerequisite read fails or is incomplete. In particular, a failed competing-order lookup must never be treated as proof that subject access can be revoked, and subject duplication must validate complete source reads. Do not redesign approval/access business rules under this change.

### Key Entities

- `orders`: `id` (text), `status`, `final_amount`, `original_amount`, `discount_amount`, `created_at`, `reviewed_at`.
- `order_items`: `id`, `order_id`, `subject_id`, `price`.
- `profiles`, `user_roles`, `user_subjects`, `subjects`.
- `exams`, `exam_subjects`, `questions`, `question_options`.
- `theories`, `theory_subjects`, `announcements`, `news_posts`, `discount_codes`, `question_reports`, `system_settings`.
- `backup_jobs`, `restore_jobs`; review mock data in browser localStorage.

### Key Files

- `src/pages/admin/AdminDashboard.tsx`, `AdminOrders.tsx`, `AdminSubjects.tsx`, `AdminExamStats.tsx`.
- `src/pages/admin/AdminExams.tsx`, `AdminTheory.tsx`, `AdminAnnouncements.tsx`, `AdminNews.tsx`, `AdminCoupons.tsx`, `AdminQuestionReports.tsx`, `AdminSettings.tsx`.
- `src/lib/adminUsers.ts`, `fetchAllById.ts`, `AppContext.tsx`, `backupCore.ts`, `excelBackup.ts`.
- `src/components/backup/BackgroundBackupPanel.tsx`, `BackgroundRestorePanel.tsx`.
- `supabase/functions/backup-worker/index.ts`, `supabase/migrations/<new migration>.sql`, `src/integrations/supabase/types.ts`.
- Proposed shared admin query modules/hooks and focused regression tests. Review-source changes, if any, limited to accurate labeling/documentation.

## 4. Success Criteria

- **SC-001**: Dashboard and Orders totals exactly match a direct full-dataset aggregate on fixtures exceeding 1,000 and 50,000 orders, including old orders and discounts.
- **SC-002**: Summary requests return aggregate rows/JSON only; recent-order payload contains at most 10 orders. Summary rendering does not await chart/ranking/item retrieval.
- **SC-003**: No missing/duplicate time buckets around midnight, Monday, year boundaries, or different browser timezones; the four confirmed dashboard reproductions are covered by regression tests.
- **SC-004**: Every audited database-backed list supports reaching records beyond the response cap. Bulk readers return all rows or a visible failure under caps of 100, 500, and 1,000.
- **SC-005**: A failed refresh retains last good data and shows an error; a failed initial read cannot be presented as a valid zero or empty list.
- **SC-006**: Shared exam statistics count each exam/question once globally, even when linked to multiple subjects.
- **SC-007**: Focused tests, `npm test`, and `npm run build` pass. Admin/non-admin RPC access and query plans are checked against a suitable database before deployment claims.
- **SC-008**: Record before/after request count, transferred bytes, and summary-ready latency under identical data/network conditions. Target at least 50% fewer Dashboard HTTP requests with 900 approved recent orders; no claim of production latency without a live measurement.
