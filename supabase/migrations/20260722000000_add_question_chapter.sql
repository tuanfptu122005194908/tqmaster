-- Add chapter_name column to questions table
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS chapter_name TEXT DEFAULT 'Tổng hợp';
