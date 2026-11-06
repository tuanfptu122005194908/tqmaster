-- ==============================================================================
-- Migration: Khắc Phục Cạn Kiệt Disk IO & Tối Ưu Triệt Để Database (Spec 42)
-- 1. Giảm tần suất cron job cleanup-unverified-users từ mỗi phút sang mỗi ngày lúc 3:30 AM
-- 2. Bổ sung các chỉ mục còn thiếu (chấm dứt gần 1 triệu lần sequential scans)
-- 3. Tối ưu RLS Policies bọc (SELECT public.has_role(auth.uid(), 'admin'))
-- ==============================================================================

-- 1. Điều chỉnh lịch chạy cron job cleanup-unverified-users
DO $$
DECLARE
  jid bigint;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'cleanup-unverified-users';
  IF jid IS NOT NULL THEN
    PERFORM cron.alter_job(jid, schedule := '30 3 * * *');
  END IF;
END $$;

-- 2. Bổ sung các chỉ mục hiệu năng cao
-- 2.1 Index cho order_items(subject_id) (giải quyết 913,483 lần sequential scans)
CREATE INDEX IF NOT EXISTS idx_order_items_subject_id ON public.order_items (subject_id);

-- 2.2 Index cho question_reports(status) (giải quyết 11,572 lần sequential scans)
CREATE INDEX IF NOT EXISTS idx_question_reports_status ON public.question_reports (status);
CREATE INDEX IF NOT EXISTS idx_question_reports_created_at ON public.question_reports (created_at DESC);

-- 2.3 Index cho theories
CREATE INDEX IF NOT EXISTS idx_theories_category_created ON public.theories (category, created_at DESC);

-- 3. Tối ưu hóa RLS Policies: Chuyển has_role sang dạng initPlan (SELECT ...)
-- Giúp PostgreSQL cache kết quả kiểm tra quyền admin 1 lần cho cả câu truy vấn,
-- triệt tiêu 130 triệu lượt quét lặp vào bảng user_roles.

-- 3.1 question_options
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='question_options' AND policyname='users_view_options_of_accessible_questions') THEN
    ALTER POLICY users_view_options_of_accessible_questions ON public.question_options
      USING ((SELECT public.has_role(auth.uid(), 'admin')) OR EXISTS (
        SELECT 1 FROM public.questions q WHERE q.id = question_options.question_id
      ));
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='question_options' AND policyname='admins_manage_options') THEN
    ALTER POLICY admins_manage_options ON public.question_options
      USING ((SELECT public.has_role(auth.uid(), 'admin')))
      WITH CHECK ((SELECT public.has_role(auth.uid(), 'admin')));
  END IF;
END $$;

-- 3.2 exams
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='exams' AND policyname='users_view_accessible_exams') THEN
    ALTER POLICY users_view_accessible_exams ON public.exams
      USING ((SELECT public.has_role(auth.uid(), 'admin')) OR (is_active = true AND can_access_exam(id)));
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='exams' AND policyname='admins_manage_exams') THEN
    ALTER POLICY admins_manage_exams ON public.exams
      USING ((SELECT public.has_role(auth.uid(), 'admin')))
      WITH CHECK ((SELECT public.has_role(auth.uid(), 'admin')));
  END IF;
END $$;

-- 3.3 exam_subjects
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='exam_subjects' AND policyname='admins_manage_exam_subjects') THEN
    ALTER POLICY admins_manage_exam_subjects ON public.exam_subjects
      USING ((SELECT public.has_role(auth.uid(), 'admin')))
      WITH CHECK ((SELECT public.has_role(auth.uid(), 'admin')));
  END IF;
END $$;

-- 3.4 question_reports
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='question_reports' AND policyname='admins_view_all_reports') THEN
    ALTER POLICY admins_view_all_reports ON public.question_reports
      USING ((SELECT public.has_role(auth.uid(), 'admin')));
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='question_reports' AND policyname='admins_update_reports') THEN
    ALTER POLICY admins_update_reports ON public.question_reports
      USING ((SELECT public.has_role(auth.uid(), 'admin')))
      WITH CHECK ((SELECT public.has_role(auth.uid(), 'admin')));
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='question_reports' AND policyname='admins_delete_reports') THEN
    ALTER POLICY admins_delete_reports ON public.question_reports
      USING ((SELECT public.has_role(auth.uid(), 'admin')));
  END IF;
END $$;

-- 3.5 subjects
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='subjects' AND policyname='public_view_active_subjects') THEN
    ALTER POLICY public_view_active_subjects ON public.subjects
      USING ((is_active = true) OR (SELECT public.has_role(auth.uid(), 'admin')));
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='subjects' AND policyname='admins_manage_subjects') THEN
    ALTER POLICY admins_manage_subjects ON public.subjects
      USING ((SELECT public.has_role(auth.uid(), 'admin')))
      WITH CHECK ((SELECT public.has_role(auth.uid(), 'admin')));
  END IF;
END $$;

-- 3.6 theories
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='theories' AND policyname='users_view_accessible_theories') THEN
    ALTER POLICY users_view_accessible_theories ON public.theories
      USING ((SELECT public.has_role(auth.uid(), 'admin')) OR EXISTS (
        SELECT 1 FROM public.theory_subjects ts
        JOIN public.user_subjects us ON us.subject_id = ts.subject_id
        WHERE ts.theory_id = theories.id AND us.user_id = auth.uid()
      ) OR EXISTS (
        SELECT 1 FROM public.theory_subjects ts
        JOIN public.subjects s ON s.id = ts.subject_id
        WHERE ts.theory_id = theories.id AND s.is_active = true AND s.price <= 0
      ));
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='theories' AND policyname='admins_manage_theories') THEN
    ALTER POLICY admins_manage_theories ON public.theories
      USING ((SELECT public.has_role(auth.uid(), 'admin')))
      WITH CHECK ((SELECT public.has_role(auth.uid(), 'admin')));
  END IF;
END $$;

-- 3.7 user_subjects
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_subjects' AND policyname='admins_manage_user_subjects') THEN
    ALTER POLICY admins_manage_user_subjects ON public.user_subjects
      USING ((SELECT public.has_role(auth.uid(), 'admin')))
      WITH CHECK ((SELECT public.has_role(auth.uid(), 'admin')));
  END IF;
END $$;

-- 3.8 profiles
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='admins_view_all_profiles') THEN
    ALTER POLICY admins_view_all_profiles ON public.profiles
      USING ((SELECT public.has_role(auth.uid(), 'admin')));
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='admins_update_all_profiles') THEN
    ALTER POLICY admins_update_all_profiles ON public.profiles
      USING ((SELECT public.has_role(auth.uid(), 'admin')))
      WITH CHECK ((SELECT public.has_role(auth.uid(), 'admin')));
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='admins_delete_profiles') THEN
    ALTER POLICY admins_delete_profiles ON public.profiles
      USING ((SELECT public.has_role(auth.uid(), 'admin')));
  END IF;
END $$;

-- 3.9 exam_attempts
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='exam_attempts' AND policyname='users_view_own_attempts') THEN
    ALTER POLICY users_view_own_attempts ON public.exam_attempts
      USING ((user_id = auth.uid()) OR (SELECT public.has_role(auth.uid(), 'admin')));
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

