-- =========================================
-- LIVE CHAT SUPPORT TABLES
-- =========================================

-- 1. CONVERSATIONS
-- Mỗi user có tối đa 1 conversation active với admin
CREATE TABLE public.conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)  -- mỗi user chỉ có 1 conversation
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
-- Ghi log mỗi lần cron job dọn dẹp, dùng để hiển thị toast thông báo
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
-- TRIGGER: Cập nhật last_message_at khi có tin mới
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

-- CONVERSATIONS: User chỉ thấy conversation của mình; Admin thấy tất cả
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

-- CHAT_MESSAGES: User chỉ thấy messages trong conversation của mình; Admin thấy tất cả
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

-- CHAT_CLEANUP_LOGS: User chỉ thấy log của mình; Admin thấy tất cả
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
-- INDEXES để tối ưu query
-- =========================================
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id, created_at);
CREATE INDEX idx_chat_messages_is_read ON public.chat_messages(conversation_id, is_read);
CREATE INDEX idx_conversations_last_message ON public.conversations(last_message_at DESC);
CREATE INDEX idx_chat_cleanup_logs_user ON public.chat_cleanup_logs(user_id, notified);
