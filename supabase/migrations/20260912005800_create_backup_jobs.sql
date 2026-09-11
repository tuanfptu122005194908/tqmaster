CREATE TABLE public.backup_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  file_path text,
  file_name text,
  file_size bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  include_media boolean NOT NULL DEFAULT false,
  tables jsonb NOT NULL DEFAULT '[]'::jsonb,
  progress numeric NOT NULL DEFAULT 0,
  step text,
  manifest jsonb,
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  heartbeat_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.backup_jobs TO authenticated;
GRANT ALL ON public.backup_jobs TO service_role;

ALTER TABLE public.backup_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view backup jobs"
  ON public.backup_jobs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create backup jobs"
  ON public.backup_jobs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid());

CREATE POLICY "Admins can update backup jobs"
  ON public.backup_jobs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete backup jobs"
  ON public.backup_jobs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_backup_jobs_updated_at
  BEFORE UPDATE ON public.backup_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_backup_jobs_created_at ON public.backup_jobs (created_at DESC);
