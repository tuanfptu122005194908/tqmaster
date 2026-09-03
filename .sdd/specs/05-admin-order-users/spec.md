# Feature Specification: Order Fulfillment & User Administration

**Feature Branch**: `[main]`  
**Status**: ✅ Implemented (Optimized v2.0)

---

## 1. Overview
Phân hệ quản trị đơn hàng (`/admin/orders`) và người dùng (`/admin/users`) xử lý dòng tiền thanh toán thực tế và phân quyền tài khoản học viên trên hệ thống TQMaster. 

Trang Quản trị đơn hàng được trang bị cơ chế phân trang Server-side (50 đơn/trang) thay thế việc tải dồn toàn bộ bảng dữ liệu, có ngăn kéo (Slide Drawer) xem minh chứng chuyển khoản (Bill), duyệt/hủy đơn tức thì kèm kích hoạt quyền học tự động. Trang Quản lý người dùng cho phép cấp quyền quản trị, thêm học viên thủ công (vượt qua kiểm duyệt Google OAuth) và trực tiếp quản lý môn học của từng học viên.

---

## 2. User Scenarios & Testing

### User Story 1 – Xem và duyệt đơn hàng với phân trang hiệu năng cao (Priority: P1)
Là một Quản trị viên, tôi muốn duyệt đơn hàng của học sinh một cách mượt mà ngay cả khi hệ thống có hàng chục nghìn đơn.

**Acceptance Scenarios**:
1. **Given** Quản trị viên truy cập `/admin/orders`, **When** trang tải, **Then** hệ thống thực hiện phân trang server-side qua Supabase `.range(from, to)`, hiển thị 50 đơn hàng mới nhất mỗi trang, kèm thanh điều hướng (Trước / Sau / Trang X / Y).
2. **Given** danh sách đơn hàng, **When** Quản trị viên tìm kiếm theo Tên, Email hoặc Mã đơn, **Then** query lọc trực tiếp trên PostgreSQL và reset về trang 1 ngay lập tức.
3. **Given** một đơn hàng ở trạng thái `pending` kèm ảnh bill chuyển khoản, **When** Quản trị viên click "Xem Bill" hoặc click xem chi tiết, **Then** ngăn kéo trượt ra từ bên phải màn hình hiển thị đầy đủ thông tin thanh toán, mã giảm giá áp dụng, danh sách môn học và ảnh chụp giao dịch rõ nét.
4. **Given** bill hợp lệ, **When** Quản trị viên nhấn "Duyệt", **Then** đơn hàng chuyển sang `approved`, hệ thống tự động ghi nhận quyền sở hữu môn học tương ứng vào bảng `user_subjects`, học sinh mở khóa học ngay lập tức.
5. **Given** bill sai hoặc nghi ngờ gian lận, **When** Quản trị viên nhấn "Hủy", **Then** đơn hàng chuyển sang `rejected`.

### User Story 2 – Tạo tài khoản học viên thủ công từ Admin (Priority: P1)
Là một Quản trị viên, tôi muốn tạo tài khoản trực tiếp cho học viên đăng ký offline hoặc chuyển khoản riêng.

**Acceptance Scenarios**:
1. **Given** Quản trị viên mở form "Thêm học viên" tại `/admin/users`,
2. **When** nhập Họ tên, Email, Mật khẩu khởi tạo và Mã sinh viên,
3. **Then** hệ thống gọi Supabase Auth API với metadata `created_by_admin: true` và `must_change_password: true`. Database trigger không chặn tạo tài khoản bằng email/mật khẩu, bản ghi hồ sơ `profiles` được tạo tự động.
4. **Given** tài khoản vừa tạo, **When** học viên đăng nhập lần đầu tiên bằng mật khẩu tạm, **Then** hệ thống bắt buộc học viên phải đổi mật khẩu mới trước khi truy cập nền tảng.

### User Story 3 – Quản trị phân quyền & Cấp quyền môn học trực tiếp (Priority: P2)
Là một Quản trị viên, tôi muốn nâng quyền cho cộng tác viên và mở khóa môn học trực tiếp cho học viên cụ thể.

**Acceptance Scenarios**:
1. **Given** danh sách học viên tại `/admin/users`, **When** Quản trị viên thay đổi vai trò từ `user` sang `admin`, **Then** bảng `user_roles` và trường `role` trong `profiles` được cập nhật, tài khoản có quyền truy cập thanh menu quản trị.
2. **Given** một học viên, **When** Quản trị viên mở modal quản lý môn học của học viên đó và tick chọn các môn học, **Then** các bản ghi `user_subjects` được đồng bộ tương ứng.

---

## 3. Requirements

### Functional Requirements
- **FR-001**: Quản trị đơn hàng PHẢI hỗ trợ phân trang Server-side bằng `.range(from, to)` với kích thước trang cố định (50 records/trang).
- **FR-002**: Chỉ số thống kê (Chờ duyệt, Đã duyệt, Doanh thu, TB đơn) PHẢI truy vấn riêng biệt trên toàn bộ bảng bằng HEAD count, không phụ thuộc vào 50 đơn của trang hiện tại.
- **FR-003**: Cho phép tìm kiếm đơn hàng không phân biệt hoa thường theo `full_name`, `email`, hoặc `id` thông qua toán tử `.or()` của Supabase.
- **FR-004**: Khi duyệt đơn hàng (`status = 'approved'`), hệ thống PHẢI đảm bảo học viên sở hữu các môn học trong `order_items` (ghi vào `user_subjects`).
- **FR-005**: Có ngăn kéo chi tiết (Slide Drawer) hiển thị ảnh bằng chứng chuyển khoản `bill_image_url`, danh sách môn học, mã giảm giá và chiết khấu.
- **FR-006**: Đăng ký kênh Supabase Realtime để cập nhật đơn hàng tức thì khi có học viên vừa thanh toán.
- **FR-007**: Admin tạo học viên mới PHẢI gán cờ `created_by_admin: true` trong user metadata để bypass chính sách chặn đăng ký email tự do, kèm cờ `must_change_password: true` để ép đổi mật khẩu lần đầu.

### Key Entities
- **orders**: `id`, `created_at`, `final_amount`, `original_amount`, `discount_amount`, `discount_code`, `status`, `full_name`, `email`, `student_code`, `note`, `bill_image_url`, `reviewed_at`, `reviewed_by`.
- **order_items**: `id`, `order_id`, `subject_id`, `price`.
- **user_subjects**: `id`, `user_id`, `subject_id`, `created_at`.
- **profiles**: `id`, `email`, `full_name`, `student_code`, `phone_number`, `role`, `created_at`.
- **user_roles**: `id`, `user_id`, `role`.

---

## 4. Success Criteria
- **SC-001**: Thao tác chuyển trang danh sách đơn hàng phản hồi trong < 300ms.
- **SC-002**: Không giới hạn số lượng đơn hàng tối đa có thể xem (đã loại bỏ giới hạn 200 đơn cũ).
- **SC-003**: Học viên có thể vào học ngay lập tức sau khi đơn hàng được Admin duyệt.
