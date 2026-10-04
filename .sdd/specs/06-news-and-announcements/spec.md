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


---

## Merged from 10-user-news

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


---

## Merged from 16-system-announcements

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
