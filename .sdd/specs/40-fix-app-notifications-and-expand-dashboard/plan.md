# Plan 40: Kế Hoạch Kỹ Thuật Khắc Phục Thông Báo & Mở Rộng Biểu Đồ

---

## 1. Kiến Trúc & Luồng Dữ Liệu (Notification Pipeline)

```
[Học viên đặt đơn (Web)]
       │
       ▼
[Edge Function: create-order]
       │
       ├─► 1. Ghi đơn hàng vào CSDL `public.orders`
       │
       └─► 2. Gọi nội bộ sang `notify-admin-new-order` (với Service Role Key)
                   │
                   ▼
       [Edge Function: notify-admin-new-order]
                   │
                   ├─► Query `public.admin_devices` lấy fcm_token
                   │
                   └─► Google OAuth2 (RS256 Private Key) ➔ FCM HTTP v1 API
                               │
                               ▼
                   [Google Cloud Messaging Server]
                               │
                               ▼
                   [Điện thoại Admin (OPPO CPH2577)]
                         - Chuông "TING" to vang dội
                         - Notification bar hiển thị đơn hàng
```

---

## 2. Chi Tiết Triển Khai Kỹ Thuật

### 2.1. Cập nhật & Deploy Edge Functions
1. **`supabase/functions/notify-admin-new-order/index.ts`**:
   - Cho phép xác thực linh hoạt: Nếu request mang `Authorization: Bearer <key>` trùng `SUPABASE_SERVICE_ROLE_KEY` hoặc `SUPABASE_ANON_KEY`, coi là cuộc gọi nội bộ hợp lệ.
   - Thêm xử lý `pushNotificationReceived` và data payload tương thích với `@capacitor/push-notifications`.
2. **`supabase/functions/create-order/index.ts`**:
   - Đảm bảo khối `admin.functions.invoke('notify-admin-new-order', ...)` được truyền đúng `serviceKey` trong headers.
   - Đăng nhập nhật ký chi tiết kết quả gửi notification (sent / error).
3. **Deploy đồng bộ**:
   - Chạy lệnh `npx supabase functions deploy create-order notify-admin-new-order --remote=vhljgmtithjeovtrghvy --yes`.

### 2.2. Cấu hình CSDL Supabase
- Chạy qua Supabase CLI:
  ```sql
  ALTER TABLE public.orders REPLICA IDENTITY FULL;
  ```

### 2.3. Tái thiết kế Giao diện Biểu đồ `MobileRevenueChart.tsx` & CSS
1. **Tăng chiều cao SVG**:
   - `W = 340`, `H = 220` (trước đây `H = 160`).
   - `padTop = 20`, `padBottom = 28`, `plotH = 172` (tăng diện tích hiển thị từ 112 lên 172px).
2. **Layout Header & Segmented Bar**:
   - Cấu trúc 2 hàng riêng biệt:
     + Hàng 1: Tiêu đề biểu đồ + Số tiền tổng doanh thu lớn + Tag trạng thái.
     + Hàng 2: Khung chuyển tab (Segmented Control) nằm ngang toàn bộ chiều rộng card (`width: 100%`), 3 nút "14 Ngày", "8 Tuần", "Theo Tháng" chia đều tỷ lệ (`flex: 1`), text căn giữa chuẩn mực.
   - Khoảng cách padding và font size tối ưu cho màn hình di động hẹp (360px - 412px).

### 2.4. Tính năng Test Push Notification
- Trong `SettingsScreen.tsx`, thêm nút "Gửi thông báo đẩy FCM thật (Kiểm tra máy)" bên cạnh nút test chuông cục bộ. Nút này sẽ gọi hàm `notify-admin-new-order` để Admin có thể thử nghiệm nhận thông báo đẩy thực tế từ Google bất cứ lúc nào.

---

## 3. Quản Lý Rủi Ro & Đảm Bảo Độc Lập Web
- Toàn bộ thay đổi mã nguồn UI chỉ nằm trong `src/app-admin/`, tuyệt đối không đụng chạm đến `src/pages/` của Web.
- Bản build Web `dist/` vẫn giữ nguyên 100% tính độc lập và dung lượng.
- Edge Function `create-order` xử lý thông báo dạng best-effort trong `try-catch`, đảm bảo quá trình tạo đơn hàng của học sinh không bao giờ bị gián đoạn kể cả khi Google FCM quá tải.

