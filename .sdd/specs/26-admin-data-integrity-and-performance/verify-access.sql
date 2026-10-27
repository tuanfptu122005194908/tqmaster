BEGIN TRANSACTION READ ONLY;
SELECT set_config('request.jwt.claim.sub',(SELECT p.id::text FROM public.profiles p
  WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id=p.id AND r.role='admin') LIMIT 1),true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE command text; BEGIN
  FOREACH command IN ARRAY ARRAY[
    'SELECT public.admin_commerce_summary()', 'SELECT public.admin_revenue_series(''day'')',
    'SELECT public.admin_subject_sales()', 'SELECT public.admin_exam_statistics()'
  ] LOOP
    BEGIN
      EXECUTE command;
      RAISE EXCEPTION 'Non-admin unexpectedly accessed analytics';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
  END LOOP;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ DECLARE command text; BEGIN
  FOREACH command IN ARRAY ARRAY[
    'SELECT public.admin_commerce_summary()', 'SELECT public.admin_revenue_series(''day'')',
    'SELECT public.admin_subject_sales()', 'SELECT public.admin_exam_statistics()'
  ] LOOP
    BEGIN
      EXECUTE command;
      RAISE EXCEPTION 'Anonymous role unexpectedly accessed analytics';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
  END LOOP;
END $$;
SELECT true AS authenticated_non_admin_denied, true AS anonymous_denied;
COMMIT;
