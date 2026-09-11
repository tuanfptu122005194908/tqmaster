
DROP POLICY IF EXISTS users_view_accessible_exams ON public.exams;
CREATE POLICY users_view_accessible_exams ON public.exams FOR SELECT TO authenticated
USING (
  is_active = true AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM exam_subjects es
      JOIN user_subjects us ON us.subject_id = es.subject_id
      WHERE es.exam_id = exams.id AND us.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM exam_subjects es
      JOIN subjects s ON s.id = es.subject_id
      WHERE es.exam_id = exams.id AND s.is_active = true AND s.price <= 0
    )
  )
);

DROP POLICY IF EXISTS users_view_questions_of_accessible_exams ON public.questions;
CREATE POLICY users_view_questions_of_accessible_exams ON public.questions FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM exams e
    JOIN exam_subjects es ON es.exam_id = e.id
    JOIN user_subjects us ON us.subject_id = es.subject_id
    WHERE e.id = questions.exam_id AND us.user_id = auth.uid() AND e.is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM exams e
    JOIN exam_subjects es ON es.exam_id = e.id
    JOIN subjects s ON s.id = es.subject_id
    WHERE e.id = questions.exam_id AND e.is_active = true AND s.is_active = true AND s.price <= 0
  )
);

DROP POLICY IF EXISTS users_view_options_of_accessible_questions ON public.question_options;
CREATE POLICY users_view_options_of_accessible_questions ON public.question_options FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM questions q
    JOIN exams e ON e.id = q.exam_id
    JOIN exam_subjects es ON es.exam_id = e.id
    JOIN user_subjects us ON us.subject_id = es.subject_id
    WHERE q.id = question_options.question_id AND us.user_id = auth.uid() AND e.is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM questions q
    JOIN exams e ON e.id = q.exam_id
    JOIN exam_subjects es ON es.exam_id = e.id
    JOIN subjects s ON s.id = es.subject_id
    WHERE q.id = question_options.question_id AND e.is_active = true AND s.is_active = true AND s.price <= 0
  )
);

DROP POLICY IF EXISTS users_view_accessible_theories ON public.theories;
CREATE POLICY users_view_accessible_theories ON public.theories FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM theory_subjects ts
    JOIN user_subjects us ON us.subject_id = ts.subject_id
    WHERE ts.theory_id = theories.id AND us.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM theory_subjects ts
    JOIN subjects s ON s.id = ts.subject_id
    WHERE ts.theory_id = theories.id AND s.is_active = true AND s.price <= 0
  )
);
