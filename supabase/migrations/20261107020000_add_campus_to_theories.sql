-- Spec 44: Add campus column to theories table for PE exam documents
-- Supports 5 FPT campuses: HaNoi (default), HCM, CanTho, DaNang, QuyNhon

ALTER TABLE theories
  ADD COLUMN IF NOT EXISTS campus TEXT DEFAULT 'HaNoi'
    CHECK (campus IN ('HaNoi', 'HCM', 'CanTho', 'DaNang', 'QuyNhon'));

-- Backfill existing PE records with default campus (HaNoi)
UPDATE theories
SET campus = 'HaNoi'
WHERE campus IS NULL;

COMMENT ON COLUMN theories.campus IS
  'FPT campus the PE exam document belongs to: HaNoi | HCM | CanTho | DaNang | QuyNhon';

