# Feature Specification: Subject Catalog & Theory Management

**Feature Branch**: `[main]`  
**Status**: ✅ Implemented

---

## 1. Overview
Hệ thống quản trị môn học (`/admin/subjects`) và tài liệu lý thuyết/PE (`/admin/theory`) cho phép Quản trị viên xây dựng lộ trình học tập chuẩn hóa cho sinh viên Đại học FPT từ Kỳ 1 đến Kỳ 9. 

Môn học được gắn liền với giá bán, trạng thái kích hoạt, phân loại học kỳ và thống kê doanh thu thực tế. Tài liệu học tập hỗ trợ nhiều định dạng (tài liệu tải về, hình ảnh, liên kết ngoài, video thực hành PE) và có thể chia sẻ đa môn học (`theory_subjects`).

---

## 2. User Scenarios & Testing

### User Story 1 – Quản trị danh mục môn học (Priority: P1)
Là một Quản trị viên, tôi muốn thêm, sửa, xóa, nhân bản và bật/tắt hiển thị môn học theo từng học kỳ.

**Acceptance Scenarios**:
1. **Given** Quản trị viên ở `/admin/subjects`, **When** nhấn "Thêm môn học", điền tên, học kỳ (1-9), giá tiền (VD: 79.000đ), mô tả và ảnh đại diện, **Then** môn học được lưu vào bảng `subjects` và xuất hiện trên catalog người dùng.
2. **Given** một môn học hiện có, **When** Quản trị viên nhấn nút toggle kích hoạt (`is_active`), **Then** môn học lập tức ẩn/hiện đối với học viên mà không làm mất dữ liệu liên quan.
3. **Given** danh sách môn học, **When** chọn sắp xếp theo "Doanh thu cao nhất", **Then** danh sách tính toán từ `order_items` (đơn `approved`) và sắp xếp giảm dần.

### User Story 2 – Quản trị tài liệu Lý thuyết & Tài liệu thực hành PE (Priority: P1)
Là một Quản trị viên, tôi muốn tải lên giáo trình, tóm tắt công thức hoặc video/link thực hành PE gắn với một hoặc nhiều môn học.

**Acceptance Scenarios**:
1. **Given** Quản trị viên ở `/admin/theory`, **When** nhấn "Thêm tài liệu", chọn phân loại (`theory`: Lý thuyết hoặc `pe`: Thực hành PE / Video), tải file PDF/Word/Video hoặc dán Link Drive/YouTube, **Then** tài liệu được lưu và liên kết với các môn học được chọn trong `theory_subjects`.
2. **Given** tài liệu đã được tải lên, **When** học viên đã mua môn học tương ứng truy cập trang môn học, **Then** tài liệu mở khóa cho phép xem/tải trực tiếp.

### User Story 3 – Tìm kiếm và lọc tài liệu nhanh (Priority: P2)
Là một Quản trị viên, tôi muốn lọc tài liệu theo môn học và loại tài liệu.

**Acceptance Scenarios**:
1. **Given** Quản trị viên chọn lọc theo Môn học cụ thể và tab "Tài liệu PE / Video", **Then** bảng tài liệu chỉ hiển thị các mục tương ứng.

---

## 3. Requirements

### Functional Requirements
- **FR-001**: Quản trị viên có toàn quyền CRUD trên bảng `subjects` (`name`, `semester`, `price`, `description`, `thumbnail_url`, `is_active`, `sort_order`).
- **FR-002**: Hệ thống PHẢI tự động tính toán tổng số lượt bán (`salesCount`) và doanh thu (`revenue`) của từng môn học dựa trên các đơn hàng đã được duyệt (`orders.status = 'approved'`).
- **FR-003**: Cho phép nhân bản nhanh môn học (duplicate) để tiết kiệm thời gian khởi tạo cấu trúc cho kỳ mới.
- **FR-004**: Quản trị tài liệu hỗ trợ 3 loại định dạng (`file`: File tải về/Video, `link`: Đường dẫn ngoài, `image`: Hình ảnh sơ đồ/mindmap) và 2 phân loại (`theory`: Lý thuyết, `pe`: Thực hành PE).
- **FR-005**: Một tài liệu có thể liên kết đồng thời với nhiều môn học thông qua bảng trung gian `theory_subjects`.
- **FR-006**: Tải file lên Supabase Storage bucket `materials` hoặc `theory-files`, hỗ trợ dung lượng tối đa 50MB.

### Key Entities
- **subjects**: `id` (uuid), `name` (text), `semester` (int), `price` (numeric), `description` (text), `thumbnail_url` (text), `is_active` (bool), `sort_order` (int).
- **theories**: `id` (uuid), `title` (text), `description` (text), `type` (`file` | `link` | `image`), `category` (`theory` | `pe`), `url` (text), `file_name` (text), `created_by` (uuid).
- **theory_subjects**: `id` (uuid), `theory_id` (uuid -> theories), `subject_id` (uuid -> subjects).

---

## 4. Success Criteria
- **SC-001**: Lưu và cập nhật thông tin môn học/tài liệu trong < 1 giây.
- **SC-002**: File tài liệu tải lên storage an toàn, URL công khai hoặc ký token hợp lệ.
- **SC-003**: Dữ liệu tài liệu hiển thị đúng phân quyền (chỉ học viên sở hữu môn học mới truy cập được nội dung tài liệu bản quyền).
