---
id: "06-news-and-announcements"
title: "User Story 6 - Tin tức & Thông báo (News & Announcements)"
status: "IMPLEMENTED"
created_date: "2026-02-27"
---

# 1. Overview
Tính năng **Tin tức & Thông báo** (News & Announcements) cung cấp một kênh giao tiếp nội bộ tương tự như mạng xã hội (Facebook Feed) giữa Quản trị viên và Học viên. 
- Ở phía **Admin (`AdminNews.tsx`)**, quản trị viên có thể soạn thảo bài viết mới, đính kèm nhiều hình ảnh trực tiếp lên bucket, sửa hoặc xóa bài viết. 
- Ở phía **Client (`NewsPage.tsx`)**, học viên sẽ thấy các bài viết dưới dạng luồng tin tức (feed), có thể thả tim (Like), và bình luận (Comment). Hệ thống bình luận được tối ưu hóa theo dạng lazy-loading, và hỗ trợ quyền xóa bình luận đối với chính chủ hoặc Admin.

# 2. User Scenarios

### User Story 1 – Quản trị viên viết & Đăng thông báo (Priority: P1)
Là một Quản trị viên, tôi muốn đăng các bài viết tin tức mới (lịch thi, khuyến mãi, cập nhật tính năng) kèm hình ảnh trực quan để thu hút học viên.

**Acceptance Scenarios**:
1. **Given** Quản trị viên đang ở trang quản lý tin tức (`/admin/news`), **When** bấm "Đăng bài mới", **Then** một modal soạn thảo xuất hiện yêu cầu nhập Tiêu đề, Nội dung, và cho phép chọn nhiều hình ảnh upload.
2. **Given** Quản trị viên chọn upload hình ảnh, **When** chọn file ảnh, **Then** hệ thống sẽ tải ảnh lên Supabase Storage bucket `news-images`, sinh URL public, và hiển thị preview thumbnail ngay lập tức trên UI. Quản trị viên có thể xóa ảnh preview nếu chọn nhầm.
3. **Given** Quản trị viên đã nhập đủ thông tin, **When** bấm "Lưu thay đổi", **Then** bài viết được insert vào bảng `news_posts` và hiển thị trên đầu danh sách bài viết.

### User Story 2 – Học viên lướt bảng tin (Feed) và Tương tác (Priority: P1)
Là một Học viên, tôi muốn xem các tin tức mới nhất từ hệ thống và có thể tương tác (Thích, Bình luận) giống mạng xã hội.

**Acceptance Scenarios**:
1. **Given** Học viên truy cập trang Tin tức (`/news`), **When** trang load, **Then** danh sách bài viết được hiển thị theo thời gian mới nhất, kèm theo số lượng Like (tổng hợp từ bảng `news_likes`) được tính toán ngay từ đầu.
2. **Given** một bài viết có nhiều ảnh, **When** hệ thống render bài viết, **Then** ảnh sẽ được xếp thành lưới (grid) tự động tùy thuộc vào số lượng (1 ảnh thì full width, nhiều ảnh thì grid 2 cột).
3. **Given** Học viên bấm nút "Thích" (Heart icon), **When** đã đăng nhập, **Then** màu sắc nút Thích chuyển sang màu nổi bật, số lượng Like tăng thêm 1 (UI cập nhật tức thời) và dữ liệu được ghi vào `news_likes`. Bấm lần nữa sẽ hủy Thích (Unlike).

### User Story 3 – Bình luận và Quản lý bình luận (Priority: P2)
Là một Học viên hoặc Quản trị viên, tôi muốn bình luận dưới các bài viết để trao đổi thông tin. Tôi có thể xóa bình luận của mình, và Admin có thể xóa bất kỳ bình luận nào vi phạm.

**Acceptance Scenarios**:
1. **Given** Học viên bấm vào nút "Bình luận" trên một bài viết, **When** khu vực bình luận mở ra, **Then** hệ thống sẽ gọi API lazy-load danh sách bình luận (bảng `news_comments`) cho riêng bài viết đó, kết hợp (join) thông tin tác giả từ `profiles`.
2. **Given** Học viên gõ nội dung vào ô bình luận, **When** bấm Enter hoặc nút Send, **Then** bình luận được lưu vào cơ sở dữ liệu và danh sách bình luận lập tức tải lại hiển thị bình luận mới.
3. **Given** Học viên nhìn thấy bình luận của chính mình (hoặc Admin nhìn thấy bất kỳ bình luận nào), **When** bấm nút "Xóa" kèm theo icon Trash, **Then** hệ thống hiện popup xác nhận và tiến hành xóa bình luận khỏi cơ sở dữ liệu.

---

## 3. Requirements

### Functional Requirements
- **FR-001 (Multi-Image Upload)**: Form tạo bài viết PHẢI hỗ trợ upload nhiều ảnh cùng lúc lên bucket `news-images`, lưu các `publicUrl` dưới dạng mảng text trong cột `images` của bảng `news_posts`.
- **FR-002 (Like System - Optimistic UI)**: Nút thả tim PHẢI phản hồi ngay lập tức trên UI (đổi màu, tăng/giảm counter) trước cả khi Supabase API trả về kết quả, nhằm mang lại trải nghiệm tương tác mượt mà.
- **FR-003 (Lazy Load Comments)**: Bình luận KHÔNG ĐƯỢC fetch cùng lúc với danh sách bài viết để tiết kiệm băng thông. Bình luận CHỈ ĐƯỢC fetch khi người dùng bấm mở mục bình luận của một bài viết cụ thể.
- **FR-004 (Comment Author Mapping)**: Khi fetch bình luận, hệ thống phải trích xuất tập các `user_id` duy nhất và truy vấn bảng `profiles` một lần duy nhất để lấy thông tin `full_name`, `username`, `avatar_url` ráp vào bình luận.
- **FR-005 (Authorization on Deletion)**: Chức năng xóa bình luận phải hiển thị nút xóa ĐÚNG ĐỐI TƯỢNG (chỉ tác giả của bình luận hoặc User có role Admin mới thấy nút Xóa).

### Key Entities
- **news_posts**: `id`, `title`, `content`, `images` (array of text), `created_at`, `created_by`.
- **news_likes**: `post_id`, `user_id`, `created_at`.
- **news_comments**: `id`, `post_id`, `user_id`, `content`, `created_at`.
- **profiles**: `id`, `full_name`, `username`, `avatar_url`.

### Key Files
- `src/pages/admin/AdminNews.tsx` — Quản trị tin tức, editor, multi-image upload handler, dashboard layout.
- `src/pages/user/NewsPage.tsx` — Giao diện đọc tin tức của người dùng (feed), lazy comments, like toggle logic.

---

## 4. Success Criteria
- **SC-001**: Quản trị viên upload thành công nhiều ảnh cho 1 bài viết và không xảy ra lỗi khi render lưới ảnh bên phía User.
- **SC-002**: Trang bảng tin (`/news`) tải dữ liệu 10 bài viết mới nhất nhanh chóng, không bị chậm do phải load kèm theo toàn bộ bình luận của cả 10 bài viết (nhờ thiết kế lazy-load).
- **SC-003**: Người dùng bấm nút "Thích" và nút bấm lập tức đổi trạng thái ngay, không có độ trễ UI.
- **SC-004**: Người dùng có thể xóa bình luận của mình thành công và UI cập nhật biến mất bình luận đó. Quản trị viên (có cờ `isAdmin` từ `AppContext`) có thể xóa bất kỳ bình luận nào.
