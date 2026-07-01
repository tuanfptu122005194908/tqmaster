-- Change unverified account cleanup from 24h to 10 minutes
CREATE OR REPLACE FUNCTION public.cleanup_unverified_users()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  DELETE FROM auth.users
  WHERE email_confirmed_at IS NULL
    AND created_at < now() - interval '10 minutes';
END;
$function$;

-- Run the cleanup more frequently (every minute) so 10-minute window is enforced promptly
DO $$
DECLARE
  jid bigint;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'cleanup-unverified-users';
  IF jid IS NOT NULL THEN
    PERFORM cron.alter_job(jid, schedule := '* * * * *');
  END IF;
END $$;