# Feature Specification: Student StudyHub & Course Experience

**Feature Branch**: `[main]`  
**Status**: ✅ Implemented

---

## 1. Overview
Phân hệ Khóa học & Học tập của học viên (bao gồm Trang chủ danh mục `/`, Khóa học của tôi `/my-courses` và Trang chi tiết môn học `/subjects/:id`) cung cấp trải nghiệm khám phá, lựa chọn và tiếp cận lộ trình học tập Đại học FPT theo chuẩn cấu trúc 9 học kỳ.

Hệ thống tích hợp bộ nhớ đệm `sessionStorage` để tải trang tức thời (< 100ms khi quay lại), hiển thị trực quan trạng thái đã mua/chưa mua, liên kết giỏ hàng một chạm và điều hướng vào kho đề thi thực tế theo niên đại.

---

## 2. User Scenarios & Testing

### User Story 1 – Khám phá danh mục môn học theo học kỳ (Priority: P1)
Là một học viên, tôi muốn duyệt các môn học theo từng học kỳ từ Kỳ 1 đến Kỳ 9 để tìm tài liệu đúng với kỳ học hiện tại của mình.

**Acceptance Scenarios**:
1. **Given** học viên đã đăng nhập và đang ở Trang chủ `/`, **When** trang tải, **Then** hệ thống đọc cache session trước để hiển thị ngay môn học, sau đó đối soát ngầm với Supabase để cập nhật dữ liệu mới nhất.
2. **Given** học viên chọn tab "Học kỳ 3", **When** click chọn, **Then** lưới môn học chỉ hiển thị các môn thuộc kỳ 3 (như PRF192, PRO192, MAD101...).
3. **Given** học viên nhập từ khóa vào ô tìm kiếm trên thanh điều hướng (TopNav), **When** gõ từ khóa (ví dụ "CSD"), **Then** danh sách lọc theo tên hoặc mã môn học theo thời gian thực.

### User Story 2 – Quản lý "Khóa học của tôi" (Priority: P1)
Là một học viên đã mua môn học, tôi muốn có khu vực riêng chỉ hiển thị các môn mình đã sở hữu để tiện vào học ngay.

**Acceptance Scenarios**:
1. **Given** học viên truy cập đường dẫn `/my-courses`, **When** trang tải, **Then** hệ thống chỉ hiển thị những môn học mà `user_id` sở hữu trong `user_subjects`.
2. **Given** một môn học đã sở hữu, **When** học viên click "Vào học ngay", **Then** hệ thống điều hướng trực tiếp vào trang chi tiết môn học `/subjects/:id`.

### User Story 3 – Học tập chi tiết & Làm đề thi theo môn (Priority: P1)
Là một học viên, tôi muốn vào xem toàn bộ đề thi và tài liệu lý thuyết của môn học đã mua.

**Acceptance Scenarios**:
1. **Given** học viên tại `/subjects/:id`, **When** môn học đã được thanh toán, **Then** toàn bộ danh sách đề thi (SU, SP, FA) được mở khóa, kèm nút "Bắt đầu làm bài" điều hướng sang `/exams/:id`.
2. **Given** học viên chưa mua môn học (nếu truy cập trực tiếp), **Then** danh sách đề thi hiển thị trạng thái khóa (ổ khóa mờ), kèm thông báo hướng dẫn thêm vào giỏ hàng và thanh toán.
3. **Given** môn học có tài liệu lý thuyết hoặc tài liệu thực hành PE đính kèm, **When** học viên chuyển sang tab "Tài liệu", **Then** các tài liệu PDF/Video/Link xuất hiện để xem hoặc tải về máy.

---

## 3. Requirements

### Functional Requirements
- **FR-001**: Danh mục môn học PHẢI được lưu đệm trong `sessionStorage` với khóa `tqmaster_active_subjects_v1` để tăng tốc độ phản hồi điều hướng.
- **FR-002**: Lọc môn học theo các tiêu chí: Học kỳ (`semester` 1-9 hoặc `all`), Từ khóa tìm kiếm toàn cục (`searchQuery`), và Chế độ Khóa học của tôi (`/my-courses`).
- **FR-003**: Card môn học hiển thị giá bán (`price`), giá gốc gạch ngang (`original_price`), nhãn môn nổi bật (`Star`), số lượng đề thi có trong môn.
- **FR-004**: Trạng thái nút bấm linh hoạt:
  - Nếu đã mua (`isPurchased(id) === true`): Nút "Vào học ngay" màu xanh dương.
  - Nếu đã trong giỏ hàng (`isInCart(id) === true`): Nút "Đã thêm vào giỏ" (icon Check).
  - Nếu chưa mua và chưa trong giỏ: Nút "Thêm vào giỏ" với icon ShoppingCart.
- **FR-005**: Trang chi tiết môn học `/subjects/:id` hiển thị danh sách đề thi sắp xếp theo hàm niên đại `sortExams`, phân biệt rõ đề thi thử (Trial/Free) và đề thi chính thức của khóa học.

### Key Entities
- **subjects**: `id`, `name`, `semester`, `price`, `description`, `thumbnail_url`, `is_active`.
- **user_subjects**: `user_id`, `subject_id`, `created_at`.
- **exams**: `id`, `title`, `duration_min`, `is_active`.
- **exam_subjects**: `exam_id`, `subject_id`.
- **theories**: `id`, `title`, `type`, `category`, `url`.

---

## 4. Success Criteria
- **SC-001**: Thời gian render danh mục từ cache dưới 50ms khi chuyển qua lại các trang.
- **SC-002**: Phân định chính xác 100% quyền truy cập môn học giữa học viên đã thanh toán và chưa thanh toán.
