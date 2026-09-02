CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_created ON public.chat_messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON public.chat_messages (conversation_id) WHERE is_read = false;

CREATE OR REPLACE FUNCTION public.get_admin_conversations()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  status text,
  last_message_at timestamptz,
  created_at timestamptz,
  full_name text,
  username text,
  email text,
  avatar_url text,
  unread_count bigint,
  last_message text,
  last_message_image text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.user_id,
    c.status,
    c.last_message_at,
    c.created_at,
    p.full_name,
    p.username,
    p.email,
    p.avatar_url,
    COALESCE(u.cnt, 0) AS unread_count,
    lm.content AS last_message,
    lm.image_url AS last_message_image
  FROM public.conversations c
  LEFT JOIN public.profiles p ON p.id = c.user_id
  LEFT JOIN LATERAL (
    SELECT count(*) AS cnt
    FROM public.chat_messages m
    WHERE m.conversation_id = c.id
      AND m.sender_role = 'user'
      AND m.is_read = false
  ) u ON true
  LEFT JOIN LATERAL (
    SELECT m.content, m.image_url
    FROM public.chat_messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) lm ON true
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY c.last_message_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_conversations() TO authenticated;