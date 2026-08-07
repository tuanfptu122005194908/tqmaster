-- Cho phép Admin xoá tin nhắn thủ công
CREATE POLICY "chat_messages_delete" ON public.chat_messages
  FOR DELETE USING (
    public.has_role(auth.uid(), 'admin')
  );
