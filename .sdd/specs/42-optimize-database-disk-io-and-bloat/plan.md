# Technical Plan: Khắc Phục Cạn Kiệt Disk IO & Tối Ưu Triệt Để Database Supabase (Spec 42)

## 1. Kiến trúc Giải pháp & Các Bước Triển Khai

### Bước 1: Điều chỉnh Lịch pg_cron (Khắc phục 91.3% thời gian chạy DB)
```sql
DO $$
DECLARE
  jid bigint;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'cleanup-unverified-users';
  IF jid IS NOT NULL THEN
    PERFORM cron.alter_job(jid, schedule := '30 3 * * *');
  END IF;
END $$;
```

### Bước 2: Dọn dẹp Bloat trên bảng `attempt_answers` (Tiết kiệm 64 MB đĩa)
```sql
VACUUM FULL public.attempt_answers;
REINDEX TABLE public.attempt_answers;
```

### Bước 3: Bổ sung các Index bị thiếu (Chấm dứt hàng triệu Sequential Scans)
```sql
CREATE INDEX IF NOT EXISTS idx_order_items_subject_id ON public.order_items (subject_id);
CREATE INDEX IF NOT EXISTS idx_question_reports_status ON public.question_reports (status);
```

### Bước 4: Tối ưu RLS Policies (Chấm dứt 130 triệu lượt gọi `user_roles`)
Bọc `(SELECT public.has_role(auth.uid(), 'admin'))` trong:
- `exams` (`users_view_accessible_exams`, `admins_manage_exams`)
- `question_options` (`users_view_options_of_accessible_questions`, `admins_manage_options`)
- `question_reports` (`admins_view_all_reports`, `admins_update_reports`, `admins_delete_reports`)
- `profiles` (`admins_view_all_profiles`, `admins_update_all_profiles`, `admins_delete_profiles`)
- `subjects` (`public_view_active_subjects`, `admins_manage_subjects`)
- `theories` (`users_view_accessible_theories`, `admins_manage_theories`)

### Bước 5: Kiểm tra xác minh sau tối ưu
- Chạy `npx supabase db query --remote --read-only` kiểm tra lại bloat của `attempt_answers` và schedule của `cron.job`.
- Chạy `npm test` xác nhận 114 tests pass 100%.
- Cập nhật knowledge graph và thực hiện Dual-repo push.

