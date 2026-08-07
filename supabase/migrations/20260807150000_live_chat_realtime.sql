-- Bật realtime (Websockets) cho 2 bảng của tính năng Chat Support
-- để admin và user nhận được tin nhắn và thông báo ngay lập tức.
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
