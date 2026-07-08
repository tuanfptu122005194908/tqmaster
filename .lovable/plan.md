# Popup thông báo khi user vào web

Khi admin đăng một **Thông báo** mới, mỗi user sẽ thấy một popup hiển thị thông báo đó ngay khi vào web. Sau khi user đóng popup, nó sẽ không hiện lại — cho đến khi admin đăng một thông báo mới hơn.

## Cách hoạt động

- Khi user đã đăng nhập vào web, hệ thống lấy **thông báo mới nhất** (mục Admin > Thông báo).
- So sánh id thông báo mới nhất với id thông báo mà user đã xem lần trước (lưu trên máy user).
- Nếu khác nhau (tức có thông báo mới) → hiện popup.
- User bấm "Đã hiểu" hoặc đóng popup → lưu lại id đó, popup không hiện lại nữa cho tới khi có thông báo mới hơn.

Vì trạng thái "đã xem" được lưu theo từng user trên trình duyệt nên không cần thay đổi cơ sở dữ liệu.

## Thành phần

1. **Component mới `AnnouncementPopup`** (`src/components/AnnouncementPopup.tsx`)
   - Lấy thông báo mới nhất từ bảng `announcements` (sắp xếp theo ngày tạo, lấy 1 dòng).
   - Hiển thị tiêu đề, nội dung, và ảnh (nếu có) trong một modal chính giữa màn hình, có nút đóng và nút "Đã hiểu".
   - Dùng key `localStorage` riêng cho từng user (`seen_announcement_<user_id>`) để nhớ thông báo đã xem.
   - Chỉ hiện với user thường sau khi đăng nhập & xác thực email.

2. **Gắn popup vào `src/App.tsx`**
   - Render `<AnnouncementPopup />` trong khu vực app đã đăng nhập (cùng cấp với nội dung chính), để nó xuất hiện đè lên bất kỳ trang nào user đang xem.

## Kỹ thuật

- Không sửa schema, không sửa file backend.
- Truy vấn: `supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(1)`.
- Trạng thái đã xem lưu ở `localStorage` theo user id → mỗi user độc lập, và "một lần cho mỗi bài mới".
- Style theo design tokens sẵn có (`hsl(var(--surface-raised))`, `--border`, `--primary`...) giống các modal hiện tại.
