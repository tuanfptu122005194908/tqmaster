-- =========================================
-- ENUMS
-- =========================================
CREATE TYPE public.app_role AS ENUM ('user', 'admin');

-- =========================================
-- 1. PROFILES & ROLES
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

CREATE TABLE public.user_roles (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role    public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- =========================================
-- 2. SUBJECTS
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

CREATE TABLE public.user_subjects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  granted_by TEXT NOT NULL DEFAULT 'order' CHECK (granted_by IN ('order', 'manual', 'admin')),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, subject_id)
);

-- =========================================
-- 3. EXAMS & QUESTIONS
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

CREATE TABLE public.exam_subjects (
  exam_id    UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (exam_id, subject_id)
);

CREATE TABLE public.questions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id      UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  order_num    INT NOT NULL,
  content      TEXT,
  image_url    TEXT,
  type         TEXT NOT NULL DEFAULT 'image' CHECK (type IN ('text', 'image')),
  chapter_name TEXT DEFAULT 'Tổng hợp',
  extra_images TEXT[] DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.question_options (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  label       CHAR(1) NOT NULL,
  content     TEXT,
  is_correct  BOOLEAN NOT NULL DEFAULT FALSE,
  image_url   TEXT,
  UNIQUE(question_id, label)
);

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

CREATE TABLE public.attempt_answers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id  UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected    TEXT[] NOT NULL DEFAULT '{}',
  is_correct  BOOLEAN,
  UNIQUE(attempt_id, question_id)
);

CREATE TABLE public.question_reports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id         UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  suggested_option_id UUID REFERENCES public.question_options(id) ON DELETE CASCADE,
  status              TEXT NOT NULL DEFAULT 'pending',
  note                TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================
-- 4. THEORIES
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

CREATE TABLE public.theory_subjects (
  theory_id  UUID NOT NULL REFERENCES public.theories(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (theory_id, subject_id)
);

-- =========================================
-- 5. ANNOUNCEMENTS & NEWS
-- =========================================
CREATE TABLE public.announcements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  content    TEXT,
  image_url  TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.news_posts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  images     TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.news_likes (
  post_id    UUID NOT NULL REFERENCES public.news_posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE public.news_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES public.news_posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================
-- 6. E-COMMERCE (ORDERS, CODES)
-- =========================================
CREATE TABLE public.discount_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT NOT NULL UNIQUE,
  discount_type   TEXT NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent', 'fixed')),
  value           NUMERIC(12,2) NOT NULL,
  min_order_value NUMERIC(12,2) DEFAULT NULL,
  max_uses        INT,
  used_count      INT NOT NULL DEFAULT 0,
  expires_at      TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      UUID REFERENCES public.profiles(id) ON UPDATE CASCADE ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.orders (
  id              TEXT PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  student_code    TEXT NOT NULL,
  email           TEXT NOT NULL,
  discount_code   TEXT REFERENCES public.discount_codes(code) ON UPDATE CASCADE ON DELETE SET NULL,
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

CREATE TABLE public.order_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id),
  price      NUMERIC(12,0) NOT NULL
);

-- =========================================
-- 7. SYSTEM, SUPPORT & CHAT
-- =========================================
CREATE TABLE public.system_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.system_settings (key, value) VALUES
  ('bank_name',     'Vietcombank'),
  ('bank_account',  ''),
  ('bank_owner',    ''),
  ('bank_content',  'Thanh toan tai lieu'),
  ('bank_qr_url',   ''),
  ('contact_info',  ''),
  ('site_name',     'EduDocs'),
  ('site_logo_url', '');

CREATE TABLE public.signup_otps (
  user_id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT NOT NULL,
  code_hash         TEXT NOT NULL,
  expires_at        TIMESTAMPTZ NOT NULL,
  attempts          INT NOT NULL DEFAULT 0,
  last_sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_count_hour   INT NOT NULL DEFAULT 1,
  hour_window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.active_sessions (
  user_id    UUID NOT NULL PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_agent TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE public.chat_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_role     TEXT NOT NULL CHECK (sender_role IN ('user', 'admin')),
  content         TEXT,
  image_url       TEXT,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chat_messages_content_or_image_check CHECK (content IS NOT NULL OR image_url IS NOT NULL)
);

CREATE TABLE public.chat_cleanup_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  deleted_count   INT NOT NULL DEFAULT 0,
  cleaned_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notified        BOOLEAN NOT NULL DEFAULT FALSE
);

-- =========================================
-- STORAGE BUCKETS
-- =========================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('thumbnails', 'thumbnails', TRUE),
  ('theory-files', 'theory-files', TRUE),
  ('theory-images', 'theory-images', TRUE),
  ('question-images', 'question-images', TRUE),
  ('bill-images', 'bill-images', FALSE),
  ('qr-codes', 'qr-codes', TRUE),
  ('announcement-images', 'announcement-images', TRUE),
  ('avatars', 'avatars', TRUE),
  ('news-images', 'news-images', TRUE),
  ('chat-images', 'chat-images', TRUE)
ON CONFLICT (id) DO NOTHING;
