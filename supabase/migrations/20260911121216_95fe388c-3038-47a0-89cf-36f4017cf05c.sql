
CREATE OR REPLACE FUNCTION public.can_access_exam_assets(_exam_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.exam_subjects es
    JOIN public.subjects s ON s.id = es.subject_id
    WHERE es.exam_id = _exam_id
      AND s.is_active = true
      AND (
        s.price <= 0
        OR EXISTS (
          SELECT 1 FROM public.user_subjects us
          WHERE us.subject_id = s.id AND us.user_id = auth.uid()
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_access_exam_assets(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_exam_assets(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "public_read_exam_and_question_images" ON storage.objects;
DROP POLICY IF EXISTS "exam_assets_read_authorized" ON storage.objects;

CREATE POLICY "exam_assets_read_authorized"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id IN ('question-images', 'exam-images')
  AND (
    public.has_role(auth.uid(), 'admin')
    OR (
      split_part(name, '/', 1) ~ '^[0-9a-fA-F-]{36}$'
      AND public.can_access_exam_assets(split_part(name, '/', 1)::uuid)
    )
  )
);
