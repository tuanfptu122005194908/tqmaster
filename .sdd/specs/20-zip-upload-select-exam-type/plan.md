# Plan

1. **State**: Add state `examType` (type `'FE' | 'PT'`) initialized to `'FE'` in `BulkExamZipModal.tsx`.
2. **UI**: Add a select field for `examType` in the configuration section (next to Duration).
3. **DB Insert**: In `handleStartUpload`, update the `supabase.from('exams').insert(...)` call to include `exam_type: examType`.
4. **Testing**: Run local build and verify the UI, make sure the exam is created with correct `exam_type`.
