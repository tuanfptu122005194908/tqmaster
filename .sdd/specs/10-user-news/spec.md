# Feature Specification: Student Community Feed & Interactions

**Feature Branch**: `[main]`  
**Status**: ✅ Implemented

---

## 1. Overview
Bảng tin tin tức cộng đồng (`/news`) là nơi học viên tiếp cận các thông tin quan trọng từ đội ngũ giảng dạy TQMaster. Học viên có thể đọc bài viết, xem thư viện hình ảnh, thả tim (Like) và thảo luận bình luận (Comment) tương tác hai chiều.

---

## 2. User Scenarios & Testing

### User Story 1 – Xem dòng tin tức & Thư viện ảnh (Priority: P1)
Là một học viên, tôi muốn lướt xem các bài viết mới nhất để không bỏ lỡ thông báo thi cử.

**Acceptance Scenarios**:
1. **Given** học viên đã đăng nhập và vào `/news`, **When** trang tải, **Then** danh sách bài viết từ `news_posts` hiển thị theo thứ tự thời gian mới nhất lên đầu.
2. **Given** bài viết có nhiều ảnh, **When** học viên xem bài, **Then** các ảnh được bố trí dạng lưới trực quan, rõ ràng.

### User Story 2 – Thả tim bài viết (Like) (Priority: P2)
Là một học viên, tôi muốn tương tác thể hiện sự yêu thích với bài viết hữu ích.

**Acceptance Scenarios**:
1. **Given** học viên xem một bài viết, **When** click vào nút Tim (Heart), **Then** số lượt thích tăng lên ngay lập tức (optimistic UI update), icon chuyển sang màu đỏ và bản ghi được ghi vào `news_likes`.
2. **Given** học viên đã like bài viết, **When** click lại nút Tim, **Then** lượt thích giảm đi 1 và bản ghi trong `news_likes` bị xóa.

### User Story 3 – Bình luận & Thảo luận (Priority: P2)
Là một học viên, tôi muốn để lại thắc mắc hoặc thảo luận dưới bài viết.

**Acceptance Scenarios**:
1. **Given** học viên mở khu vực bình luận của bài viết, **When** gõ nội dung và bấm Gửi, **Then** bình luận xuất hiện ngay kèm tên và avatar của học viên.
2. **Given** học viên là tác giả của một bình luận (hoặc tài khoản là Admin), **When** bấm icon Thùng rác, **Then** bình luận đó bị xóa khỏi cơ sở dữ liệu.

---

## 3. Requirements

### Functional Requirements
- **FR-001**: Hệ thống hiển thị bài viết từ bảng `news_posts` kèm hình ảnh đính kèm, định dạng thời gian thân thiện.
- **FR-002**: Tính năng Like cập nhật lạc quan (Optimistic Update) trên giao diện trước khi gửi request tới bảng `news_likes`.
- **FR-003**: Cho phép người dùng gửi bình luận vào bảng `news_comments`, lưu trữ `author_name` và `author_avatar` tại thời điểm gửi.
- **FR-004**: Phân quyền xóa bình luận: Học viên chỉ được xóa bình luận do chính mình viết; Quản trị viên (`isAdmin = true`) có quyền xóa mọi bình luận không phù hợp.

### Key Entities
- **news_posts**: `id`, `title`, `content`, `images`, `created_at`.
- **news_likes**: `post_id` (uuid), `user_id` (uuid).
- **news_comments**: `id` (uuid), `post_id` (uuid), `user_id` (uuid), `content` (text), `created_at` (timestamptz), `author_name` (text), `author_avatar` (text).

---

## 4. Success Criteria
- **SC-001**: Trạng thái Like phản hồi tức thì (< 50ms) không bị khựng giao diện.
- **SC-002**: Bình luận hiển thị chuẩn xác, không bị lẫn lộn giữa các bài viết khác nhau.
