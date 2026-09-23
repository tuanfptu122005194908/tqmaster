# Feature Specification: System Settings & Dynamic Social Links

**Feature Branch**: `[main]`  
**Status**: ✅ Implemented (Optimized v2.0)

---

## 1. Overview
Trang Cài đặt hệ thống (`/admin/settings`) cung cấp cho Quản trị viên khả năng kiểm soát tập trung toàn bộ các thông số vận hành và cấu hình nhận diện của nền tảng TQMaster mà không cần can thiệp mã nguồn hay deploy lại ứng dụng.

Hệ thống quản lý 9 cấu hình cốt lõi:
1. **Thông tin nhận diện website**: Tên nền tảng (`site_name`).
2. **Thông tin thanh toán ngân hàng (VietQR)**: Tên ngân hàng (`bank_name`), Số tài khoản (`bank_account`), Tên chủ tài khoản (`bank_owner`), Cú pháp chuyển khoản (`bank_content`), và Ảnh mã QR dự phòng (`bank_qr_url`).
3. **Kênh hỗ trợ & Mạng xã hội động**: Thông tin liên hệ/hotline (`contact_info`), Đường dẫn Facebook Fanpage/Admin (`facebook_url`), và Kênh YouTube học tập (`youtube_url`).

Toàn bộ dữ liệu cấu hình được lưu trữ linh hoạt theo cặp khóa-giá trị (Key-Value) trong bảng `system_settings`, được nạp vào bộ nhớ dùng chung qua `AppContext` (`siteSettings`) để phục vụ thanh toán tại `/cart`, liên kết điều hướng tại `TopNav` và hỗ trợ tại `ProfilePage`.

---

## 2. User Scenarios & Testing

### User Story 1 – Cấu hình tài khoản ngân hàng & VietQR (Priority: P1)
Là một Quản trị viên, tôi muốn cập nhật số tài khoản ngân hàng hoặc cú pháp nội dung chuyển khoản khi thay đổi tài khoản nhận tiền.

**Acceptance Scenarios**:
1. **Given** Quản trị viên truy cập `/admin/settings`, **When** trang tải, **Then** các trường thông tin ngân hàng hiện tại hiển thị đầy đủ.
2. **Given** Quản trị viên thay đổi Tên ngân hàng (VD: "MBBank"), Số tài khoản và Tên người thụ hưởng, **When** nhấn nút "Lưu cấu hình", **Then** các bản ghi tương ứng trong `system_settings` được `upsert` thành công và toast thông báo *"Đã lưu cấu hình hệ thống thành công"* xuất hiện.
3. **Given** Quản trị viên có ảnh QR Code cố định từ ứng dụng ngân hàng, **When** tải ảnh lên qua component `FileUploader`, **Then** ảnh được lưu lên Supabase Storage và URL được lưu vào `bank_qr_url`.
4. **Given** học viên truy cập trang `/cart` bước thanh toán, **When** trang hiển thị mã VietQR, **Then** mã QR phản ánh chính xác 100% số tài khoản và ngân hàng vừa được Admin cập nhật.

### User Story 2 – Quản lý liên kết Mạng xã hội & Hỗ trợ (Priority: P2)
Là một Quản trị viên, tôi muốn thay đổi đường dẫn Fanpage Facebook hoặc Kênh YouTube khi có đợt chiến dịch mới mà không phải nhờ lập trình viên sửa code.

**Acceptance Scenarios**:
1. **Given** Quản trị viên ở section "Mạng xã hội & Liên hệ" tại `/admin/settings`, **When** nhập đường dẫn Facebook mới và nhấn "Lưu cấu hình", **Then** khóa `facebook_url` được cập nhật trong database.
2. **Given** học viên nhấp vào icon Facebook trên thanh điều hướng (`TopNav`) hoặc trang cá nhân (`ProfilePage`), **Then** trình duyệt mở đúng liên kết mạng xã hội mới được cấu hình trong tab mới (`target="_blank"`).
3. **Given** Quản trị viên để trống trường `facebook_url`, **Then** giao diện `TopNav` tự động sử dụng fallback an toàn `#` hoặc ẩn nút, không gây lỗi vỡ giao diện.

---

## 3. Requirements

### Functional Requirements
- **FR-001**: Quản trị viên có toàn quyền xem và cập nhật 9 khóa cấu hình hệ thống (`site_name`, `contact_info`, `bank_name`, `bank_account`, `bank_owner`, `bank_content`, `bank_qr_url`, `facebook_url`, `youtube_url`).
- **FR-002**: Cơ chế lưu cấu hình PHẢI sử dụng phương thức `upsert` trên bảng `system_settings` với khóa chính `key`, tự động ghi nhận `updated_by` và `updated_at`.
- **FR-003**: Hỗ trợ tải ảnh mã QR tĩnh thông qua component `FileUploader`, lưu trữ trên Supabase Storage bucket `materials` hoặc bucket cấu hình công khai.
- **FR-004 (Global State Sharing)**: `AppContext` cung cấp trạng thái `siteSettings: Record<string, string>` và hàm `refreshSiteSettings()` nạp dữ liệu ngay khi khởi tạo ứng dụng để phục vụ toàn bộ các trang con:
  - `CartPage.tsx`: Tạo mã thanh toán VietQR động và hiển thị thông tin ngân hàng.
  - `TopNav.tsx`: Gắn link Facebook, YouTube vào các icon mạng xã hội.
  - `ProfilePage.tsx`: Hiển thị thông tin hỗ trợ trực tiếp.
- **FR-005 (Bảo mật)**: Chỉ người dùng có vai trò `admin` (`role === 'admin'`) mới có quyền truy cập trang `/admin/settings` và ghi dữ liệu vào bảng `system_settings`. Người dùng thông thường chỉ có quyền đọc (`SELECT`) đối với các khóa public.

### Key Entities

**Table: system_settings**
| Column | Type | Notes |
|---|---|---|
| `key` | text | Khóa cấu hình định danh duy nhất (Primary Key) |
| `value` | text | Giá trị chuỗi cấu hình (có thể là text hoặc URL ảnh) |
| `updated_at` | timestamptz | Thời điểm cập nhật cuối cùng |
| `updated_by` | uuid | Quản trị viên thực hiện chỉnh sửa (tham chiếu `profiles.id`) |

### Key Files
- `src/pages/admin/AdminSettings.tsx` — Giao diện quản trị cấu hình hệ thống, tài khoản ngân hàng và mạng xã hội
- `src/lib/AppContext.tsx` — Nạp và phân phối `siteSettings` toàn cục (`refreshSiteSettings`)
- `src/components/TopNav.tsx` — Hiển thị liên kết mạng xã hội động
- `src/pages/user/CartPage.tsx` — Tạo VietQR động từ thông tin ngân hàng trong `siteSettings`
- `src/pages/user/ProfilePage.tsx` — Hiển thị liên hệ hỗ trợ Facebook động

---

## 4. Success Criteria
- **SC-001**: Lưu toàn bộ cấu hình hệ thống hoàn thành trong < 800ms.
- **SC-002**: Thay đổi thông tin ngân hàng lập tức có hiệu lực ngay trong phiên thanh toán tiếp theo của học viên mà không cần khởi động lại server.
- **SC-003**: Không có bất kỳ đường dẫn mạng xã hội hoặc số tài khoản nào bị hardcode cứng trong mã nguồn giao diện.
