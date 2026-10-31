-- Migration: 20261031160000_purge_old_attempt_answers.sql
-- Description: RPC function and automated cron to purge attempt_answers older than 1 day

CREATE OR REPLACE FUNCTION public.purge_old_attempt_answers(days_old int DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count bigint;
BEGIN
  -- Only purge answer details of exams submitted more than `days_old` days ago.
  -- All score history, correct count, time taken, user rank in exam_attempts remain 100% intact.
  WITH old_attempts AS (
    SELECT id FROM public.exam_attempts
    WHERE submitted_at < NOW() - (days_old || ' days')::interval
  ),
  deleted AS (
    DELETE FROM public.attempt_answers
    WHERE attempt_id IN (SELECT id FROM old_attempts)
    RETURNING id
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_rows', v_deleted_count,
    'purged_at', NOW()
  );
END;
$$;

-- Grant execute
REVOKE EXECUTE ON FUNCTION public.purge_old_attempt_answers(int) FROM public;
GRANT EXECUTE ON FUNCTION public.purge_old_attempt_answers(int) TO service_role;
GRANT EXECUTE ON FUNCTION public.purge_old_attempt_answers(int) TO authenticated;

-- Schedule automatic daily cleanup at 03:00 UTC via pg_cron
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('purge-old-attempt-answers')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-old-attempt-answers');

    PERFORM cron.schedule(
      'purge-old-attempt-answers',
      '0 3 * * *',
      'SELECT public.purge_old_attempt_answers(1);'
    );
  END IF;
END $$;

