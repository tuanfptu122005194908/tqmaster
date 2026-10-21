# Spec 25: Tự động Cấp quyền khi Tạo Đơn và Khôi phục Quyền Môn học (Auto Grant & Repair Subject Access)

Feature Branch: `feat/auto-grant-and-repair-subject-access`  
Status: Implemented (User Approved)  
Date: 2026-10-22 (Asia/Saigon)  

---

## 1. Overview (Tổng quan)

Nhiều học viên có đơn hàng đã duyệt (`status = 'approved'`) nhưng bị mất quyền truy cập môn học, và trong trang quản trị người dùng hiển thị không có môn nào. 
Nguyên nhân gốc rễ đã được xác định ở tầng Database:
1. Trigger `handle_order_subject_access()` hiện tại chỉ lắng nghe sự kiện `AFTER UPDATE ON public.orders`. Khi có đơn hàng được tạo hoặc nhập sẵn ở trạng thái `approved` (ví dụ: import dữ liệu, chuyển database, hoặc insert trực tiếp), trigger hoàn toàn không kích hoạt -> `user_subjects` bị thiếu bản ghi.
2. Chưa có cơ chế tự động bù quyền (reconcile / backfill) cho các đơn hàng `approved` hợp lệ còn tồn tại nhưng bị thiếu trong bảng `user_subjects`.
3. Admin chưa có công cụ 1-click trực quan trên giao diện để tự kiểm tra đối soát và đồng bộ lại quyền từ các đơn hàng đã duyệt mà không cần phải mở Supabase SQL Editor.

Tính năng này cung cấp:
- **Migration SQL**: 
  1. Cập nhật trigger `handle_order_subject_access()` hỗ trợ cả `AFTER INSERT OR UPDATE` trên bảng `public.orders`.
  2. Câu lệnh tự động nạp bù (backfill) toàn bộ quyền môn học cho các đơn hàng `approved` hợp lệ hiện có.
  3. RPC `repair_subject_access_by_admin()` an toàn, chỉ dành cho Admin để đối soát và đồng bộ quyền bất kỳ lúc nào.
- **Admin UI Enhancement**:
  - Bổ sung nút **"Đồng bộ quyền từ đơn hàng"** trên trang Quản lý Người dùng (`AdminUsers.tsx`) với modal đối soát xác nhận trước khi thực hiện.
  - Tuyệt đối bảo toàn: Không bao giờ cấp quyền cho các đơn hàng đã bị xóa hoặc đơn bị từ chối/hủy (`rejected`).

---

## 2. User Scenarios & Testing (Kịch bản Người dùng Given-When-Then)

### US-001: Tự động cấp quyền khi đơn hàng được tạo sẵn trạng thái Approved
- **Given** một đơn hàng mới được tạo hoặc nạp vào hệ thống với `status = 'approved'` và kèm các `order_items`,
- **When** bản ghi đơn hàng được insert vào bảng `orders`,
- **Then** trigger tự động thêm các môn học tương ứng vào `user_subjects` với `granted_by = 'order'`, học viên có ngay quyền truy cập không cần thao tác cập nhật phụ.

### US-002: Khôi phục quyền cho các đơn hàng Approved hợp lệ đang bị thiếu
- **Given** học viên A có đơn hàng `ORD-XXXX` trạng thái `approved` còn tồn tại trong hệ thống, nhưng vì sự cố trước đó mà trong `user_subjects` không có môn học của đơn này,
- **When** hệ thống chạy migration hoặc admin bấm nút "Đồng bộ quyền từ đơn hàng",
- **Then** học viên A được cấp bù chính xác các môn thuộc đơn `approved` đó, trang người dùng hiển thị đúng số môn và học viên vào học bình thường.

### US-003: Tuyệt đối không khôi phục quyền cho đơn hàng đã xóa hoặc bị từ chối
- **Given** đơn hàng B đã bị xóa khỏi hệ thống (không còn trong `orders`), hoặc đơn hàng C có trạng thái `rejected` / `pending`,
- **When** chạy đồng bộ hoặc chạy migration,
- **Then** không có quyền nào được cấp cho đơn B hoặc C; chỉ những đơn đang tồn tại và có `status = 'approved'` mới được xử lý.

### US-004: Admin đối soát và đồng bộ quyền an toàn từ giao diện
- **Given** admin đang ở trang `AdminUsers.tsx`,
- **When** admin bấm nút "Đồng bộ quyền từ đơn hàng",
- **Then** hệ thống gọi RPC bảo mật (chỉ admin mới có quyền gọi), thông báo số lượng học viên và môn học được cấp bù thành công, và tự động làm mới lại danh sách người dùng.

---

## 3. Requirements (Yêu cầu kỹ thuật & Nghiệp vụ)

### Functional Requirements
- **FR-001**: Nâng cấp trigger `handle_order_subject_access()` trên bảng `public.orders` để kích hoạt trên cả `AFTER INSERT OR UPDATE`. Nếu là `INSERT` và `NEW.status = 'approved'`, tự động thêm quyền vào `public.user_subjects`.
- **FR-002**: Tạo RPC PostgreSQL `public.repair_subject_access_by_admin()` với quyền `SECURITY DEFINER`, chỉ cho phép tài khoản có role `admin` thực thi. RPC trả về số lượng bản ghi quyền vừa được cấp bù và số học viên được khôi phục.
- **FR-003**: Migration tự động chạy backfill cấp bù quyền một lần ngay khi áp dụng cho tất cả đơn hàng `approved` hiện tại.
- **FR-004**: Đảm bảo sử dụng `ON CONFLICT (user_id, subject_id) DO NOTHING` để không bao giờ gây lỗi trùng lặp dữ liệu hoặc ghi đè quyền `granted_by = 'admin'` thủ công.
- **FR-005**: Trên giao diện `AdminUsers.tsx`, thêm nút "Đồng bộ quyền đơn hàng" tuân thủ thiết kế TQMaster Dashboard (icon `RefreshCw`, màu sắc trang nhã, có xác nhận trước khi chạy và toast thông báo kết quả).
- **FR-006**: Bổ sung bộ kiểm thử tự động (Unit Test / Integration Test) xác nhận logic gọi RPC và cập nhật state khi đồng bộ quyền.

### Key Entities
- `public.orders`: `id`, `user_id`, `status` (`approved`, `pending`, `rejected`).
- `public.order_items`: `id`, `order_id`, `subject_id`, `price`.
- `public.user_subjects`: `id`, `user_id`, `subject_id`, `granted_by`, `granted_at`.
- `public.user_roles`: phân quyền `admin` / `user`.

### Key Files
- `supabase/migrations/20261022020000_auto_grant_and_repair_subject_access.sql`: File migration chứa trigger `AFTER INSERT OR UPDATE`, RPC `repair_subject_access_by_admin` và lệnh backfill dữ liệu.
- `src/pages/admin/AdminUsers.tsx`: Thêm nút đồng bộ quyền và gọi RPC xử lý.
- `src/pages/admin/__tests__/AdminUsers.test.tsx`: Bổ sung kiểm thử cho hành động đồng bộ quyền.

---

## 4. Success Criteria (Tiêu chí Nghiệm thu)

- **SC-001**: 100% học viên có đơn hàng `approved` còn tồn tại trong hệ thống được khôi phục quyền đầy đủ trong bảng `user_subjects`.
- **SC-002**: Đơn hàng bị xóa hoặc mang trạng thái `rejected` / `pending` không bao giờ bị cấp quyền.
- **SC-003**: Thử nghiệm chèn đơn hàng mới với `status = 'approved'` (hoặc duyệt đơn) thì `user_subjects` tự động có dữ liệu ngay lập tức.
- **SC-004**: Admin có thể bấm nút đồng bộ trên giao diện web bất kỳ lúc nào để tự kiểm tra và làm mới quyền học viên.
- **SC-005**: Bộ kiểm thử `npm test` vượt qua 100%, không phát sinh hồi quy, Graphify được cập nhật và code được push đồng thời lên cả 2 remote (`origin` và `tqmaster`).
