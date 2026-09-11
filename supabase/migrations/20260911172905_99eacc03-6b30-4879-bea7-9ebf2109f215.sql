CREATE POLICY "Admins manage backup uploads"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'backup-uploads' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'backup-uploads' AND public.has_role(auth.uid(), 'admin'));