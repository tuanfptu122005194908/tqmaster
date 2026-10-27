BEGIN TRANSACTION READ ONLY;
WITH sample AS (
  SELECT status,final_amount FROM public.orders WHERE created_at >= now()-interval '400 days' ORDER BY created_at DESC LIMIT 1000
), totals AS (
  SELECT jsonb_build_object('orders',count(*),'approved',count(*) FILTER(WHERE status='approved'),
    'pending',count(*) FILTER(WHERE status='pending'),'revenue',coalesce(sum(final_amount) FILTER(WHERE status='approved'),0),
    'dashboard_sample_revenue',(SELECT coalesce(sum(final_amount),0) FROM sample WHERE status='approved'),
    'approved_older_than_400_days',count(*) FILTER(WHERE status='approved' AND created_at<now()-interval '400 days')) AS data FROM public.orders
)
SELECT jsonb_build_object('totals',(SELECT data FROM totals),
  'indexes',(SELECT jsonb_agg(jsonb_build_object('table',tablename,'definition',indexdef)) FROM pg_indexes WHERE schemaname='public' AND tablename IN ('orders','order_items','questions','question_options','exam_subjects')),
  'columns',(SELECT jsonb_agg(jsonb_build_object('table',table_name,'column',column_name,'type',data_type)) FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('orders','order_items','subjects','exam_subjects','questions','question_options')),
  'migration_tracking',to_regclass('supabase_migrations.schema_migrations')::text
) AS diagnostics;
COMMIT;
