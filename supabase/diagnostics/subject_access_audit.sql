-- Run with the database owner's SQL connection (or an equivalent admin role).
-- An anon/unprivileged connection can hide rows through RLS and is not an audit.
-- This report does not change any grant or order. Missing rows still need review
-- for intentional revocations before preparing a separate repair.
BEGIN TRANSACTION READ ONLY;

SELECT
  o.user_id,
  oi.subject_id,
  s.name AS subject_name,
  array_agg(DISTINCT o.id ORDER BY o.id) AS approved_order_ids,
  min(o.created_at) AS earliest_order_created_at
FROM public.orders o
JOIN public.order_items oi ON oi.order_id = o.id
JOIN public.subjects s ON s.id = oi.subject_id
LEFT JOIN public.user_subjects us
  ON us.user_id = o.user_id AND us.subject_id = oi.subject_id
WHERE o.status = 'approved'
  AND us.id IS NULL
-- To inspect one account, add: AND o.user_id = '<account UUID>'::uuid
GROUP BY o.user_id, oi.subject_id, s.name
ORDER BY o.user_id, s.name, oi.subject_id;

ROLLBACK;
