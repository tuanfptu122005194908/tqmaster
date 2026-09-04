-- ========================================================
-- Migration: Ensure both 'question-images' and 'exam-images' exist
-- and have public read and admin manage policies
-- ========================================================

-- 1. Ensure buckets exist with public access
INSERT INTO storage.buckets (id, name, public) VALUES
  ('question-images', 'question-images', TRUE),
  ('exam-images',     'exam-images',     TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

-- 2. Public read policy for exam-images & question-images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
      AND schemaname = 'storage' 
      AND policyname = 'public_read_exam_and_question_images'
  ) THEN
    CREATE POLICY "public_read_exam_and_question_images" ON storage.objects
      FOR SELECT USING (bucket_id IN ('question-images', 'exam-images'));
  END IF;
END $$;

-- 3. Authenticated user / admin upload policy for exam-images & question-images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
      AND schemaname = 'storage' 
      AND policyname = 'authenticated_upload_exam_images'
  ) THEN
    CREATE POLICY "authenticated_upload_exam_images" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id IN ('question-images', 'exam-images'));
  END IF;
END $$;
