-- Ensure RLS is enabled
ALTER TABLE public.question_reports ENABLE ROW LEVEL SECURITY;

-- Drop any potentially broken or leftover policies
DROP POLICY IF EXISTS "users_insert_own_reports" ON public.question_reports;
DROP POLICY IF EXISTS "users_view_own_reports" ON public.question_reports;
DROP POLICY IF EXISTS "admins_view_all_reports" ON public.question_reports;
DROP POLICY IF EXISTS "admins_update_reports" ON public.question_reports;
DROP POLICY IF EXISTS "admins_delete_reports" ON public.question_reports;
DROP POLICY IF EXISTS "question_reports_insert_policy" ON public.question_reports;
DROP POLICY IF EXISTS "question_reports_select_policy" ON public.question_reports;
DROP POLICY IF EXISTS "question_reports_update_policy" ON public.question_reports;
DROP POLICY IF EXISTS "question_reports_delete_policy" ON public.question_reports;

-- 1. Allow authenticated users to insert reports for themselves
CREATE POLICY "users_insert_own_reports"
ON public.question_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Allow users to view their own reports
CREATE POLICY "users_view_own_reports"
ON public.question_reports
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. Allow admins to view all reports
CREATE POLICY "admins_view_all_reports"
ON public.question_reports
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 4. Allow admins to update reports (e.g., mark status resolved/pending)
CREATE POLICY "admins_update_reports"
ON public.question_reports
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 5. Allow admins to delete reports
CREATE POLICY "admins_delete_reports"
ON public.question_reports
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Ensure grants are in place
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_reports TO authenticated;
GRANT ALL ON public.question_reports TO service_role;
