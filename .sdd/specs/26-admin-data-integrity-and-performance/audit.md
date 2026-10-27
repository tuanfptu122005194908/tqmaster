# Audit: Admin data retrieval

Initial audit: 2026-10-26 at baseline `cd347c5`. Implementation and subsequent live checks are recorded in [verification.md](verification.md). Scope: all 14 routes in `src/App.tsx:234-249`, the admin badge queries, shared Users loader, local/background backup, and Excel export.

At the initial audit stage, this was a source audit plus controlled reproductions and baseline checks. No authenticated production session was used at that stage. Findings confirm code defects and conditional cap risks; they do not establish the user's actual lost amount, live row cap, database query plan, or production response time. No application source, migration, or production data was changed.

## Highest-priority findings

### A01 — Dashboard total is a recent sample, not total approved revenue (P1, confirmed)

`src/pages/admin/AdminDashboard.tsx:69-88` selects only orders within 400 days and at most the latest 1,000 of all statuses. Lines 166-168 sum approved orders from that sample. Older approved orders and approved orders displaced by recent pending/rejected orders are excluded. Status counts at lines 90-107 cover the entire table, so even counts and revenue on the same screen have different scopes.

`src/pages/admin/AdminOrders.tsx:149-159` instead selects approved amounts without a date restriction or pagination and sums the returned rows. This also risks truncation at the API response cap. Its average at line 300 divides a potentially capped sum by the full approved count.

Controlled fixture: 200 newest pending orders, 800 recent approved orders at 100,000 VND, another 250 approved orders within 400 days, and one old approved order at 200,000 VND. With an explicitly simulated 1,000-row API cap:

| Calculation | VND |
|---|---:|
| Existing Dashboard callback | 80,000,000 |
| Existing Orders sum over its capped response | 100,000,000 |
| Full approved total | 105,200,000 |

These are synthetic reproduction values, not customer data. The existing Dashboard `totalRevenue` callback was extracted through the TypeScript AST and evaluated without editing source. Supabase documents its default 1,000-row maximum and the need for pagination: [select documentation](https://supabase.com/docs/reference/javascript/select). The actual project setting was not read.

### A02 — Dashboard blocks on a sequential detail-query waterfall (P1, structural evidence)

`AdminDashboard.tsx:74-136` runs eight initial requests, then reads item details in sequential chunks of 150 approved order IDs. The initial full-screen loading flag is cleared only after every chunk finishes. With 900 approved orders in the selected sample this is eight initial requests plus six sequential detail requests, before considering global badge requests. Any order realtime event repeats the full load. There is no shared React Query cache or in-flight version check in this component. This establishes avoidable blocking work, not a measured production duration.

The item queries themselves have no pagination, so one batch with many line items can also hit the server cap. If a refresh has no approved orders, `orderItems` is not explicitly cleared, although the ID filter suppresses unmatched old rows.

### A03 — Calendar and subject analysis have independently reproduced errors (P1/P2)

- `AdminDashboard.tsx:192-207`: weekly buckets are six 24-hour intervals long, start at the current time of day, and are spaced seven days apart. They leave 24-hour gaps and the current bucket extends into the future. A fixture order one hour before the fixed current time is absent from every bucket.
- Lines 212-217: monthly grouping uses only month number and ignores year. October 2025 value 200 plus October 2026 value 100 becomes October 300. Both dates can fall within the 400-day source window.
- Lines 220-230: annual history is limited by the same 400-day sample.
- Lines 259-270: rankings group by display name, merging distinct subject IDs with the same name. Two controlled subjects become one.
- `supabase/functions/create-order/index.ts:98-158` records item prices before the order-level discount, while `final_amount` is after discount. Dashboard and Subjects sum raw item prices as revenue (`AdminDashboard.tsx:266`, `AdminSubjects.tsx:49`), so those sums are not net order revenue. Top-five percentages and the displayed period sum also use only the top five, excluding other subjects (`AdminDashboard.tsx:270-271,639`).

### A04 — Failed reads can look like valid missing data (P1, confirmed)

Dashboard does not check the `error` fields of its eight initial Supabase results or item batches; `data ?? []` and `count ?? 0` make failures appear as empty lists or zero counters. Supabase query failures are generally returned as `error`, so an outer catch alone does not handle these responses.

The same pattern appears in Subjects, Exams, Theory, Announcements, News, and Settings. Orders list errors are only logged and the loading state ends, leaving an empty/old table without a visible query failure. Orders summary errors are ignored. Coupons and Question Reports have toast handling, and AdminUsers already has a dedicated error/retry flow.

Settings is particularly sensitive: `AdminSettings.tsx:26-32` makes a failed initial read an empty form; saving at lines 37-43 can then upsert blank values and always announce success without inspecting results. No settings writes were performed during the audit.

### A05 — Failed precondition reads can affect later admin actions (P1, confirmed code path)

`AdminOrders.tsx:235-248` ignores the error when checking whether another approved order preserves subject access. A failed query returning `data: null` satisfies `!otherOrders`, which can trigger an incorrect access revocation. This needs an explicit abort on read failure before any dependent mutation. The existing business rule itself need not change. No order deletion or access mutation was performed.

Subject duplication also relies on unpaginated reads of linked exams/theories/questions (`AdminSubjects.tsx:104-138`), so it can copy an incomplete set when those reads exceed the API cap. The fix should validate complete source reads before copying; a broader transactional rewrite is outside this retrieval audit.

## Coverage of all admin routes

| Route / component | Retrieval findings | Evidence |
|---|---|---|
| Dashboard | Capped financial sample; sequential detail reads; ignored errors; calendar/ranking bugs | `AdminDashboard.tsx:69-136,166-278` |
| Orders | Main list has 50-row server pagination and request version guard; revenue query is unpaginated; global cards ignore list date filters; failures not visible; unguarded detail responses can mix item/bill data after rapid selections; failed access-check read can trigger revocation; hard-coded `+8.4%` | `AdminOrders.tsx:78-159,235-248,268-290,300,434` |
| Subjects | Subject list and approved item totals are one-shot reads; item total can truncate; gross/net mismatch; read errors ignored; duplication source reads can also truncate | `AdminSubjects.tsx:33-60,104-138` |
| Exams / questions | Exam list, subject references, and questions for an exam are unpaginated; local filtering cannot find omitted rows; late question responses can replace another selection | `AdminExams.tsx:81-116` |
| Theory / PE | One-shot theory and subject reads; local search and categories operate on returned subset; ignored read errors | `AdminTheory.tsx:121-145` |
| Announcements | One-shot list and subject reference reads; ignored read errors | `AdminAnnouncements.tsx:31-41` |
| News | One-shot full-content reads; ignored errors and local data count | `AdminNews.tsx:31-36` |
| Coupons | One-shot list; visible error toast exists; local totals/search still limited to returned records | `AdminCoupons.tsx:73-89` |
| Users | Already uses complete ordered ID cursors, error propagation, request versions, and visible retry; full four-table preload remains a scaling cost rather than a confirmed cap bug | `src/lib/adminUsers.ts:10-53`, `fetchAllById.ts:7-25`, `AdminUsers.tsx:52-82` |
| Settings | Small key table, so cap not material in normal use; ignored read/write errors can expose blank values as loaded state | `AdminSettings.tsx:26-43` |
| Question Reports | Pending-only by design; one-shot joined list can omit pending reports/groups; signs all loaded question images before completing load; toast on query error, no realtime list subscription | `AdminQuestionReports.tsx:28-66` |
| Backup / Restore | History intentionally shows latest 6/8 jobs; both poll every 4 seconds; data export readers have short-page and ordering risks described below | `AdminBackup.tsx:78-88`, backup panels and loaders |
| Exam answer statistics | Large `.limit(10000/20000)` does not guarantee all rows; flat offset pages lack ordering and stop at short page; shared exams counted twice globally; metadata queries are sequential | `AdminExamStats.tsx:193-247,275-316` |
| Reviews | Reads/writes browser localStorage initialized from mock reviews; no server query, so changes do not form shared cross-device admin data | `AdminReviews.tsx:11-18`, `reviewsStore.ts:4-21` |

Unpaginated list findings are conditional on result size exceeding the configured cap. They do not mean every currently small list already lost records. The 50-order list page and the 6/8-job history limits are deliberate UI boundaries and are not themselves truncation defects.

## Backup, exam statistics, and shared query details

- `src/lib/backupCore.ts:171-210` and `supabase/functions/backup-worker/index.ts:87-114` stop when a page contains fewer than the requested 1,000 rows. If the API cap is lower, they finish early and can report an incomplete export as done. Composite-key fallback orders by a non-unique timestamp in some schemas; stable full-key ordering is required.
- `src/lib/excelBackup.ts:249-266` uses offset ranges without any order and the same short-page stop. This can skip/duplicate rows under unstable ordering or truncate under lower caps. [Supabase range documentation](https://supabase.com/docs/reference/javascript/using-modifiers-range) explicitly notes that a missing order can make range behavior unexpected.
- `AdminExamStats.tsx:240-245` similarly pages questions/options without ordering. Metadata reads request large limits but do not page; increasing a client limit does not establish complete retrieval.
- `AdminExamStats.tsx:306-316` sums per-subject exam groups; one exam linked to two subjects contributes twice to global exam/question/answer counts. The earlier group-building path also excludes exams with no questions.
- `src/lib/AppContext.tsx:159-183,383-432` uses proper HEAD counts and retains prior values on failed reads. It also independently refreshes pending counts while Dashboard/Orders refresh their own counts, adding duplicate requests. Its failure state is only logged.
- Local migration files include simple `orders(user_id)` and `orders(status)` indexes, but no order date sort index or `order_items(order_id)` index was found. This is a candidate performance concern, not proof of missing live indexes or a measured root cause. Database plans and deployed indexes must be inspected before deciding a migration.
- Order IDs are `TEXT` (`20260428161021_0b4fc811-eef1-423c-9edb-332ed15106bd.sql:211`), consistent with `ORD-...`; the order-ID text search must not be incorrectly diagnosed as UUID `ILIKE` failure.

## Validation performed

- `npm test`: **7 test files, 33 tests passed**. Existing tests cover auth/access, AdminUsers, and parsing; none cover Dashboard financial/calendar logic.
- `npm run build`: **passed**, 57.40 seconds on this machine. This is build duration, not website load time.
- Four controlled reproductions of current calculation callbacks confirmed: different revenue scopes, cross-year month merge, weekly interval gap, subject-name collision. No API requests or application source edits were needed.
- Build output: Dashboard chunk **434.02 kB / 116.24 kB gzip**, shared entry **584.61 kB / 173.21 kB gzip**. These add cold-load cost, but no browser waterfall was captured.

## Proposed resolution

Use shared admin-only server aggregates for full financial totals and bounded charts/rankings; separate those from recent orders and paginated management lists. Centralize complete bulk reading where required, preserve errors, share query cache/realtime invalidations, and verify regression cases beyond the API cap. See [spec.md](spec.md), [plan.md](plan.md), and [tasks.md](tasks.md).

The repository skill `.agents/skills/speckit/SKILL.md`, section 1 and step 3, explicitly requires user review of the spec before any source implementation. That review was subsequently approved by the user; implementation and verification are recorded in verification.md.
