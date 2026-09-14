-- ==============================================================================
-- Migration: Tối ưu hiệu năng RLS cho exams, questions, question_options
-- và sửa các đề thi mồ côi / chưa kích hoạt
-- ==============================================================================

-- 1. Tạo hàm kiểm tra quyền truy cập đề thi (STABLE SECURITY DEFINER để cache per statement)
CREATE OR REPLACE FUNCTION public.can_access_exam(_exam_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.exam_subjects es
      JOIN public.user_subjects us ON us.subject_id = es.subject_id
      WHERE es.exam_id = _exam_id AND us.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.exam_subjects es
      JOIN public.subjects s ON s.id = es.subject_id
      WHERE es.exam_id = _exam_id AND s.is_active = true AND s.price <= 0
    )
  );
$$;

REVOKE ALL ON FUNCTION public.can_access_exam(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_exam(uuid) TO authenticated, service_role;

-- 2. Cập nhật RLS Policy cho bảng exams
DROP POLICY IF EXISTS users_view_accessible_exams ON public.exams;
CREATE POLICY users_view_accessible_exams ON public.exams
FOR SELECT TO authenticated
USING (
  (is_active = true AND can_access_exam(id))
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 3. Cập nhật RLS Policy cho bảng questions
DROP POLICY IF EXISTS users_view_questions_of_accessible_exams ON public.questions;
CREATE POLICY users_view_questions_of_accessible_exams ON public.questions
FOR SELECT TO authenticated
USING (
  can_access_exam(exam_id)
);

-- 4. Cập nhật RLS Policy cho bảng question_options
-- Tránh việc join lồng đệ quy 5 bảng cho mỗi option trong số hơn 100.000 options
DROP POLICY IF EXISTS users_view_options_of_accessible_questions ON public.question_options;
CREATE POLICY users_view_options_of_accessible_questions ON public.question_options
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.questions q 
    WHERE q.id = question_options.question_id
  )
);

-- 5. Bổ sung index cho bảng exam_subjects để tăng tốc độ load đề theo môn
CREATE INDEX IF NOT EXISTS idx_exam_subjects_subject ON public.exam_subjects(subject_id);

-- 6. Liên kết 2 đề thi CEA201 mồ côi vào môn CEA201
INSERT INTO public.exam_subjects (exam_id, subject_id)
VALUES 
  ('6045d9f6-d3d9-453e-b842-7f0930f76e30', '124c8b66-ffb4-4f90-a0a3-d6b6f553cb0d'),
  ('d390c5f0-32ec-442a-ab23-5c63478d39b4', '124c8b66-ffb4-4f90-a0a3-d6b6f553cb0d')
ON CONFLICT (exam_id, subject_id) DO NOTHING;

-- 7. Kích hoạt lại 2 đề thi hợp lệ đang bị tắt is_active
UPDATE public.exams 
SET is_active = true 
WHERE id IN (
  '13f53842-ea50-48ce-a9f0-d3388809a937', -- Đề_Thi_FE_-_CSI106_-_SU26_-_B5_-_FE
  '2a2699c1-f04a-4e16-ac1e-7955951d5099'  -- Đề_Thi_FE_-_CEA201_-_SU26_-_B5_-_FE
);

-- 8. Dọn dẹp các đề rác tạm / test không có câu hỏi và không thuộc môn nào
DELETE FROM public.exams
WHERE id IN (
  '2fe3d69e-f835-4357-93f1-642370b3ec13', -- ~$J301 SU26 FE (file lock tạm)
  'c429066a-9a14-4ada-b8bc-c2f742e8ce21', -- __TEST_EXAM__
  '637589b0-d53a-4de6-8b97-98ba30e94563', -- __TEST_EXAM__
  'e9626c8c-61dd-40cf-8ed4-c7fc001ff895'  -- __TEST_EXAM__
);
