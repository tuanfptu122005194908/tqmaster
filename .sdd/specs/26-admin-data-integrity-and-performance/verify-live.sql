BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY;
SELECT set_config('request.jwt.claim.sub',(SELECT user_id::text FROM public.user_roles WHERE role='admin' LIMIT 1),true);
SET LOCAL ROLE authenticated;
SET LOCAL statement_timeout='20s';
DO $$ DECLARE
  summary jsonb; sales jsonb; series jsonb; statistics jsonb; checks jsonb; plan json;
BEGIN
  summary := public.admin_commerce_summary();
  sales := public.admin_subject_sales();
  series := public.admin_revenue_series('year');
  statistics := public.admin_exam_statistics();
  checks := jsonb_build_object(
    'summary',summary,
    'revenue_matches_database',(summary->>'revenue')::numeric = (SELECT coalesce(sum(final_amount),0) FROM public.orders WHERE status='approved'),
    'subject_net_reconciles',(SELECT coalesce(sum((x->>'revenue')::numeric),0) FROM jsonb_array_elements(sales->'rows') x) + (sales->>'unallocated')::numeric = (summary->>'revenue')::numeric,
    'unallocated_subject_revenue',(sales->>'unallocated')::numeric,
    'annual_series_reconciles',(SELECT coalesce(sum((x->>'revenue')::numeric),0) FROM jsonb_array_elements(series) x) = (summary->>'revenue')::numeric,
    'unique_exam_count_matches',jsonb_array_length(statistics->'exams') = (SELECT count(*) FROM public.exams),
    'question_count_matches',(SELECT coalesce(sum((x->>'totalQ')::bigint),0) FROM jsonb_array_elements(statistics->'exams') x) = (SELECT count(*) FROM public.questions)
  );
  PERFORM set_config('audit.validation',checks::text,true);
  EXECUTE 'EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) SELECT public.admin_commerce_summary()' INTO plan;
  PERFORM set_config('audit.summary_plan',plan::text,true);
  EXECUTE 'EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) SELECT public.admin_exam_statistics()' INTO plan;
  PERFORM set_config('audit.statistics_plan',plan::text,true);
END $$;
SELECT jsonb_build_object('validation',current_setting('audit.validation')::jsonb,
  'summary_plan',current_setting('audit.summary_plan')::jsonb,
  'exam_statistics_plan',current_setting('audit.statistics_plan')::jsonb) AS verification;
COMMIT;
