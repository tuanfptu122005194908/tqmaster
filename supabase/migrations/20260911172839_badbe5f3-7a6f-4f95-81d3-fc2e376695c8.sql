CREATE TABLE public.restore_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  dry_run boolean NOT NULL DEFAULT false,
  include_media boolean NOT NULL DEFAULT true,
  tables jsonb NOT NULL DEFAULT '[]'::jsonb,
  progress numeric NOT NULL DEFAULT 0,
  step text,
  cursor jsonb NOT NULL DEFAULT '{}'::jsonb,
  report jsonb,
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  heartbeat_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.restore_jobs TO authenticated;
GRANT ALL ON public.restore_jobs TO service_role;

ALTER TABLE public.restore_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view restore jobs"
  ON public.restore_jobs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create restore jobs"
  ON public.restore_jobs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid());

CREATE POLICY "Admins can update restore jobs"
  ON public.restore_jobs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete restore jobs"
  ON public.restore_jobs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_restore_jobs_updated_at
  BEFORE UPDATE ON public.restore_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_restore_jobs_created_at ON public.restore_jobs (created_at DESC);