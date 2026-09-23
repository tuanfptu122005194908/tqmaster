# Feature Specification: Order Fulfillment & User Administration

**Feature Branch**: `[main]`  
**Status**: ✅ Implemented (Optimized v2.1)

---

## 1. Overview
Phân hệ quản trị đơn hàng (`/admin/orders`) và người dùng (`/admin/users`) xử lý dòng tiền thanh toán thực tế, kiểm soát bản quyền tài liệu và phân quyền tài khoản học viên trên hệ thống TQMaster. 

Trang Quản trị đơn hàng được trang bị cơ chế phân trang Server-side (50 đơn/trang) thay thế việc tải dồn toàn bộ bảng dữ liệu, có ngăn kéo (Slide Drawer) xem minh chứng chuyển khoản (Bill), duyệt/hủy đơn tức thì kèm kích hoạt quyền học tự động, và cơ chế tự động thu hồi quyền truy cập môn học khi hủy/xóa đơn. Trang Quản lý người dùng cho phép cấp quyền quản trị, thêm học viên thủ công, xuất danh sách email hàng loạt (TXT/CSV/Clipboard) để gửi thông báo/marketing, và xóa vĩnh viễn tài khoản học viên thông qua RPC bảo mật.

---

## 2. User Scenarios & Testing

### User Story 1 – Xem và duyệt đơn hàng với phân trang hiệu năng cao (Priority: P1)
Là một Quản trị viên, tôi muốn duyệt đơn hàng của học sinh một cách mượt mà ngay cả khi hệ thống có hàng chục nghìn đơn.

**Acceptance Scenarios**:
1. **Given** Quản trị viên truy cập `/admin/orders`, **When** trang tải, **Then** hệ thống thực hiện phân trang server-side qua Supabase `.range(from, to)`, hiển thị 50 đơn hàng mới nhất mỗi trang, kèm thanh điều hướng (Trước / Sau / Trang X / Y).
2. **Given** danh sách đơn hàng, **When** Quản trị viên tìm kiếm theo Tên, Email hoặc Mã đơn, **Then** query lọc trực tiếp trên PostgreSQL và reset về trang 1 ngay lập tức mà không tải lại toàn trang trên từng phím bấm.
3. **Given** một đơn hàng ở trạng thái `pending` kèm ảnh bill chuyển khoản, **When** Quản trị viên click "Xem Bill" hoặc click xem chi tiết, **Then** ngăn kéo trượt ra từ bên phải màn hình hiển thị đầy đủ thông tin thanh toán, mã giảm giá áp dụng, danh sách môn học và ảnh chụp giao dịch rõ nét.
4. **Given** bill hợp lệ, **When** Quản trị viên nhấn "Duyệt", **Then** đơn hàng chuyển sang `approved`, hệ thống tự động ghi nhận quyền sở hữu môn học tương ứng vào bảng `user_subjects`, học sinh mở khóa học ngay lập tức.
5. **Given** bill sai hoặc nghi ngờ gian lận, **When** Quản trị viên nhấn "Hủy", **Then** đơn hàng chuyển sang `rejected`.

### User Story 2 – Tự động thu hồi quyền học khi xóa đơn hàng (Priority: P1)
Là một Quản trị viên, khi tôi xóa hoặc hủy một đơn hàng được duyệt nhầm hoặc bị gian lận chuyển khoản, tôi muốn hệ thống tự động tước bỏ quyền truy cập môn học của học viên đó.

**Acceptance Scenarios**:
1. **Given** một đơn hàng đã được duyệt trước đó (`status = 'approved'`), **When** Quản trị viên thực hiện xóa đơn hàng đó khỏi danh sách, **Then** database function tự động thu hồi các môn học tương ứng trong `user_subjects`.
2. **Given** học viên đã mua môn học A ở một đơn hàng hợp lệ khác, **When** xóa đơn hàng trùng lặp, **Then** quyền học môn A của học viên vẫn được bảo lưu nhờ cơ chế kiểm tra đối soát chéo đơn hàng.

### User Story 3 – Tạo tài khoản học viên thủ công từ Admin (Priority: P1)
Là một Quản trị viên, tôi muốn tạo tài khoản trực tiếp cho học viên đăng ký offline hoặc chuyển khoản riêng.

**Acceptance Scenarios**:
1. **Given** Quản trị viên mở form "Thêm học viên" tại `/admin/users`, **When** nhập Họ tên, Email, Mật khẩu khởi tạo và Mã sinh viên, **Then** hệ thống gọi Supabase Auth API với metadata `created_by_admin: true` và `must_change_password: true`. Database trigger không chặn tạo tài khoản bằng email/mật khẩu, bản ghi hồ sơ `profiles` được tạo tự động.
2. **Given** tài khoản vừa tạo, **When** học viên đăng nhập lần đầu tiên bằng mật khẩu tạm, **Then** hệ thống bắt buộc học viên phải đổi mật khẩu mới trước khi truy cập nền tảng.

### User Story 4 – Xuất danh sách email người dùng (Export User Emails) (Priority: P2)
Là một Quản trị viên, tôi muốn xuất danh sách email của học viên ra file TXT, CSV hoặc copy nhanh vào clipboard để gửi thông báo lịch thi, cập nhật tài liệu hoặc email marketing.

**Acceptance Scenarios**:
1. **Given** Quản trị viên tại `/admin/users`, **When** bấm nút "Xuất Email" (icon Mail), **Then** modal `Export Emails` hiển thị với số lượng email hợp lệ đã được khử trùng lặp.
2. **Given** Quản trị viên đang lọc danh sách học viên theo từ khóa hoặc môn học, **When** chọn phạm vi "Chỉ danh sách đang lọc", **Then** số lượng email cập nhật đúng theo kết quả bộ lọc hiện tại.
3. **Given** Quản trị viên cần gửi email hàng loạt qua Google Group / BCC, **When** chọn phân tách bằng dấu phẩy (Comma) hoặc dòng mới (Newline) và bấm "Sao chép danh sách", **Then** danh sách được sao chép vào clipboard và icon hiển thị trạng thái "Đã sao chép".
4. **Given** Quản trị viên muốn lưu trữ, **When** bấm "Tải file .TXT" hoặc "Tải file .CSV", **Then** trình duyệt tải xuống file với định dạng chuẩn UTF-8.

### User Story 5 – Phân quyền quản trị & Xóa tài khoản học viên (Priority: P2)
Là một Quản trị viên cấp cao, tôi muốn phân quyền quản trị viên phụ hoặc xóa triệt để tài khoản vi phạm chính sách.

**Acceptance Scenarios**:
1. **Given** danh sách học viên tại `/admin/users`, **When** Quản trị viên bấm nút thay đổi quyền (`ShieldCheck` / `ShieldOff`), **Then** bảng `user_roles` và trường `role` trong `profiles` được cập nhật đồng bộ.
2. **Given** tài khoản học viên gian lận hoặc spam, **When** Quản trị viên chọn "Xóa tài khoản" và xác nhận cảnh báo, **Then** hệ thống gọi RPC `delete_user_by_admin` xóa sạch dữ liệu người dùng khỏi bảng `auth.users` và các bảng quan hệ.

---

## 3. Requirements

### Functional Requirements
- **FR-001**: Quản trị đơn hàng PHẢI hỗ trợ phân trang Server-side bằng `.range(from, to)` với kích thước trang cố định (50 records/trang).
- **FR-002**: Chỉ số thống kê (Chờ duyệt, Đã duyệt, Doanh thu, TB đơn) PHẢI truy vấn riêng biệt trên toàn bộ bảng bằng HEAD count, không phụ thuộc vào 50 đơn của trang hiện tại.
- **FR-003**: Cho phép tìm kiếm đơn hàng không phân biệt hoa thường theo `full_name`, `email`, hoặc `id` thông qua toán tử `.or()` của Supabase mà không gây giật lag hoặc reload trang khi nhập phím.
- **FR-004**: Khi duyệt đơn hàng (`status = 'approved'`), hệ thống PHẢI đảm bảo học viên sở hữu các môn học trong `order_items` (ghi vào `user_subjects`).
- **FR-005**: Có ngăn kéo chi tiết (Slide Drawer) hiển thị ảnh bằng chứng chuyển khoản `bill_image_url`, danh sách môn học, mã giảm giá và chiết khấu.
- **FR-006**: Đăng ký kênh Supabase Realtime để cập nhật đơn hàng tức thì khi có học viên vừa thanh toán.
- **FR-007**: Admin tạo học viên mới PHẢI gán cờ `created_by_admin: true` trong user metadata để bypass chính sách chặn đăng ký email tự do, kèm cờ `must_change_password: true` để ép đổi mật khẩu lần đầu.
- **FR-008 (Export Emails Modal)**: Cung cấp cửa sổ xuất email cho phép chọn phạm vi (`all` | `filtered`), định dạng phân tách (`newline` | `comma`), copy clipboard và download file `.txt` / `.csv`.
- **FR-009 (Tự động thu hồi quyền môn học)**: Tích hợp trigger database/logic thu hồi quyền trong `user_subjects` khi xóa một đơn hàng đã duyệt, đảm bảo tính toàn vẹn bản quyền học liệu.
- **FR-010 (Xóa tài khoản bảo mật)**: Sử dụng Database Function `delete_user_by_admin(user_id)` với quyền `SECURITY DEFINER` để Quản trị viên xóa triệt để tài khoản học viên vi phạm.
- **FR-011 (Pagination Chunking)**: Trang `AdminUsers.tsx` sử dụng hàm `fetchAll` lặp tuần tự từng khối 1000 bản ghi để khắc phục giới hạn phân trang mặc định của PostgREST.

### Key Entities
- **orders**: `id`, `created_at`, `final_amount`, `original_amount`, `discount_amount`, `discount_code`, `status`, `full_name`, `email`, `student_code`, `note`, `bill_image_url`, `reviewed_at`, `reviewed_by`.
- **order_items**: `id`, `order_id`, `subject_id`, `price`.
- **user_subjects**: `id`, `user_id`, `subject_id`, `created_at`.
- **profiles**: `id`, `email`, `full_name`, `student_code`, `phone_number`, `role`, `created_at`.
- **user_roles**: `id`, `user_id`, `role`.

### Key Files
- `src/pages/admin/AdminOrders.tsx` — Quản trị đơn hàng, duyệt/hủy đơn, xem bill drawer, tự động thu hồi quyền môn học
- `src/pages/admin/AdminUsers.tsx` — Quản trị người dùng, tạo tài khoản thủ công, xuất email TXT/CSV/Copy, phân quyền & xóa tài khoản
- `src/lib/AppContext.tsx` — Quản lý số lượng đơn chờ duyệt `pendingOrdersCount` thời gian thực

---

## 4. Success Criteria
- **SC-001**: Thao tác chuyển trang danh sách đơn hàng phản hồi trong < 300ms.
- **SC-002**: Không giới hạn số lượng đơn hàng tối đa có thể xem (đã loại bỏ giới hạn 200 đơn cũ).
- **SC-003**: Học viên có thể vào học ngay lập tức sau khi đơn hàng được Admin duyệt.
- **SC-004**: Xuất danh sách email cho hơn 1.000 học viên hoàn tất ngay tức thì (< 100ms), không chứa email trùng lặp.
- **SC-005**: Quyền học môn được thu hồi chính xác tuyệt đối ngay khi xóa đơn hàng gian lận.
