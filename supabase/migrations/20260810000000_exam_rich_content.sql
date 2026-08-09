-- Migration: Rich Text Exam Support
-- Adds extra_images (array of image URLs) to questions
-- Adds image_url to question_options for inline option images

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS extra_images TEXT[] DEFAULT '{}';

ALTER TABLE public.question_options
  ADD COLUMN IF NOT EXISTS image_url TEXT;
