-- Migration: Cho phép User đã mua môn học (hoặc môn miễn phí) truy cập các ảnh đề thi PE đã trích xuất từ file ZIP
-- Các ảnh này được lưu trong bucket 'theory-images' (hoặc 'theory-files') với tiền tố 'pe-extracts/<theory_id>/...'
-- và danh sách URL được lưu trong trường description (metadata <!--PE_META:...-->) của bảng theories.

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
      AND (
        t.url LIKE '%/' || _object_name 
        OR t.url LIKE '%/' || _object_name || '?%'
        OR t.description LIKE '%' || _object_name || '%'
        OR (_object_name LIKE 'pe-extracts/' || t.id::text || '/%')
      )
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
GRANT EXECUTE ON FUNCTION public.can_access_theory_asset(text) TO authenticated, service_role;

-- Cập nhật policy cho authenticated users đọc theory-files và theory-images
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

-- Cập nhật policy cho anon users đọc tài liệu của môn học miễn phí (price <= 0)
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
      AND (
        t.url LIKE '%/' || storage.objects.name 
        OR t.url LIKE '%/' || storage.objects.name || '?%'
        OR t.description LIKE '%' || storage.objects.name || '%'
        OR (storage.objects.name LIKE 'pe-extracts/' || t.id::text || '/%')
      )
  )
);
