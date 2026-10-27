BEGIN TRANSACTION READ ONLY;
SELECT set_config('request.jwt.claim.sub',(SELECT user_id::text FROM public.user_roles WHERE role='admin' LIMIT 1),true);
SET LOCAL ROLE authenticated;
SET LOCAL statement_timeout = '20s';
DO $$ DECLARE plan json; BEGIN
  EXECUTE 'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT count(*) FROM public.questions' INTO plan;
  PERFORM set_config('audit.questions_plan',plan::text,true);
  EXECUTE 'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT id,created_at,final_amount,status FROM public.orders ORDER BY created_at DESC,id DESC LIMIT 10' INTO plan;
  PERFORM set_config('audit.orders_plan',plan::text,true);
  EXECUTE 'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT id,order_id,price,subject_id FROM public.order_items WHERE order_id IN (SELECT id FROM public.orders WHERE status=''approved'' LIMIT 150)' INTO plan;
  PERFORM set_config('audit.items_plan',plan::text,true);
END $$;
SELECT jsonb_build_object('questions',current_setting('audit.questions_plan')::jsonb,
  'recent_orders',current_setting('audit.orders_plan')::jsonb,
  'order_items',current_setting('audit.items_plan')::jsonb) AS plans;
COMMIT;
