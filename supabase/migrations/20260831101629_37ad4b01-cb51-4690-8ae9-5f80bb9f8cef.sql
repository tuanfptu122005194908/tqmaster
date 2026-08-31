ALTER TABLE public.theories ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'theory';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'theories_category_check'
  ) THEN
    ALTER TABLE public.theories
      ADD CONSTRAINT theories_category_check CHECK (category IN ('theory', 'pe'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS theories_category_idx ON public.theories (category);