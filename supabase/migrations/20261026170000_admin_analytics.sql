-- Full-table aggregates return one JSON value, independent of PostgREST row caps.
-- Every entry point checks the caller before bypassing per-row admin RLS work.
CREATE OR REPLACE FUNCTION public.admin_commerce_summary()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE result jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;
  SELECT jsonb_build_object(
    'revenue', COALESCE(SUM(final_amount) FILTER (WHERE status = 'approved'), 0),
    'approved', COUNT(*) FILTER (WHERE status = 'approved'),
    'pendingOrders', COUNT(*) FILTER (WHERE status = 'pending'),
    'rejected', COUNT(*) FILTER (WHERE status = 'rejected'),
    'orders', COUNT(*),
    'users', (SELECT COUNT(*) FROM public.profiles),
    'subjects', (SELECT COUNT(*) FROM public.subjects),
    'exams', (SELECT COUNT(*) FROM public.exams),
    'questions', (SELECT COUNT(*) FROM public.questions)
  ) INTO result FROM public.orders;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.admin_revenue_series(p_period text, p_year integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE
  local_now timestamp := statement_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh';
  first_bucket timestamp;
  end_bucket timestamp;
  step interval;
  unit text;
  result jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;
  CASE p_period
    WHEN 'day' THEN
      unit := 'day'; step := interval '1 day';
      end_bucket := date_trunc('day', local_now) + step;
      first_bucket := end_bucket - interval '14 days';
    WHEN 'week' THEN
      unit := 'week'; step := interval '1 week';
      end_bucket := date_trunc('week', local_now) + step;
      first_bucket := end_bucket - interval '8 weeks';
    WHEN 'month' THEN
      IF p_year IS NOT NULL AND p_year NOT BETWEEN 1 AND 9998 THEN
        RAISE EXCEPTION 'Invalid year' USING ERRCODE = '22023';
      END IF;
      unit := 'month'; step := interval '1 month';
      first_bucket := make_date(COALESCE(p_year, EXTRACT(year FROM local_now)::integer), 1, 1);
      end_bucket := first_bucket + interval '1 year';
    WHEN 'year' THEN
      unit := 'year'; step := interval '1 year';
      SELECT COALESCE(date_trunc('year', MIN(created_at) AT TIME ZONE 'Asia/Ho_Chi_Minh'), date_trunc('year', local_now)),
        GREATEST(COALESCE(date_trunc('year', MAX(created_at) AT TIME ZONE 'Asia/Ho_Chi_Minh'), date_trunc('year', local_now)), date_trunc('year', local_now)) + step
        INTO first_bucket, end_bucket FROM public.orders WHERE status = 'approved';
    ELSE RAISE EXCEPTION 'Invalid period' USING ERRCODE = '22023';
  END CASE;
  WITH totals AS (
    SELECT date_trunc(unit, created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') AS bucket,
      SUM(final_amount) AS revenue
    FROM public.orders
    WHERE status = 'approved'
      AND created_at >= first_bucket AT TIME ZONE 'Asia/Ho_Chi_Minh'
      AND created_at < end_bucket AT TIME ZONE 'Asia/Ho_Chi_Minh'
    GROUP BY 1
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'label', CASE p_period WHEN 'month' THEN 'T' || EXTRACT(month FROM b)::text
      WHEN 'year' THEN 'Năm ' || EXTRACT(year FROM b)::text ELSE to_char(b, 'DD/MM') END,
    'start', b AT TIME ZONE 'Asia/Ho_Chi_Minh',
    'revenue', COALESCE(t.revenue, 0)
  ) ORDER BY b), '[]'::jsonb) INTO result
  FROM generate_series(first_bucket, end_bucket - step, step) AS buckets(b)
  LEFT JOIN totals t ON t.bucket = b;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.admin_subject_sales(p_range text DEFAULT 'all', p_limit integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE
  local_today timestamp := date_trunc('day', statement_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh');
  since_time timestamptz;
  until_time timestamptz;
  result jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;
  IF p_limit IS NOT NULL AND p_limit < 1 THEN
    RAISE EXCEPTION 'Invalid limit' USING ERRCODE = '22023';
  END IF;
  CASE p_range
    WHEN 'all' THEN since_time := '-infinity'; until_time := 'infinity';
    WHEN 'week' THEN
      since_time := (local_today - interval '6 days') AT TIME ZONE 'Asia/Ho_Chi_Minh';
      until_time := (local_today + interval '1 day') AT TIME ZONE 'Asia/Ho_Chi_Minh';
    WHEN 'month' THEN
      since_time := (local_today - interval '29 days') AT TIME ZONE 'Asia/Ho_Chi_Minh';
      until_time := (local_today + interval '1 day') AT TIME ZONE 'Asia/Ho_Chi_Minh';
    WHEN 'year' THEN
      since_time := date_trunc('year', local_today) AT TIME ZONE 'Asia/Ho_Chi_Minh';
      until_time := (date_trunc('year', local_today) + interval '1 year') AT TIME ZONE 'Asia/Ho_Chi_Minh';
    ELSE RAISE EXCEPTION 'Invalid range' USING ERRCODE = '22023';
  END CASE;
  WITH approved AS MATERIALIZED (
    SELECT id, final_amount FROM public.orders
    WHERE status = 'approved' AND created_at >= since_time AND created_at < until_time
  ), items AS (
    SELECT i.id, i.order_id, i.subject_id, i.price, a.final_amount,
      SUM(GREATEST(i.price, 0)) OVER (PARTITION BY i.order_id) AS weight
    FROM public.order_items i JOIN approved a ON a.id = i.order_id
  ), shares AS (
    SELECT *, final_amount * GREATEST(price, 0) / weight AS share FROM items WHERE weight > 0
  ), ranked AS (
    SELECT *, floor(share) AS base,
      ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY share - floor(share) DESC, id) AS rank,
      final_amount - SUM(floor(share)) OVER (PARTITION BY order_id) AS remaining
    FROM shares
  ), allocated AS (
    SELECT id, base + CASE WHEN rank <= remaining THEN 1 ELSE 0 END AS net FROM ranked
  ), sales AS (
    SELECT i.subject_id AS id, COALESCE(s.name, 'Môn học đã xóa') AS name,
      COUNT(*) AS count, SUM(i.price) AS gross, SUM(COALESCE(a.net, 0)) AS revenue
    FROM items i LEFT JOIN public.subjects s ON s.id = i.subject_id
    LEFT JOIN allocated a ON a.id = i.id
    GROUP BY i.subject_id, s.name
  ), selected AS (
    SELECT * FROM sales ORDER BY revenue DESC, id LIMIT p_limit
  )
  SELECT jsonb_build_object(
    'rows', COALESCE((SELECT jsonb_agg(to_jsonb(s) ORDER BY revenue DESC, id) FROM selected s), '[]'::jsonb),
    'total', COALESCE((SELECT SUM(final_amount) FROM approved), 0),
    'gross', COALESCE((SELECT SUM(price) FROM items), 0),
    'count', (SELECT COUNT(*) FROM items),
    'unallocated', COALESCE((SELECT SUM(final_amount) FROM approved a
      WHERE NOT EXISTS (SELECT 1 FROM items i WHERE i.order_id = a.id AND i.weight > 0)), 0)
  ) INTO result;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.admin_exam_statistics()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE result jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;
  WITH correct AS MATERIALIZED (
    SELECT q.exam_id, o.question_id, upper(o.label) AS label
    FROM public.question_options o JOIN public.questions q ON q.id = o.question_id
    WHERE o.is_correct
  ), label_counts AS (
    SELECT exam_id, label, COUNT(*) AS n FROM correct GROUP BY exam_id, label
  ), answers AS (
    SELECT exam_id, jsonb_object_agg(label, n) AS counts FROM label_counts GROUP BY exam_id
  ), question_counts AS (
    SELECT q.exam_id, COUNT(*) AS total,
      COUNT(*) FILTER (WHERE c.question_id IS NULL) AS missing
    FROM public.questions q LEFT JOIN (SELECT DISTINCT question_id FROM correct) c ON c.question_id = q.id
    GROUP BY q.exam_id
  ), stats AS MATERIALIZED (
    SELECT e.id, jsonb_build_object('exam', jsonb_build_object('id', e.id, 'title', e.title),
      'totalQ', COALESCE(q.total, 0), 'noAnswer', COALESCE(q.missing, 0),
      'counts', COALESCE(a.counts, '{}'::jsonb)) AS stat
    FROM public.exams e LEFT JOIN question_counts q ON q.exam_id = e.id
    LEFT JOIN answers a ON a.exam_id = e.id
  ), grouped AS (
    SELECT s.semester, s.name, s.id::text AS id, jsonb_build_object(
      'subject', jsonb_build_object('id', s.id, 'name', s.name, 'semester', s.semester),
      'exams', jsonb_agg(st.stat ORDER BY st.stat->'exam'->>'title', st.id)) AS data
    FROM public.subjects s JOIN public.exam_subjects es ON es.subject_id = s.id
    JOIN stats st ON st.id = es.exam_id GROUP BY s.id, s.name, s.semester
    UNION ALL
    SELECT 0, 'Chưa gắn môn học', '__unlinked__', jsonb_build_object(
      'subject', jsonb_build_object('id', '__unlinked__', 'name', 'Chưa gắn môn học', 'semester', 0),
      'exams', jsonb_agg(st.stat ORDER BY st.stat->'exam'->>'title', st.id))
    FROM stats st WHERE NOT EXISTS (SELECT 1 FROM public.exam_subjects es WHERE es.exam_id = st.id)
    HAVING COUNT(*) > 0
  )
  SELECT jsonb_build_object(
    'groups', COALESCE((SELECT jsonb_agg(data ORDER BY semester, name, id) FROM grouped), '[]'::jsonb),
    'exams', COALESCE((SELECT jsonb_agg(stat ORDER BY id) FROM stats), '[]'::jsonb)
  ) INTO result;
  RETURN result;
END $$;

REVOKE ALL ON FUNCTION public.admin_commerce_summary() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_revenue_series(text, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_subject_sales(text, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_exam_statistics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_commerce_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revenue_series(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_subject_sales(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_exam_statistics() TO authenticated;

-- Verified on the live project: count(questions) under admin RLS took 2.46s.
-- Keep the same permissions, but evaluate statement-constant role checks once.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='questions' AND policyname='admins_manage_questions') THEN
    ALTER POLICY admins_manage_questions ON public.questions
      USING ((SELECT public.has_role(auth.uid(), 'admin')))
      WITH CHECK ((SELECT public.has_role(auth.uid(), 'admin')));
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='questions' AND policyname='users_view_questions_of_accessible_exams') THEN
    -- CASE prevents the planner from moving can_access_exam ahead of the cheap
    -- admin check (the measured OR plan still evaluated it for every row).
    ALTER POLICY users_view_questions_of_accessible_exams ON public.questions
      USING (CASE WHEN (SELECT public.has_role(auth.uid(), 'admin')) THEN true
        ELSE public.can_access_exam(exam_id) END);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='orders' AND policyname='users_view_own_orders') THEN
    ALTER POLICY users_view_own_orders ON public.orders
      USING (user_id = (SELECT auth.uid()) OR (SELECT public.has_role(auth.uid(), 'admin')));
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='order_items' AND policyname='admins_manage_order_items') THEN
    ALTER POLICY admins_manage_order_items ON public.order_items
      USING ((SELECT public.has_role(auth.uid(), 'admin')))
      WITH CHECK ((SELECT public.has_role(auth.uid(), 'admin')));
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='order_items' AND policyname='users_view_own_order_items') THEN
    ALTER POLICY users_view_own_order_items ON public.order_items
      USING ((SELECT public.has_role(auth.uid(), 'admin')) OR EXISTS (
        SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = (SELECT auth.uid())
      ));
  END IF;
END $$;

-- The live plan sorted/scanned all orders for the latest 10; item lookups had
-- no order_id index. These support existing reads as well as future growth.
CREATE INDEX IF NOT EXISTS idx_orders_created_id ON public.orders (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);
NOTIFY pgrst, 'reload schema';
