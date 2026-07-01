
-- News posts
CREATE TABLE public.news_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  images text[] NOT NULL DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_view_news_posts" ON public.news_posts FOR SELECT USING (true);
CREATE POLICY "admins_manage_news_posts" ON public.news_posts FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER news_posts_updated_at BEFORE UPDATE ON public.news_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Likes
CREATE TABLE public.news_likes (
  post_id uuid NOT NULL REFERENCES public.news_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
ALTER TABLE public.news_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_view_news_likes" ON public.news_likes FOR SELECT USING (true);
CREATE POLICY "users_insert_own_like" ON public.news_likes FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "users_delete_own_like" ON public.news_likes FOR DELETE
  USING (user_id = auth.uid());

-- Comments
CREATE TABLE public.news_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.news_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.news_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_view_news_comments" ON public.news_comments FOR SELECT USING (true);
CREATE POLICY "users_insert_own_comment" ON public.news_comments FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "users_delete_own_comment" ON public.news_comments FOR DELETE
  USING (user_id = auth.uid());
CREATE POLICY "admins_delete_any_comment" ON public.news_comments FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_news_comments_post ON public.news_comments(post_id, created_at);
CREATE INDEX idx_news_likes_post ON public.news_likes(post_id);

-- Storage bucket for news images
INSERT INTO storage.buckets (id, name, public) VALUES ('news-images', 'news-images', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "news_images_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'news-images');
CREATE POLICY "news_images_admin_write" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'news-images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "news_images_admin_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'news-images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "news_images_admin_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'news-images' AND has_role(auth.uid(), 'admin'::app_role));
