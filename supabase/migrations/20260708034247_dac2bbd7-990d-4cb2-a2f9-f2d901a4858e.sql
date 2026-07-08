ALTER TABLE public.announcements ALTER COLUMN subject_id DROP NOT NULL;

DROP POLICY IF EXISTS users_view_accessible_announcements ON public.announcements;
CREATE POLICY users_view_accessible_announcements ON public.announcements
FOR SELECT USING (
  subject_id IS NULL
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM user_subjects us
    WHERE us.subject_id = announcements.subject_id AND us.user_id = auth.uid()
  )
);