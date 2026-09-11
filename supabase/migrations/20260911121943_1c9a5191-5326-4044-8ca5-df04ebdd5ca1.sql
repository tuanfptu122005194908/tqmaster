
CREATE OR REPLACE FUNCTION public.can_access_theory_asset(_object_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.theories t
    JOIN public.theory_subjects ts ON ts.theory_id = t.id
    JOIN public.subjects s ON s.id = ts.subject_id
    WHERE s.is_active = true
      AND (t.url LIKE '%/' || _object_name OR t.url LIKE '%/' || _object_name || '?%')
      AND (
        s.price <= 0
        OR EXISTS (
          SELECT 1 FROM public.user_subjects us
          WHERE us.subject_id = s.id AND us.user_id = auth.uid()
        )
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.can_access_theory_asset(text) FROM anon, authenticated;

DROP POLICY IF EXISTS "theory_assets_read" ON storage.objects;
CREATE POLICY "theory_assets_read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id IN ('theory-files','theory-images')
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.can_access_theory_asset(name)
  )
);

DROP POLICY IF EXISTS "theory_assets_read_free_anon" ON storage.objects;
CREATE POLICY "theory_assets_read_free_anon"
ON storage.objects FOR SELECT
TO anon
USING (
  bucket_id IN ('theory-files','theory-images')
  AND EXISTS (
    SELECT 1
    FROM public.theories t
    JOIN public.theory_subjects ts ON ts.theory_id = t.id
    JOIN public.subjects s ON s.id = ts.subject_id
    WHERE s.is_active = true
      AND s.price <= 0
      AND (t.url LIKE '%/' || storage.objects.name OR t.url LIKE '%/' || storage.objects.name || '?%')
  )
);
