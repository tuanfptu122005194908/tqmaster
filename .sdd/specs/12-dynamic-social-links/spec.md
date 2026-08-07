# 1. Tên tính năng (Feature Name)
Dynamic Social Links Management (Quản lý cấu hình liên kết Mạng xã hội)

# 2. Tổng quan (Overview)
Hiện tại, các liên kết mạng xã hội (Facebook, YouTube) đang được fix cứng (hardcode) trong source code của hệ thống (như trong `TopNav.tsx` và `ProfilePage.tsx`).
Mục tiêu của tính năng này là cho phép Admin có thể tự động thay đổi, cập nhật các liên kết Facebook, YouTube trực tiếp từ trang **Cài đặt hệ thống (Admin Settings)** mà không cần phải can thiệp vào mã nguồn hay deploy lại ứng dụng.

# 3. Yêu cầu nghiệp vụ (Business Requirements)
- **Quản trị viên (Admin):** 
  - Có thể xem danh sách các liên kết mạng xã hội hiện tại trong trang Admin Settings.
  - Có thể chỉnh sửa đường dẫn URL cho trang Facebook và kênh YouTube của nền tảng TQMaster.
  - Khi lưu cấu hình, hệ thống sẽ tự động cập nhật giá trị mới vào cơ sở dữ liệu (`system_settings`).
- **Người dùng cuối (End-users) & Giao diện public:**
  - Các nút liên kết Facebook, YouTube trên thanh điều hướng (TopNav) sẽ đọc dữ liệu từ cấu hình (Context/Settings) thay vì đường dẫn fix cứng.
  - Các vị trí hỗ trợ, support (ví dụ: ProfilePage) cũng sẽ lấy link Facebook tương ứng từ cơ sở dữ liệu.
  - Nếu Admin để trống trường dữ liệu, hệ thống có thể dùng link mặc định (fallback) hoặc ẩn nút tương ứng (tùy thuộc vào thiết kế hiện tại, mặc định vẫn nên giữ fallback UI).

# 4. Yêu cầu kỹ thuật (Technical Requirements)
## 4.1. Cơ sở dữ liệu (Database)
- Bảng `system_settings` trong Supabase: 
  - Cần thêm/sử dụng 2 khóa (key) mới: `facebook_url` và `youtube_url`.
  - Không cần migration file cứng nếu logic application tự động thêm vào thông qua tính năng `upsert` của trang Admin Settings.

## 4.2. Frontend - Trang Admin Settings (`src/pages/admin/AdminSettings.tsx`)
- Thêm 2 input fields mới vào khu vực "Thông tin liên hệ & Hỗ trợ" (hoặc tạo Section mới "Mạng xã hội"):
  - **Facebook URL**: Nhập đường dẫn tới trang Fanpage / Profile Admin.
  - **YouTube URL**: Nhập đường dẫn tới kênh YouTube.
- Mở rộng mảng `KEYS` để bao gồm `facebook_url` và `youtube_url`. Điều này sẽ cho phép hàm `save()` hiện tại tự động `upsert` các key này vào Supabase.

## 4.3. Frontend - Global State (`src/lib/AppContext.tsx`)
- `AppContext` (hoặc nơi load system settings chung) cần được cập nhật để chia sẻ giá trị của `facebook_url` và `youtube_url` cho toàn bộ ứng dụng. 
- Hiện tại, `AdminSettings` load riêng settings cho màn Admin, nhưng các màn User cần đọc được settings. Cần kiểm tra xem `system_settings` đã được expose trong AppContext chưa. Nếu chưa, cần fetch các cấu hình public ở `AppContext` (chỉ lấy các key được phép như liên hệ, facebook, youtube).

## 4.4. Frontend - Tích hợp UI hiển thị
- `src/components/TopNav.tsx`:
  - Lấy `facebook_url` và `youtube_url` từ Context/Store hoặc hook để gắn vào thuộc tính `href` của thẻ `<a>`.
  - Fallback giá trị về chuỗi rỗng `"#"` hoặc ẩn element nếu cấu hình bị xóa/trống.
- `src/pages/user/ProfilePage.tsx`:
  - Cập nhật link liên hệ hỗ trợ Facebook bằng `facebook_url` động.

# 5. Rủi ro & Ràng buộc (Risks & Constraints)
- Cache dữ liệu: Nếu fetch `system_settings` không được tối ưu, có thể gây ra chập chờn khi load trang. Giải pháp: Có thể đưa thông tin settings này vào LocalStorage tạm hoặc load một lần duy nhất lúc khởi tạo `AppContext`.
- Tính hợp lệ của URL: Tạm thời không cần validation khắt khe (regex) để giảm độ phức tạp, nhưng cần lưu ý Admin nhập đầy đủ tiền tố `https://`.

# 6. Kế hoạch triển khai (Implementation Plan)
Sẽ được định nghĩa chi tiết tại `docs/sdd/plan.md`.
