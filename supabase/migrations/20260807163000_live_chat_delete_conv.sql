-- Cho phép Admin xoá đoạn chat (conversation)
-- (Sẽ tự động cascade xoá luôn tất cả tin nhắn bên trong)
CREATE POLICY "conversations_delete" ON public.conversations
  FOR DELETE USING (
    public.has_role(auth.uid(), 'admin')
  );
