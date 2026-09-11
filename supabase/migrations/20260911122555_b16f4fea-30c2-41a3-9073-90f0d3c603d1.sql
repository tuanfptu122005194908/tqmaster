
DROP POLICY IF EXISTS "public_read_public_buckets" ON storage.objects;
CREATE POLICY "public_read_public_buckets"
ON storage.objects FOR SELECT
USING (bucket_id = ANY (ARRAY['thumbnails','qr-codes','announcement-images','avatars']));
