-- ========================================================
-- Migration: Fix RLS Performance and Indexes for attempt_answers
-- Giải quyết lỗi timeout 500 khi Admin truy vấn / sao lưu bảng attempt_answers
-- ========================================================

-- 1. Thêm policy riêng cho Admin với InitPlan (SELECT public.has_role(...))
-- Giúp Postgres short-circuit tức thì mà không cần duyệt correlated subquery từng dòng.
DROP POLICY IF EXISTS "admins_manage_attempt_answers" ON public.attempt_answers;
CREATE POLICY "admins_manage_attempt_answers" ON public.attempt_answers
  FOR ALL TO authenticated
  USING ((SELECT public.has_role(auth.uid(), 'admin'::public.app_role)))
  WITH CHECK ((SELECT public.has_role(auth.uid(), 'admin'::public.app_role)));

-- 2. Cập nhật policy SELECT cho học viên & admin (ưu tiên admin check trước)
DROP POLICY IF EXISTS "users_view_own_answers" ON public.attempt_answers;
CREATE POLICY "users_view_own_answers" ON public.attempt_answers
  FOR SELECT TO authenticated
  USING (
    (SELECT public.has_role(auth.uid(), 'admin'::public.app_role))
    OR
    EXISTS (
      SELECT 1 FROM public.exam_attempts
      WHERE id = attempt_answers.attempt_id AND user_id = (SELECT auth.uid())
    )
  );

-- 3. Tạo index hỗ trợ nếu chưa có để tối ưu tốc độ duyệt và join
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt_id ON public.attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_question_id ON public.attempt_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_user_id ON public.exam_attempts(user_id);
