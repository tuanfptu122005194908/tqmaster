---
id: "10-product-catalog-and-reviews"
title: "User Story 10 - Giao Diện Danh Mục, Thiết Kế Sản Phẩm & Hệ Thống Đánh Giá (Catalog & Reviews)"
status: "IMPLEMENTED"
created_date: "2026-03-10"
---

# 1. Overview
Phân hệ **Danh Mục Sản Phẩm & Đánh Giá** (Product Catalog & Reviews) tập trung vào việc nâng cấp trải nghiệm thị giác và điều hướng của học viên khi tìm kiếm khóa học. Tính năng này được chia làm 3 trụ cột:
1. **Advanced Product Filter Bar**: Thanh điều hướng đa chiều tại trang chủ, giúp tìm kiếm và lọc khóa học siêu tốc.
2. **IBACUU Design System**: Áp dụng ngôn ngữ thiết kế Glassmorphism, Layout 2 cột hiện đại cho trang Chi tiết môn học (`/subjects/:id`).
3. **Hệ Thống Đánh Giá Kiểm Duyệt (Product Reviews)**: Nền tảng social proof cho phép học viên đã mua hàng để lại review, kèm cơ chế kiểm duyệt (Pending/Approved) khắt khe từ Admin.

---

# 2. User Scenarios

### User Story 1 – Khám phá & Lọc môn học siêu tốc (Priority: P0)
Là một học viên, tôi muốn tìm nhanh các môn học của chuyên ngành mình hoặc các môn học có giá tốt mà không phải lướt qua hàng trăm sản phẩm.

**Acceptance Scenarios**:
1. **Given** học viên ở `/`, **When** nhập mã môn "PRN211" vào ô Search nội bộ của vùng Filter, **Then** danh sách lọc tức thời. Nếu bấm dấu `[X]`, từ khóa bị xóa.
2. **Given** học viên muốn lọc chi tiết, **When** chọn `Chuyên ngành: Kỹ thuật phần mềm (SE)`, `Học kỳ: 3`, `Giá: Dưới 80k`, **Then** hệ thống kết hợp bằng logic AND và hiển thị đúng các khóa thỏa mãn. Kèm theo đó là các Tag Chip hiển thị (ví dụ `[Kỳ 3 ×]`) để tiện hủy lọc.
3. **Given** đang xem lưới Card 3D, **When** học viên bấm đổi sang List View, **Then** danh sách lập tức chuyển thành dạng thẻ ngang gọn gàng.
4. **Given** không tìm thấy kết quả nào, **Then** màn hình hiển thị Empty State "Không tìm thấy khóa học..." kèm nút "Đặt lại toàn bộ bộ lọc".

### User Story 2 – Xem chi tiết sản phẩm chuẩn IBACUU (Priority: P1)
Là học viên đang cân nhắc mua khóa học, tôi muốn một trang chi tiết trình bày đẹp mắt, rõ ràng quyền lợi để dễ ra quyết định.

**Acceptance Scenarios**:
1. **Given** click vào một khóa học, **When** trang tải xong, **Then** bố cục chia 2 phần: Trái là Khối Hình ảnh/Huy hiệu bảo chứng (Cam kết, Chính chủ), Phải là Thông tin giá, Mô tả, Nút Mua ngay / Thêm giỏ hàng (Gọi chung hàm `addToCart`).
2. **Given** cuộn trang, **Then** thanh Cart/Checkout Mini dính (Sticky) bám theo màn hình để học viên luôn có thể thao tác bấm Mua mà không cần cuộn ngược lên đầu.
3. **Given** nút "Mua ngay", **When** bấm vào, **Then** môn học được add vào giỏ và tự động redirect sang `/cart` ngay lập tức.

### User Story 3 – Đọc & Viết Đánh Giá Kiểm Duyệt (Priority: P1)
Là một học viên, tôi muốn đọc đánh giá chân thực và để lại bình luận của chính mình sau khi trải nghiệm.

**Acceptance Scenarios**:
1. **Given** một học viên vãng lai vào xem khóa học, **When** cuộn xuống phần Đánh giá, **Then** chỉ thấy các review đã được Admin duyệt (`status = approved`), nhìn thấy progress bar tỷ lệ điểm số, nhưng KHÔNG thấy form gửi đánh giá (Khóa quyền).
2. **Given** học viên đã mua môn học, **When** điền form Review (5 sao) và bấm "Gửi đánh giá", **Then** hệ thống báo "Đánh giá của bạn đã được ghi nhận và đang chờ duyệt". Data được lưu với `status = pending`.
3. **Given** tài khoản Admin lướt xem trang này, **When** thấy bình luận rác hoặc tiêu cực, **Then** có nút [Xóa] nhỏ hiển thị cạnh bình luận để xóa ngay mà không cần vào Admin Panel.

---

## 3. Requirements

### Functional Requirements
- **FR-001 (Advanced Filter Engine)**: Tích hợp logic tìm kiếm không phân biệt hoa thường, không phân biệt dấu (accent-tolerant). Tự động phân loại tiền tố môn học thành Chuyên ngành (Ví dụ: `PRN` -> SE, `JPD` -> Tiếng Nhật).
- **FR-002 (Grid & List View)**: Hỗ trợ 2 components render khác biệt: `SubjectCard` (3D Glassmorphism) và `CourseListItem` (Compact Row). Trạng thái được lưu tạm trong state.
- **FR-003 (Design System Integration)**: Trang `SubjectDetailPage` áp dụng Design Token IBACUU (Màu gradient `primary`, góc bo `border-radius: 20-24px`, shadow `rgba(0,0,0,0.04)`).
- **FR-004 (Review Gatekeeping)**: 
  - CHỈ học viên có `isPurchased = true` mới render `<ReviewForm>`.
  - Mọi đánh giá mới đẩy lên Database PHẢI mặc định mang `status: pending`.
- **FR-005 (Mock / Seeding Data)**: Hiển thị sẵn các fake reviews (Chăm sóc tốt, Tài liệu chuẩn) cho trạng thái trống để kích cầu.

### Key Entities
- **subjects**: Bảng chính được filter.
- **reviews**: `id`, `user_id`, `subject_id`, `rating`, `content`, `status` (`pending`, `approved`, `rejected`), `helpful_count`, `created_at`.
- (Cập nhật Local State): `purchasedIds`, `cart`.

### Key Files
- `src/components/home/ProductFilterBar.tsx`: Chứa toàn bộ giao diện điều khiển, Dropdown, Search Input, Tag Chips.
- `src/components/home/CourseListItem.tsx`: Thẻ UI dạng danh sách.
- `src/pages/user/SubjectDetailPage.tsx`: Giao diện chi tiết môn học tái cấu trúc.
- `src/components/ProductReviews.tsx`: UI khối đánh giá, form gửi review và logic phân quyền.

---

## 4. Success Criteria
- **SC-001**: Lọc danh sách cực nhanh (< 50ms) ngay trên Client State mà không phải fetch lại API.
- **SC-002**: Người chưa mua môn học tuyệt đối không thể gửi review spam (Nút submit bị vô hiệu hóa hoặc ẩn đi).
- **SC-003**: Giao diện đạt chuẩn Responsive trên Mobile (bộ lọc được gom vào Drawer/Modal Bottom Sheet để tiết kiệm không gian).
- **SC-004**: Không có bất kỳ review rác (`pending`) nào bị lọt ra ngoài màn hình người dùng chung.
