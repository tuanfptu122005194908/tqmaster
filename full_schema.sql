
-- =========================================
-- ENUMS
-- =========================================
CREATE TYPE public.app_role AS ENUM ('user', 'admin');

-- =========================================
-- 1. PROFILES
-- =========================================
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT NOT NULL UNIQUE,
  full_name     TEXT,
  email         TEXT NOT NULL UNIQUE,
  student_code  TEXT,
  avatar_url    TEXT,
  phone         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 2. USER_ROLES (tÃ¡ch riÃªng Ä‘á»ƒ chá»‘ng privilege escalation)
-- =========================================
CREATE TABLE public.user_roles (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role    public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function Ä‘á»ƒ check role (trÃ¡nh recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- =========================================
-- 3. SUBJECTS
-- =========================================
CREATE TABLE public.subjects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  semester      INT NOT NULL CHECK (semester BETWEEN 1 AND 9),
  price         NUMERIC(12,0) NOT NULL DEFAULT 0,
  description   TEXT,
  thumbnail_url TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order    INT DEFAULT 0,
  created_by    UUID REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 4. USER_SUBJECTS
-- =========================================
CREATE TABLE public.user_subjects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  granted_by TEXT NOT NULL DEFAULT 'order' CHECK (granted_by IN ('order', 'manual', 'admin')),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, subject_id)
);
ALTER TABLE public.user_subjects ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 5. EXAMS
-- =========================================
CREATE TABLE public.exams (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  description  TEXT,
  duration_min INT NOT NULL DEFAULT 60,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_by   UUID REFERENCES public.profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.exam_subjects (
  exam_id    UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (exam_id, subject_id)
);
ALTER TABLE public.exam_subjects ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 6. QUESTIONS + OPTIONS
-- =========================================
CREATE TABLE public.questions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id    UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  order_num  INT NOT NULL,
  content    TEXT,
  image_url  TEXT,
  type       TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('text', 'image')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.question_options (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  label       CHAR(1) NOT NULL,
  content     TEXT,
  is_correct  BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(question_id, label)
);
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 7. EXAM ATTEMPTS + ANSWERS
-- =========================================
CREATE TABLE public.exam_attempts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exam_id      UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  mode         TEXT NOT NULL DEFAULT 'practice' CHECK (mode IN ('practice', 'test')),
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  score        NUMERIC(5,2),
  total_q      INT,
  correct_q    INT
);
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.attempt_answers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id  UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected    TEXT[] NOT NULL DEFAULT '{}',
  is_correct  BOOLEAN,
  UNIQUE(attempt_id, question_id)
);
ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 8. THEORIES
-- =========================================
CREATE TABLE public.theories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  type        TEXT NOT NULL CHECK (type IN ('image', 'file', 'link')),
  url         TEXT NOT NULL,
  file_name   TEXT,
  sort_order  INT DEFAULT 0,
  created_by  UUID REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.theories ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.theory_subjects (
  theory_id  UUID NOT NULL REFERENCES public.theories(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (theory_id, subject_id)
);
ALTER TABLE public.theory_subjects ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 9. ANNOUNCEMENTS
-- =========================================
CREATE TABLE public.announcements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  content    TEXT,
  image_url  TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 10. DISCOUNT CODES
-- =========================================
CREATE TABLE public.discount_codes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent', 'fixed')),
  value         NUMERIC(12,2) NOT NULL,
  max_uses      INT,
  used_count    INT NOT NULL DEFAULT 0,
  expires_at    TIMESTAMPTZ,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_by    UUID REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 11. ORDERS + ITEMS
-- =========================================
CREATE TABLE public.orders (
  id              TEXT PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  student_code    TEXT NOT NULL,
  email           TEXT NOT NULL,
  discount_code   TEXT REFERENCES public.discount_codes(code),
  original_amount NUMERIC(12,0) NOT NULL,
  discount_amount NUMERIC(12,0) NOT NULL DEFAULT 0,
  final_amount    NUMERIC(12,0) NOT NULL,
  bill_image_url  TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  note            TEXT,
  reviewed_by     UUID REFERENCES public.profiles(id),
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.order_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id),
  price      NUMERIC(12,0) NOT NULL
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 12. SYSTEM SETTINGS
-- =========================================
CREATE TABLE public.system_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.system_settings (key, value) VALUES
  ('bank_name',     'Vietcombank'),
  ('bank_account',  ''),
  ('bank_owner',    ''),
  ('bank_content',  'Thanh toan tai lieu'),
  ('bank_qr_url',   ''),
  ('contact_info',  ''),
  ('site_name',     'EduDocs'),
  ('site_logo_url', '');

-- =========================================
-- INDEXES
-- =========================================
CREATE INDEX idx_subjects_semester    ON public.subjects(semester);
CREATE INDEX idx_orders_user_id       ON public.orders(user_id);
CREATE INDEX idx_orders_status        ON public.orders(status);
CREATE INDEX idx_user_subjects_user   ON public.user_subjects(user_id);
CREATE INDEX idx_user_subjects_subj   ON public.user_subjects(subject_id);
CREATE INDEX idx_questions_exam       ON public.questions(exam_id, order_num);
CREATE INDEX idx_theory_subjects      ON public.theory_subjects(subject_id);
CREATE INDEX idx_announcements_subject ON public.announcements(subject_id, created_at DESC);
CREATE INDEX idx_discount_code        ON public.discount_codes(code) WHERE is_active = TRUE;

-- =========================================
-- TRIGGERS: updated_at
-- =========================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at      BEFORE UPDATE ON public.profiles      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_subjects_updated_at      BEFORE UPDATE ON public.subjects      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_exams_updated_at         BEFORE UPDATE ON public.exams         FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_theories_updated_at      BEFORE UPDATE ON public.theories      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_orders_updated_at        BEFORE UPDATE ON public.orders        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =========================================
-- TRIGGER: Auto-create profile + default user role
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  suffix INT := 0;
BEGIN
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  final_username := base_username;

  -- Äáº£m báº£o username unique
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    suffix := suffix + 1;
    final_username := base_username || suffix::TEXT;
  END LOOP;

  INSERT INTO public.profiles (id, email, username, full_name, student_code, phone)
  VALUES (
    NEW.id,
    NEW.email,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'student_code',
    NEW.raw_user_meta_data->>'phone'
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- TRIGGER: Cáº¥p quyá»n mÃ´n khi Ä‘Æ¡n Ä‘Æ°á»£c duyá»‡t
-- =========================================
CREATE OR REPLACE FUNCTION public.grant_subject_access_on_approve()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
    INSERT INTO public.user_subjects (user_id, subject_id, granted_by)
    SELECT NEW.user_id, oi.subject_id, 'order'
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
    ON CONFLICT (user_id, subject_id) DO NOTHING;
  END IF;

  IF NEW.status = 'rejected' AND OLD.status = 'approved' THEN
    DELETE FROM public.user_subjects
    WHERE user_id = NEW.user_id
      AND subject_id IN (SELECT subject_id FROM public.order_items WHERE order_id = NEW.id)
      AND granted_by = 'order';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_order_approved
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.grant_subject_access_on_approve();

-- =========================================
-- RLS POLICIES
-- =========================================

-- PROFILES
CREATE POLICY "users_view_own_profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own_profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "admins_view_all_profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins_update_all_profiles" ON public.profiles
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- USER_ROLES
CREATE POLICY "users_view_own_roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "admins_manage_roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- SUBJECTS
CREATE POLICY "public_view_active_subjects" ON public.subjects
  FOR SELECT USING (is_active = TRUE OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins_manage_subjects" ON public.subjects
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- USER_SUBJECTS
CREATE POLICY "users_view_own_access" ON public.user_subjects
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "admins_manage_user_subjects" ON public.user_subjects
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- EXAMS - chá»‰ user cÃ³ quyá»n mÃ´n liÃªn quan má»›i xem Ä‘Æ°á»£c
CREATE POLICY "users_view_accessible_exams" ON public.exams
  FOR SELECT USING (
    is_active = TRUE AND (
      public.has_role(auth.uid(), 'admin') OR
      EXISTS (
        SELECT 1 FROM public.exam_subjects es
        JOIN public.user_subjects us ON us.subject_id = es.subject_id
        WHERE es.exam_id = exams.id AND us.user_id = auth.uid()
      )
    )
  );
CREATE POLICY "admins_manage_exams" ON public.exams
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- EXAM_SUBJECTS
CREATE POLICY "view_exam_subjects" ON public.exam_subjects
  FOR SELECT USING (TRUE);
CREATE POLICY "admins_manage_exam_subjects" ON public.exam_subjects
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- QUESTIONS
CREATE POLICY "users_view_questions_of_accessible_exams" ON public.questions
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.exams e
      JOIN public.exam_subjects es ON es.exam_id = e.id
      JOIN public.user_subjects us ON us.subject_id = es.subject_id
      WHERE e.id = questions.exam_id AND us.user_id = auth.uid() AND e.is_active = TRUE
    )
  );
CREATE POLICY "admins_manage_questions" ON public.questions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- QUESTION_OPTIONS
CREATE POLICY "users_view_options_of_accessible_questions" ON public.question_options
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.exams e ON e.id = q.exam_id
      JOIN public.exam_subjects es ON es.exam_id = e.id
      JOIN public.user_subjects us ON us.subject_id = es.subject_id
      WHERE q.id = question_options.question_id AND us.user_id = auth.uid() AND e.is_active = TRUE
    )
  );
CREATE POLICY "admins_manage_options" ON public.question_options
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- EXAM_ATTEMPTS
CREATE POLICY "users_view_own_attempts" ON public.exam_attempts
  FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users_create_own_attempts" ON public.exam_attempts
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "users_update_own_attempts" ON public.exam_attempts
  FOR UPDATE USING (user_id = auth.uid());

-- ATTEMPT_ANSWERS
CREATE POLICY "users_view_own_answers" ON public.attempt_answers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.exam_attempts WHERE id = attempt_answers.attempt_id AND user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "users_manage_own_answers" ON public.attempt_answers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.exam_attempts WHERE id = attempt_answers.attempt_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.exam_attempts WHERE id = attempt_answers.attempt_id AND user_id = auth.uid())
  );

-- THEORIES - chá»‰ user cÃ³ quyá»n mÃ´n liÃªn quan má»›i xem Ä‘Æ°á»£c
CREATE POLICY "users_view_accessible_theories" ON public.theories
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.theory_subjects ts
      JOIN public.user_subjects us ON us.subject_id = ts.subject_id
      WHERE ts.theory_id = theories.id AND us.user_id = auth.uid()
    )
  );
CREATE POLICY "admins_manage_theories" ON public.theories
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- THEORY_SUBJECTS
CREATE POLICY "view_theory_subjects" ON public.theory_subjects
  FOR SELECT USING (TRUE);
CREATE POLICY "admins_manage_theory_subjects" ON public.theory_subjects
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ANNOUNCEMENTS - chá»‰ user cÃ³ quyá»n mÃ´n má»›i xem
CREATE POLICY "users_view_accessible_announcements" ON public.announcements
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.user_subjects us
      WHERE us.subject_id = announcements.subject_id AND us.user_id = auth.uid()
    )
  );
CREATE POLICY "admins_manage_announcements" ON public.announcements
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- DISCOUNT_CODES - user xem Ä‘Æ°á»£c code active Ä‘á»ƒ Ã¡p dá»¥ng, admin quáº£n lÃ½
CREATE POLICY "users_view_active_codes" ON public.discount_codes
  FOR SELECT USING (is_active = TRUE OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins_manage_codes" ON public.discount_codes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ORDERS
CREATE POLICY "users_view_own_orders" ON public.orders
  FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users_create_own_orders" ON public.orders
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "admins_update_orders" ON public.orders
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- ORDER_ITEMS
CREATE POLICY "users_view_own_order_items" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "users_create_own_order_items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid())
  );
CREATE POLICY "admins_manage_order_items" ON public.order_items
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- SYSTEM_SETTINGS
CREATE POLICY "public_read_settings" ON public.system_settings
  FOR SELECT USING (TRUE);
CREATE POLICY "admins_manage_settings" ON public.system_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- STORAGE BUCKETS
-- =========================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('thumbnails',          'thumbnails',          TRUE),
  ('theory-files',        'theory-files',        TRUE),
  ('theory-images',       'theory-images',       TRUE),
  ('question-images',     'question-images',     TRUE),
  ('bill-images',         'bill-images',         FALSE),
  ('qr-codes',            'qr-codes',            TRUE),
  ('announcement-images', 'announcement-images', TRUE),
  ('avatars',             'avatars',             TRUE)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read cho bucket public
CREATE POLICY "public_read_public_buckets" ON storage.objects
  FOR SELECT USING (
    bucket_id IN ('thumbnails','theory-files','theory-images','question-images','qr-codes','announcement-images','avatars')
  );

-- Avatars: user upload/update cá»§a mÃ¬nh
CREATE POLICY "users_upload_own_avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );
CREATE POLICY "users_update_own_avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- Bill images: user upload bill cá»§a mÃ¬nh, chá»‰ user Ä‘Ã³ + admin xem Ä‘Æ°á»£c
CREATE POLICY "users_upload_own_bill" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'bill-images' AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );
CREATE POLICY "users_view_own_bill" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'bill-images' AND (
      auth.uid()::TEXT = (storage.foldername(name))[1] OR
      public.has_role(auth.uid(), 'admin')
    )
  );

-- Admin: toÃ n quyá»n upload/sá»­a/xoÃ¡ táº¥t cáº£ bucket
CREATE POLICY "admins_manage_all_storage" ON storage.objects
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Hai function nÃ y chá»‰ cháº¡y qua trigger, khÃ´ng ai gá»i trá»±c tiáº¿p
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_subject_access_on_approve() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;

-- has_role cáº§n dÃ¹ng trong RLS â€” chá»‰ cho authenticated, khÃ´ng cho anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Chá»‰ cho phÃ©p admin xoÃ¡ user
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Chá»‰ admin má»›i cÃ³ quyá»n xoÃ¡ ngÆ°á»i dÃ¹ng';
  END IF;

  -- XoÃ¡ user trong auth.users
  -- (Do Ä‘Ã£ setup ON DELETE CASCADE, cÃ¡c dá»¯ liá»‡u trong profiles, user_roles, user_subjects,... sáº½ tá»± Ä‘á»™ng bá»‹ dá»n sáº¡ch)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
-- ThÃªm quyá»n xoÃ¡ Ä‘Æ¡n hÃ ng cho admin
CREATE POLICY "admins_delete_orders" ON public.orders
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

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

-- 1. DROP client-side INSERT policies (force creation via edge function w/ service role)
DROP POLICY IF EXISTS users_create_own_orders ON public.orders;
DROP POLICY IF EXISTS users_create_own_order_items ON public.order_items;

-- 2. Defense-in-depth validation triggers
CREATE OR REPLACE FUNCTION public.validate_order_amounts()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.original_amount IS NULL OR NEW.original_amount < 0 THEN
    RAISE EXCEPTION 'original_amount must be >= 0';
  END IF;
  IF NEW.discount_amount IS NULL OR NEW.discount_amount < 0 THEN
    RAISE EXCEPTION 'discount_amount must be >= 0';
  END IF;
  IF NEW.discount_amount > NEW.original_amount THEN
    RAISE EXCEPTION 'discount_amount cannot exceed original_amount';
  END IF;
  IF NEW.final_amount IS NULL OR NEW.final_amount <= 0 THEN
    RAISE EXCEPTION 'final_amount must be > 0';
  END IF;
  IF NEW.final_amount <> (NEW.original_amount - NEW.discount_amount) THEN
    RAISE EXCEPTION 'final_amount mismatch (got %, expected %)',
      NEW.final_amount, (NEW.original_amount - NEW.discount_amount);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_order_amounts ON public.orders;
CREATE TRIGGER trg_validate_order_amounts
  BEFORE INSERT OR UPDATE OF original_amount, discount_amount, final_amount
  ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.validate_order_amounts();

CREATE OR REPLACE FUNCTION public.validate_order_item_price()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  db_price numeric;
BEGIN
  IF NEW.price IS NULL OR NEW.price < 0 THEN
    RAISE EXCEPTION 'order_items.price must be >= 0';
  END IF;
  SELECT price INTO db_price FROM public.subjects WHERE id = NEW.subject_id;
  IF db_price IS NULL THEN
    RAISE EXCEPTION 'subject % not found', NEW.subject_id;
  END IF;
  IF NEW.price <> db_price THEN
    RAISE EXCEPTION 'order_items.price (%) does not match subjects.price (%)', NEW.price, db_price;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_order_item_price ON public.order_items;
CREATE TRIGGER trg_validate_order_item_price
  BEFORE INSERT OR UPDATE OF price, subject_id
  ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.validate_order_item_price();

-- Enable pg_cron if not already
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function: delete unverified users older than 24h
CREATE OR REPLACE FUNCTION public.cleanup_unverified_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  DELETE FROM auth.users
  WHERE email_confirmed_at IS NULL
    AND created_at < now() - interval '24 hours';
END;
$$;

-- Schedule hourly (unschedule first if exists)
DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-unverified-users');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'cleanup-unverified-users',
  '0 * * * *',
  $$ SELECT public.cleanup_unverified_users(); $$
);

REVOKE EXECUTE ON FUNCTION public.cleanup_unverified_users() FROM PUBLIC, anon, authenticated;
-- Change unverified account cleanup from 24h to 10 minutes
CREATE OR REPLACE FUNCTION public.cleanup_unverified_users()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  DELETE FROM auth.users
  WHERE email_confirmed_at IS NULL
    AND created_at < now() - interval '10 minutes';
END;
$function$;

-- Run the cleanup more frequently (every minute) so 10-minute window is enforced promptly
DO $$
DECLARE
  jid bigint;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'cleanup-unverified-users';
  IF jid IS NOT NULL THEN
    PERFORM cron.alter_job(jid, schedule := '* * * * *');
  END IF;
END $$;
CREATE TABLE public.active_sessions (
  user_id uuid NOT NULL PRIMARY KEY,
  session_id text NOT NULL,
  user_agent text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.active_sessions TO authenticated;
GRANT ALL ON public.active_sessions TO service_role;

ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_session"
ON public.active_sessions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_session"
ON public.active_sessions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_session"
ON public.active_sessions FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_delete_own_session"
ON public.active_sessions FOR DELETE
USING (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.active_sessions;
ALTER TABLE public.active_sessions REPLICA IDENTITY FULL;
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.discount_codes TO authenticated;
GRANT SELECT ON public.discount_codes TO anon;
GRANT ALL ON public.discount_codes TO service_role;
-- Add hardcoded BDT202c subject to support orders and checkouts
INSERT INTO public.subjects (
    id, 
    name, 
    description, 
    price, 
    semester, 
    is_active, 
    sort_order
)
VALUES (
    '9d863b0b-22fa-4cb5-b467-15103a8904e5',
    'BDT202c',
    'KhÃ³a há»c Google Cloud Study Hub (BDT202c)',
    50000, -- Default price, user can change in dashboard if needed
    4,
    true,
    999 -- Place it at the end
)
ON CONFLICT (id) DO NOTHING;

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
CREATE OR REPLACE FUNCTION public.cleanup_unverified_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
BEGIN
  DELETE FROM auth.users
  WHERE email_confirmed_at IS NULL
    AND created_at < now() - interval '24 hours';
END;
$$;
-- Fix foreign key constraint on public.orders(discount_code) to allow deleting and updating discount codes
ALTER TABLE public.orders 
  DROP CONSTRAINT IF EXISTS orders_discount_code_fkey;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_discount_code_fkey
  FOREIGN KEY (discount_code) 
  REFERENCES public.discount_codes(code)
  ON UPDATE CASCADE
  ON DELETE SET NULL;
-- Add chapter_name column to questions table
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS chapter_name TEXT DEFAULT 'Tá»•ng há»£p';

CREATE TABLE IF NOT EXISTS public.signup_otps (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  sent_count_hour int NOT NULL DEFAULT 1,
  hour_window_start timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS signup_otps_email_idx ON public.signup_otps(email);
GRANT ALL ON public.signup_otps TO service_role;
ALTER TABLE public.signup_otps ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (edge functions) can access.
-- ============================================================
-- Enforce Google OAuth / Admin Signups Only in handle_new_user()
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  suffix INT := 0;
  provider_name TEXT;
  is_admin_created BOOLEAN := FALSE;
  is_google BOOLEAN := FALSE;
BEGIN
  provider_name := LOWER(COALESCE(
    NEW.raw_app_meta_data->>'provider',
    ''
  ));

  is_admin_created := (COALESCE(NEW.raw_user_meta_data->>'created_by_admin', 'false') = 'true');

  -- Check if signup provider is Google (OAuth, ID Token, or Google JWT issuer)
  IF provider_name = 'google'
     OR (NEW.raw_app_meta_data->'providers')::text LIKE '%google%'
     OR (NEW.raw_user_meta_data->>'iss') LIKE '%google%'
     OR (NEW.raw_user_meta_data->>'provider') = 'google'
  THEN
    is_google := TRUE;
  END IF;

  -- Strictly block manual email signups if not Google and not Admin
  IF NOT is_google AND NOT is_admin_created THEN
    RAISE EXCEPTION 'ÄÄƒng kÃ½ trá»±c tiáº¿p báº±ng Email Ä‘Ã£ bá»‹ khÃ³a. Vui lÃ²ng sá»­ dá»¥ng ÄÄƒng kÃ½ báº±ng Google.';
  END IF;

  -- Generate unique username from metadata or email
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1),
    'user'
  );
  final_username := base_username;

  -- Ensure username is unique in profiles
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    suffix := suffix + 1;
    final_username := base_username || suffix::TEXT;
  END LOOP;

  -- Insert profile record
  INSERT INTO public.profiles (id, email, username, full_name, student_code, phone)
  VALUES (
    NEW.id,
    NEW.email,
    final_username,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'student_code',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Clean up IP blocking triggers and tables if they exist
DROP TRIGGER IF EXISTS tr_block_blacklisted_ip ON auth.users;
DROP FUNCTION IF EXISTS public.check_ip_blacklist();
DROP FUNCTION IF EXISTS public.is_ip_blocked(inet);
DROP FUNCTION IF EXISTS public.is_ip_blocked(text);

DROP TABLE IF EXISTS public.ip_logs CASCADE;
DROP TABLE IF EXISTS public.blocked_ips CASCADE;

CREATE TABLE IF NOT EXISTS public.question_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  suggested_option_id UUID REFERENCES public.question_options(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.question_reports ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_reports TO authenticated;
GRANT ALL ON public.question_reports TO service_role;
-- =========================================
-- LIVE CHAT SUPPORT TABLES
-- =========================================

-- 1. CONVERSATIONS
-- Má»—i user cÃ³ tá»‘i Ä‘a 1 conversation active vá»›i admin
CREATE TABLE public.conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)  -- má»—i user chá»‰ cÃ³ 1 conversation
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- 2. CHAT_MESSAGES
CREATE TABLE public.chat_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_role     TEXT NOT NULL CHECK (sender_role IN ('user', 'admin')),
  content         TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 3. CHAT_CLEANUP_LOGS
-- Ghi log má»—i láº§n cron job dá»n dáº¹p, dÃ¹ng Ä‘á»ƒ hiá»ƒn thá»‹ toast thÃ´ng bÃ¡o
CREATE TABLE public.chat_cleanup_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  deleted_count   INT NOT NULL DEFAULT 0,
  cleaned_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notified        BOOLEAN NOT NULL DEFAULT FALSE
);
ALTER TABLE public.chat_cleanup_logs ENABLE ROW LEVEL SECURITY;

-- =========================================
-- TRIGGER: Cáº­p nháº­t last_message_at khi cÃ³ tin má»›i
-- =========================================
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_conversation_last_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_last_message();

-- =========================================
-- RLS POLICIES
-- =========================================

-- CONVERSATIONS: User chá»‰ tháº¥y conversation cá»§a mÃ¬nh; Admin tháº¥y táº¥t cáº£
CREATE POLICY "conversations_select_own" ON public.conversations
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "conversations_insert_own" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "conversations_update_own" ON public.conversations
  FOR UPDATE USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
  );

-- CHAT_MESSAGES: User chá»‰ tháº¥y messages trong conversation cá»§a mÃ¬nh; Admin tháº¥y táº¥t cáº£
CREATE POLICY "chat_messages_select" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "chat_messages_insert" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "chat_messages_update" ON public.chat_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "chat_messages_delete" ON public.chat_messages
  FOR DELETE USING (
    public.has_role(auth.uid(), 'admin')
  );

-- CHAT_CLEANUP_LOGS: User chá»‰ tháº¥y log cá»§a mÃ¬nh; Admin tháº¥y táº¥t cáº£
CREATE POLICY "chat_cleanup_logs_select" ON public.chat_cleanup_logs
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "chat_cleanup_logs_insert" ON public.chat_cleanup_logs
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "chat_cleanup_logs_update" ON public.chat_cleanup_logs
  FOR UPDATE USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
  );

-- =========================================
-- INDEXES Ä‘á»ƒ tá»‘i Æ°u query
-- =========================================
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id, created_at);
CREATE INDEX idx_chat_messages_is_read ON public.chat_messages(conversation_id, is_read);
CREATE INDEX idx_conversations_last_message ON public.conversations(last_message_at DESC);
CREATE INDEX idx_chat_cleanup_logs_user ON public.chat_cleanup_logs(user_id, notified);
-- Báº­t realtime (Websockets) cho 2 báº£ng cá»§a tÃ­nh nÄƒng Chat Support
-- Ä‘á»ƒ admin vÃ  user nháº­n Ä‘Æ°á»£c tin nháº¯n vÃ  thÃ´ng bÃ¡o ngay láº­p tá»©c.
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
-- Cho phÃ©p Admin xoÃ¡ tin nháº¯n thá»§ cÃ´ng
CREATE POLICY "chat_messages_delete" ON public.chat_messages
  FOR DELETE USING (
    public.has_role(auth.uid(), 'admin')
  );
-- Cho phÃ©p Admin xoÃ¡ Ä‘oáº¡n chat (conversation)
-- (Sáº½ tá»± Ä‘á»™ng cascade xoÃ¡ luÃ´n táº¥t cáº£ tin nháº¯n bÃªn trong)
CREATE POLICY "conversations_delete" ON public.conversations
  FOR DELETE USING (
    public.has_role(auth.uid(), 'admin')
  );
-- Báº­t Realtime cho báº£ng orders Ä‘á»ƒ admin nháº­n thÃ´ng bÃ¡o vÃ  tá»± Ä‘á»™ng táº£i láº¡i danh sÃ¡ch Ä‘Æ¡n hÃ ng
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
-- ThÃªm cá»™t image_url vÃ o báº£ng chat_messages
ALTER TABLE public.chat_messages
ADD COLUMN image_url text DEFAULT null;

-- Cho phÃ©p cá»™t content cÃ³ thá»ƒ rá»—ng náº¿u cÃ³ hÃ¬nh áº£nh
ALTER TABLE public.chat_messages
ALTER COLUMN content DROP NOT NULL;

-- Tuy nhiÃªn, má»™t tin nháº¯n pháº£i cÃ³ Ã­t nháº¥t content hoáº·c image_url
ALTER TABLE public.chat_messages
ADD CONSTRAINT chat_messages_content_or_image_check
CHECK (content IS NOT NULL OR image_url IS NOT NULL);


-- Cáº¥u hÃ¬nh Supabase Storage cho chat-images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies cho storage
CREATE POLICY "Cho phÃ©p táº£i áº£nh cÃ´ng khai"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-images');

CREATE POLICY "Cho phÃ©p user Ä‘Äƒng nháº­p upload áº£nh"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-images');

CREATE POLICY "Cho phÃ©p ngÆ°á»i upload tá»± xÃ³a áº£nh cá»§a mÃ¬nh"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-images' AND auth.uid() = owner);
-- Migration: Rich Text Exam Support
-- Adds extra_images (array of image URLs) to questions
-- Adds image_url to question_options for inline option images

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS extra_images TEXT[] DEFAULT '{}';

ALTER TABLE public.question_options
  ADD COLUMN IF NOT EXISTS image_url TEXT;
