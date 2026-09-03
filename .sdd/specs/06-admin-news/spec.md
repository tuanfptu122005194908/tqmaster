# Feature Specification: News & Community Post Administration

**Feature Branch**: `[main]`  
**Status**: ✅ Implemented

---

## 1. Overview
Phân hệ Quản trị Tin tức (`/admin/news`) cho phép Quản trị viên đăng tải các thông báo cập nhật, tin tức kỳ thi, cẩm nang phương pháp học và sự kiện của TQMaster. Hỗ trợ tải lên nhiều hình ảnh đồng thời, lưu trữ trên Supabase Storage bucket `news-images` và tự động hiển thị trên bảng tin cộng đồng của học viên (`/news`).

---

## 2. User Scenarios & Testing

### User Story 1 – Đăng bài viết tin tức mới (Priority: P1)
Là một Quản trị viên, tôi muốn viết bài tin tức kèm bộ sưu tập ảnh để thông báo lịch thi hoặc tài liệu mới.

**Acceptance Scenarios**:
1. **Given** Quản trị viên ở `/admin/news`, **When** click "Thêm bài viết", nhập Tiêu đề, Nội dung và chọn nhiều ảnh, **Then** ảnh được upload lên bucket `news-images`, bài viết được lưu vào bảng `news_posts`.
2. **Given** bài viết vừa đăng, **When** học viên vào `/news`, **Then** bài viết xuất hiện ở đầu trang với định dạng bài đăng mạng xã hội chuyên nghiệp.

### User Story 2 – Chỉnh sửa & Xóa bài viết (Priority: P2)
Là một Quản trị viên, tôi muốn sửa nội dung, gỡ bớt ảnh hoặc xóa bài viết lỗi thời.

**Acceptance Scenarios**:
1. **Given** một bài viết hiện có, **When** Quản trị viên nhấn nút Sửa, thay đổi tiêu đề và xóa 1 ảnh, **Then** bản ghi trong `news_posts` được cập nhật chính xác.
2. **Given** Quản trị viên nhấn Xóa bài viết, **Then** bài viết cùng các tương tác like/comment liên quan bị xóa hoàn toàn.

---

## 3. Requirements

### Functional Requirements
- **FR-001**: Quản trị viên có toàn quyền CRUD trên bảng `news_posts`.
- **FR-002**: Hỗ trợ upload nhiều hình ảnh cùng lúc, lưu tên file ngẫu nhiên theo timestamp lên bucket `news-images` với public URL.
- **FR-003**: Cho phép xóa từng ảnh trong danh sách xem trước trước khi bấm Lưu.
- **FR-004**: Hiển thị ngày đăng, số lượng hình ảnh đính kèm và trích đoạn nội dung trong danh sách quản trị.

### Key Entities
- **news_posts**: `id` (uuid), `title` (text), `content` (text), `images` (text[]), `created_at` (timestamptz).

---

## 4. Success Criteria
- **SC-001**: Upload và tạo bài viết mới hoàn tất trong < 3 giây với 3-5 ảnh chất lượng cao.
- **SC-002**: Dữ liệu đồng bộ lập tức sang trang đọc tin của học viên.
