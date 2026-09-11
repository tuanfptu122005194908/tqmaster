
GRANT EXECUTE ON FUNCTION public.can_access_exam_assets(uuid) TO anon;

DROP POLICY IF EXISTS "exam_assets_read_free_anon" ON storage.objects;
CREATE POLICY "exam_assets_read_free_anon"
ON storage.objects
FOR SELECT
TO anon
USING (
  bucket_id IN ('question-images', 'exam-images')
  AND split_part(name, '/', 1) ~ '^[0-9a-fA-F-]{36}$'
  AND public.can_access_exam_assets(split_part(name, '/', 1)::uuid)
);
