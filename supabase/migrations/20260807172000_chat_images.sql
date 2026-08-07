-- Thêm cột image_url vào bảng chat_messages
ALTER TABLE public.chat_messages
ADD COLUMN image_url text DEFAULT null;

-- Cho phép cột content có thể rỗng nếu có hình ảnh
ALTER TABLE public.chat_messages
ALTER COLUMN content DROP NOT NULL;

-- Tuy nhiên, một tin nhắn phải có ít nhất content hoặc image_url
ALTER TABLE public.chat_messages
ADD CONSTRAINT chat_messages_content_or_image_check
CHECK (content IS NOT NULL OR image_url IS NOT NULL);


-- Cấu hình Supabase Storage cho chat-images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies cho storage
CREATE POLICY "Cho phép tải ảnh công khai"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-images');

CREATE POLICY "Cho phép user đăng nhập upload ảnh"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-images');

CREATE POLICY "Cho phép người upload tự xóa ảnh của mình"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-images' AND auth.uid() = owner);
