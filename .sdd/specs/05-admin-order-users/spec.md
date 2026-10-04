---
id: "05-admin-order-users"
title: "User Story 5 - Quản lý Đơn hàng & Người dùng (Admin)"
status: "IMPLEMENTED"
created_date: "2026-02-27"
---

# 1. Overview
Tính năng **Quản lý Đơn hàng & Người dùng (Admin)** tại thư mục `src/pages/admin/` đảm nhận vai trò quản trị then chốt trong hệ sinh thái TQMaster. 
- **AdminOrders**: Giám sát giao dịch mua môn học, phê duyệt/hủy đơn hàng, kiểm tra minh chứng (bill), và hỗ trợ tự động thu hồi quyền truy cập môn học nếu admin xóa một đơn hàng đã được duyệt trước đó. Giao diện được tối ưu hóa cho tốc độ bằng cách kết hợp cơ chế phân trang phía Server (Server-side Pagination) với realtime sync.
- **AdminUsers**: Quản lý hồ sơ học viên, tạo mới tài khoản trực tiếp qua Edge Functions (bỏ qua email giới hạn), cấp/thu hồi quyền truy cập môn học, phân quyền Admin, và xuất danh sách Email hàng loạt cho mục đích Marketing. Giải quyết được bài toán lấy toàn bộ dữ liệu qua hàm Chunking (fetchAll) để né giới hạn 1000 records của Supabase.

# 2. User Scenarios

### User Story 1 – Quản lý & Phê duyệt đơn hàng tốc độ cao (Priority: P1)
Là một Quản trị viên, tôi muốn xử lý các đơn đặt hàng chuyển khoản thủ công của học viên một cách nhanh chóng, đồng thời theo dõi dòng tiền minh bạch.

**Acceptance Scenarios**:
1. **Given** một danh sách đơn hàng rất dài, **When** tôi chuyển trang hoặc áp dụng bộ lọc (Trạng thái/Ngày tháng/Tìm kiếm), **Then** hệ thống sẽ fetch lại dữ liệu từ server-side bằng `.range()` và `.ilike()` một cách mượt mà nhờ cơ chế debounce (350ms) để không bị spam request.
2. **Given** một đơn hàng mới tạo từ học viên, **When** học viên upload xong ảnh minh chứng và bấm thanh toán, **Then** tab AdminOrders của tôi sẽ nhận được sự kiện Realtime qua `supabase.channel` và tự động cập nhật danh sách mà không cần reload trang.
3. **Given** một đơn hàng chờ duyệt có kèm ảnh bill, **When** tôi bấm vào icon con mắt (View), **Then** hệ thống sẽ tự động sinh link ký (signed URL) của bucket `bill-images` (hết hạn trong 300s) và mở drawer xem trước minh chứng cùng chi tiết các môn.

### User Story 2 – Thu hồi bản quyền môn học an toàn (Priority: P1)
Là một Quản trị viên, tôi muốn khi xóa một đơn hàng đã duyệt do phát hiện gian lận hoặc sai sót, học viên sẽ ngay lập tức mất quyền truy cập môn học đó (trừ khi họ đã mua hợp lệ ở một đơn hàng khác).

**Acceptance Scenarios**:
1. **Given** một đơn hàng đã được duyệt trước đó (`status = 'approved'`), **When** Quản trị viên thực hiện xóa đơn hàng, **Then** hệ thống kiểm tra từng môn học trong đơn. Nếu học viên không có đơn hàng approved nào khác chứa môn học đó, bản ghi trong bảng `user_subjects` sẽ bị xóa, thu hồi quyền học tập.
2. **Given** học viên đã mua môn học A ở một đơn hàng hợp lệ khác, **When** xóa đơn hàng trùng lặp chứa môn A, **Then** quyền học môn A của học viên vẫn được bảo lưu nhờ cơ chế kiểm tra đối soát chéo đơn hàng.

### User Story 3 – Tạo tài khoản học viên thủ công từ Admin (Priority: P1)
Là một Quản trị viên, tôi muốn tạo tài khoản trực tiếp cho học viên đăng ký offline hoặc chuyển khoản riêng, bỏ qua bước đăng ký chuẩn.

**Acceptance Scenarios**:
1. **Given** Quản trị viên mở form "Thêm thành viên" tại `/admin/users`, **When** nhập Họ tên, Email, Mật khẩu và Mã sinh viên, **Then** hệ thống gọi Supabase Edge Function `admin-create-user` bằng Service Role.
2. **Given** Edge Function được gọi thành công, **Then** tài khoản sẽ được tạo trực tiếp trên hệ thống auth của Supabase, không bị block, và thông tin profile tự động được khởi tạo.

### User Story 4 – Xuất danh sách email người dùng (Export User Emails) (Priority: P2)
Là một Quản trị viên, tôi muốn xuất danh sách email của học viên ra file TXT, CSV hoặc copy nhanh vào clipboard để gửi thông báo lịch thi, cập nhật tài liệu hoặc email marketing.

**Acceptance Scenarios**:
1. **Given** Quản trị viên tại `/admin/users`, **When** bấm nút "Xuất Email", **Then** modal Export Emails hiển thị với số lượng email hợp lệ (đã được khử trùng lặp).
2. **Given** Quản trị viên đang lọc danh sách học viên theo từ khóa hoặc role, **When** chọn phạm vi "Chỉ danh sách đang lọc", **Then** số lượng email cập nhật đúng theo kết quả bộ lọc hiện tại.
3. **Given** Quản trị viên muốn gửi email hàng loạt qua Google Group / BCC, **When** chọn phân tách bằng dấu phẩy (Comma) hoặc dòng mới (Newline) và bấm "Sao chép danh sách", **Then** danh sách được chép vào clipboard.
4. **Given** Quản trị viên muốn lưu trữ, **When** bấm "Tải file .TXT" hoặc "Tải file .CSV", **Then** trình duyệt tải xuống file với định dạng chuẩn UTF-8.

### User Story 5 – Phân quyền quản trị & Quản lý User (Priority: P2)
Là một Quản trị viên cấp cao, tôi muốn phân quyền cho admin phụ, cấp thủ công môn học cho một tài khoản hoặc xóa triệt để tài khoản vi phạm.

**Acceptance Scenarios**:
1. **Given** danh sách học viên tại `/admin/users`, **When** Quản trị viên bấm nút thay đổi quyền Toggle, **Then** bảng `user_roles` sẽ được insert hoặc delete bản ghi `admin` cho user đó.
2. **Given** Quản trị viên muốn mở khóa khóa học nhanh cho một học viên, **When** bấm vào biểu tượng "Cấp quyền môn học", **Then** một modal hiển thị các môn học, cho phép toggle Bật/Tắt môn học ngay lập tức, dữ liệu đồng bộ với `user_subjects`.
3. **Given** tài khoản học viên gian lận, **When** Quản trị viên chọn "Xóa người dùng" và xác nhận, **Then** hệ thống gọi RPC `delete_user_by_admin` xóa sạch dữ liệu người dùng khỏi bảng `auth.users` và profile liên quan.

---

## 3. Requirements

### Functional Requirements
- **FR-001 (Server-Side Pagination)**: Quản lý đơn hàng (AdminOrders) PHẢI hỗ trợ phân trang Server-side bằng `.range(from, to)` với kích thước trang cố định (50 records/trang) và search debouncing 350ms.
- **FR-002 (Stat Counters)**: Các chỉ số thống kê (Tổng đơn, Chờ duyệt, Doanh thu) PHẢI truy vấn riêng biệt trên toàn bộ bảng bằng `count: 'exact', head: true` thay vì dựa vào trang hiện tại.
- **FR-003 (Robust Search)**: Chức năng tìm kiếm đơn hàng PHẢI xử lý và sanitize input, sau đó sử dụng toán tử `.or()` trên nhiều trường như `full_name`, `email`, `student_code`, `id`.
- **FR-004 (Smart Deletion)**: Tích hợp logic thu hồi quyền `user_subjects` an toàn ngay khi xóa một đơn hàng, kiểm tra chéo các đơn hàng approved khác của cùng user và subject.
- **FR-005 (Realtime Sync)**: Sử dụng kênh `supabase.channel` để lắng nghe event thay đổi trên `orders` với cơ chế debounce 400ms để tải lại trang và số liệu thống kê.
- **FR-006 (Admin Created Users)**: Admin tạo học viên mới PHẢI thông qua Edge Function `admin-create-user` để có quyền Service Role, vượt qua các rule chặn đăng ký thông thường.
- **FR-007 (Export Emails Modal)**: Cung cấp cửa sổ xuất email cho phép chọn phạm vi (`all` | `filtered`), định dạng phân tách (`newline` | `comma`), copy clipboard và download file `.txt` / `.csv`. Khử trùng lặp email.
- **FR-008 (Admin RPC)**: Sử dụng Database Function `delete_user_by_admin(user_id)` để Quản trị viên có thể xóa hoàn toàn một tài khoản học viên vi phạm.
- **FR-009 (Pagination Chunking)**: Trang `AdminUsers.tsx` sử dụng hàm `fetchAll` lặp tuần tự từng khối 1000 bản ghi để lấy toàn bộ dữ liệu Profiles, Roles, User_Subjects nhằm hiển thị thống kê tổng và lọc Local chính xác.

### Key Entities
- **orders**: `id`, `created_at`, `final_amount`, `status`, `full_name`, `email`, `student_code`, `note`, `bill_image_url`, `reviewed_at`, `reviewed_by`.
- **order_items**: `id`, `order_id`, `subject_id`, `price`.
- **user_subjects**: `id`, `user_id`, `subject_id`, `created_at`.
- **profiles**: `id`, `email`, `full_name`, `username`, `student_code`, `created_at`.
- **user_roles**: `id`, `user_id`, `role`.

### Key Files
- `src/pages/admin/AdminOrders.tsx` — Quản trị đơn hàng, duyêt/hủy đơn, server-side pagination, realtime sync, tự động thu hồi quyền môn học.
- `src/pages/admin/AdminUsers.tsx` — Quản trị người dùng, fetchAll chunking, tạo tài khoản qua Edge Function, xuất email TXT/CSV/Copy, phân quyền & xóa tài khoản.
- `src/lib/AppContext.tsx` — Quản lý số lượng đơn chờ duyệt `pendingOrdersCount` realtime (liên kết UI badge).

---

## 4. Success Criteria
- **SC-001**: Chuyển trang hoặc gõ tìm kiếm ở AdminOrders không gây treo máy vì sử dụng server-side querying và debounce.
- **SC-002**: Tính năng xóa đơn hàng phải thu hồi đúng quyền môn học, không được xóa nhầm quyền nếu học viên đó đã mua môn đó 2 lần.
- **SC-003**: Tạo user từ Admin phải luôn thành công thông qua Edge Function thay vì bị chặn bởi RLS hay quota.
- **SC-004**: Xuất danh sách email cho hơn 1.000 học viên hoàn tất ngay tức thì (< 100ms), không chứa email trùng lặp.
- **SC-005**: Số liệu thống kê ở top cards (Tổng doanh thu, Đang chờ duyệt) luôn khớp với dữ liệu toàn bộ hệ thống, không bị ảnh hưởng bởi việc đang đứng ở trang phân trang nào.
