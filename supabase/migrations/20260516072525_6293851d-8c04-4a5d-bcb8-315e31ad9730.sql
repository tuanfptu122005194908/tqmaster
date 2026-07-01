
-- Enable pg_cron if not already
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function: delete unverified users older than 24h
CREATE OR REPLACE FUNCTION public.cleanup_unverified_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  DELETE FROM auth.users
  WHERE email_confirmed_at IS NULL
    AND created_at < now() - interval '24 hours';
END;
$$;

-- Schedule hourly (unschedule first if exists)
DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-unverified-users');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'cleanup-unverified-users',
  '0 * * * *',
  $$ SELECT public.cleanup_unverified_users(); $$
);
