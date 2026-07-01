
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
-- 2. USER_ROLES (tách riêng để chống privilege escalation)
-- =========================================
CREATE TABLE public.user_roles (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role    public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function để check role (tránh recursive RLS)
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

  -- Đảm bảo username unique
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
-- TRIGGER: Cấp quyền môn khi đơn được duyệt
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

-- EXAMS - chỉ user có quyền môn liên quan mới xem được
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

-- THEORIES - chỉ user có quyền môn liên quan mới xem được
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

-- ANNOUNCEMENTS - chỉ user có quyền môn mới xem
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

-- DISCOUNT_CODES - user xem được code active để áp dụng, admin quản lý
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

-- Avatars: user upload/update của mình
CREATE POLICY "users_upload_own_avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );
CREATE POLICY "users_update_own_avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- Bill images: user upload bill của mình, chỉ user đó + admin xem được
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

-- Admin: toàn quyền upload/sửa/xoá tất cả bucket
CREATE POLICY "admins_manage_all_storage" ON storage.objects
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
