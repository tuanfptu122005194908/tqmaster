# Feature Specification: System Announcements & Modal Popups

**Feature Branch**: `[main]`  
**Status**: ✅ Implemented

---

## 1. Overview
Hệ thống Thông báo hệ thống và Popup (`/admin/announcements` và `AnnouncementPopup.tsx`) cho phép Quản trị viên phát đi các thông báo khẩn cấp, lịch nghỉ lễ, bảo trì hệ thống hoặc cập nhật khóa học mới. 

Thông báo có thể gửi toàn sàn (Global) hoặc theo từng môn học cụ thể. Khi học viên mở ứng dụng, một cửa sổ bật lên (Modal Popup) trang trọng xuất hiện hiển thị banner hình ảnh và nội dung thông báo, kèm cơ chế ghi nhớ đã xem bằng `localStorage`.

---

## 2. User Scenarios & Testing

### User Story 1 – Đăng thông báo mới từ Admin (Priority: P1)
Là một Quản trị viên, tôi muốn phát thông báo mới kèm banner hình ảnh và liên kết môn học.

**Acceptance Scenarios**:
1. **Given** Quản trị viên ở `/admin/announcements`, **When** click "Tạo thông báo", nhập Tiêu đề, Nội dung chi tiết, chọn Môn học (hoặc để trống nếu là thông báo chung toàn trường), tải lên ảnh banner, **Then** thông báo được lưu vào bảng `announcements`.
2. **Given** thông báo vừa được lưu, **When** học viên đăng nhập hoặc tải lại trang chủ, **Then** cửa sổ popup thông báo hiển thị nổi bật giữa màn hình.

### User Story 2 – Trải nghiệm xem popup của học viên (Priority: P1)
Là một học viên, tôi muốn xem thông báo quan trọng một lần mà không bị làm phiền lặp đi lặp lại mỗi khi chuyển trang.

**Acceptance Scenarios**:
1. **Given** có thông báo mới mà học viên chưa xem, **When** học viên truy cập ứng dụng, **Then** modal `AnnouncementPopup` mở lên kèm hiệu ứng mờ nền (Backdrop blur), hiển thị ảnh và nội dung định dạng.
2. **Given** học viên bấm nút "Đã hiểu" hoặc icon X đóng popup, **When** modal đóng lại, **Then** ID của thông báo được lưu vào `localStorage`. Các lần chuyển trang tiếp theo popup sẽ không bật lại cho đến khi có thông báo mới hơn.

---

## 3. Requirements

### Functional Requirements
- **FR-001**: Quản trị viên có toàn quyền CRUD trên bảng `announcements` (`title`, `content`, `subject_id`, `image_url`, `created_by`).
- **FR-002**: Hỗ trợ tải ảnh banner minh họa thông báo lên Supabase Storage bucket `announcement-images`.
- **FR-003**: Cho phép lọc thông báo theo Môn học hoặc xem Toàn bộ thông báo chung.
- **FR-004**: Component `AnnouncementPopup` chỉ xuất hiện trên giao diện học viên (`!isAdmin`), không hiển thị trên giao diện quản trị.
- **FR-005**: Sử dụng `localStorage` lưu trữ danh sách ID thông báo đã đóng để đảm bảo không hiển thị lại gây phiền phức cho học viên.
- **FR-006**: Hỗ trợ định dạng văn bản giàu (Rich Text / Markdown) qua bộ xử lý `renderRichText`.

### Key Entities
- **announcements**: `id` (uuid), `title` (text), `content` (text), `subject_id` (uuid nullable -> subjects), `image_url` (text), `created_at` (timestamptz), `created_by` (uuid -> profiles).

---

## 4. Success Criteria
- **SC-001**: Popup xuất hiện mượt mà ngay sau khi người dùng đăng nhập thành công.
- **SC-002**: Khi người dùng đã đóng popup, không bao giờ tự động hiện lại trong cùng một phiên duyệt web.
