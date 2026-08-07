-- Bật Realtime cho bảng orders để admin nhận thông báo và tự động tải lại danh sách đơn hàng
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
