# 1. Mục tiêu (Goal)
Triển khai tính năng Quản lý Cấu hình Mạng xã hội, cho phép lưu trữ và thay đổi đường dẫn URL tới trang Facebook và kênh YouTube của nền tảng TQMaster từ giao diện Admin.

# 2. Chi tiết thực hiện (Implementation Details)

## Bước 1: Cập nhật AppContext (State Management)
**File**: `src/lib/AppContext.tsx`
- **Mục đích**: Hiện tại `system_settings` chưa được load ở cấp độ global cho toàn bộ ứng dụng (chỉ được fetch trong AdminSettings). Cần tạo một state để chứa `siteSettings` hoặc `socialLinks` trong `AppContext` để các component Public (như `TopNav`) có thể đọc được cấu hình liên kết.
- **Thực hiện**:
  - Khai báo thêm state `siteSettings: Record<string, string>` trong Provider.
  - Trong quá trình fetch thông tin `profile` hoặc trong một `useEffect` riêng ở `AppContext`, gọi API lấy dữ liệu từ bảng `system_settings` (sử dụng Supabase).
  - Expose `siteSettings` qua `AppContextType`.

## Bước 2: Cập nhật trang Admin Settings
**File**: `src/pages/admin/AdminSettings.tsx`
- **Mục đích**: Cho phép Admin thay đổi giá trị.
- **Thực hiện**:
  - Thêm `facebook_url` và `youtube_url` vào mảng hằng số `KEYS` để tự động lưu vào DB.
  - Thêm 2 input fields mới vào UI dưới section "Thông tin website" (hoặc tạo Section mới "Mạng xã hội") cho phép người dùng điền liên kết.
  - Áp dụng các style có sẵn như `inputStyle` để nhất quán về giao diện.

## Bước 3: Áp dụng liên kết động vào Giao diện (UI)
**File**: `src/components/TopNav.tsx`
- **Mục đích**: Thay thế URL cố định (hardcode) bằng URL từ database.
- **Thực hiện**:
  - Hook vào `useApp()` để lấy `siteSettings`.
  - Kiểm tra nếu `siteSettings['facebook_url']` tồn tại, sử dụng làm thẻ `href` của nút Facebook. Nếu không, giữ giá trị mặc định là `"https://www.facebook.com/tuanvaquan"`.
  - Tương tự với YouTube URL.

**File**: `src/pages/user/ProfilePage.tsx`
- **Mục đích**: Cập nhật link Hỗ trợ qua Facebook trong trang cá nhân của học viên.
- **Thực hiện**:
  - Sử dụng `siteSettings['facebook_url']` làm liên kết cho thẻ `<a href={...}>` thay vì hardcode.

# 3. Kế hoạch kiểm thử (Verification Plan)
- Đăng nhập dưới quyền Admin, truy cập Cài đặt hệ thống.
- Cập nhật trường URL Facebook và YouTube, bấm Lưu.
- Chuyển hướng ra trang chủ (Public), click vào nút Facebook/YouTube trên Header để đảm bảo nó điều hướng tới link mới vừa lưu.
- Vào trang Profile, click mục liên hệ hỗ trợ xem có dẫn tới link mới hay không.
- Test chức năng tự động load (Refresh trang) và fallback khi trường bị bỏ trống.
