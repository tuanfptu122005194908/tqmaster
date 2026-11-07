# Tasks 44 — PE Campus Selector

## Checklist

- [x] **T1** Tạo file migration SQL: `supabase/migrations/20261107020000_add_campus_to_theories.sql`
- [x] **T2** Apply migration: `npx supabase db query --remote --yes "ALTER TABLE theories ADD COLUMN IF NOT EXISTS campus..."`
- [x] **T3** Update `src/integrations/supabase/types.ts` — thêm `campus` vào theories Row/Insert/Update
- [x] **T4** Update `AdminTheory.tsx` — thêm `Campus` type, `CAMPUS_OPTS`, cập nhật `FormState`
- [x] **T5** Update `AdminTheory.tsx` — cập nhật `EMPTY_FORM` (campus: 'HaNoi')
- [x] **T6** Update `AdminTheory.tsx` — cập nhật `openEdit` để pre-fill campus
- [x] **T7** Update `AdminTheory.tsx` — thêm campus radio UI trong form (PE only)
- [x] **T8** Update `AdminTheory.tsx` — thêm campus vào save() payload (insert + update)
- [x] **T9** Update `AdminTheory.tsx` — thêm campus badge trên admin card grid (PE only)
- [x] **T10** Update `SubjectDetailPage.tsx` — thêm helper CAMPUS_CONFIG / getCampusBadge
- [x] **T11** Update `SubjectDetailPage.tsx` — thêm campus badge và campus quick filter pills trong renderPeDocs
- [x] **T12** `npm run build` — xác nhận không có lỗi TypeScript/build (built in 25.48s)
- [x] **T13** `npm test -- --run` — xác nhận 118/118 tests pass
- [x] **T14** `git add`, `git commit -m "feat(theory): add campus selector for PE exam documents (Spec 44)"`
- [x] **T15** `git push origin main`
- [x] **T16** `git push tqmaster main`
