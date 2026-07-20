
-- system_settings: restrict read to authenticated users
DROP POLICY IF EXISTS public_read_settings ON public.system_settings;
CREATE POLICY "authenticated_read_settings" ON public.system_settings
  FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.system_settings FROM anon;

-- exam_subjects
DROP POLICY IF EXISTS view_exam_subjects ON public.exam_subjects;
CREATE POLICY "authenticated_view_exam_subjects" ON public.exam_subjects
  FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.exam_subjects FROM anon;

-- theory_subjects
DROP POLICY IF EXISTS view_theory_subjects ON public.theory_subjects;
CREATE POLICY "authenticated_view_theory_subjects" ON public.theory_subjects
  FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.theory_subjects FROM anon;

-- news_posts
DROP POLICY IF EXISTS public_view_news_posts ON public.news_posts;
CREATE POLICY "authenticated_view_news_posts" ON public.news_posts
  FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.news_posts FROM anon;

-- news_comments
DROP POLICY IF EXISTS public_view_news_comments ON public.news_comments;
CREATE POLICY "authenticated_view_news_comments" ON public.news_comments
  FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.news_comments FROM anon;

-- news_likes
DROP POLICY IF EXISTS public_view_news_likes ON public.news_likes;
CREATE POLICY "authenticated_view_news_likes" ON public.news_likes
  FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.news_likes FROM anon;
