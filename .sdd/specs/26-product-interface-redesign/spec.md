# Feature Specification: Product Interface Redesign (IBACUU Theme)

**Feature Branch**: `[main]`  
**Status**: 📝 Draft (Pending Review)

---

## 1. Overview
Thiết kế lại toàn bộ giao diện của phần hiển thị Sản phẩm (Môn học/Tài liệu) bao gồm Trang danh sách (Sản phẩm nổi bật / Study Hub) và Trang chi tiết sản phẩm. Áp dụng phong cách thiết kế hiện đại (Glassmorphism, Vibrant Colors, Modern Layout) dựa trên IBACUU DIGITAL PREMIUM design system được cung cấp, tập trung hoàn toàn vào trải nghiệm xem và tương tác sản phẩm mà không làm ảnh hưởng đến các logic lõi (như thanh toán VietQR hay quản lý giỏ hàng đã có).

---

## 2. User Scenarios & Testing

### User Story 1 – Xem danh sách Sản phẩm nổi bật (Priority: P1)
Là một học viên, tôi muốn lướt xem các môn học/tài liệu được trình bày bắt mắt, hiện đại với đầy đủ thông tin tóm tắt trên từng thẻ sản phẩm.

**Acceptance Scenarios**:
1. **Given** học viên truy cập vào trang danh sách (StudyHub), **When** trang được tải lên, **Then** danh sách môn học hiển thị dưới dạng Grid Card hiện đại.
2. **Given** học viên nhìn vào một thẻ môn học (Subject Card), **Then** thấy hình ảnh thumbnail có hiệu ứng gradient/blur, nhãn trạng thái (Ví dụ: "Sẵn sàng giao"), giá bán/giá gốc, số sao đánh giá, lượt bán và các tags liên quan.
3. **Given** học viên click vào toàn bộ vùng thẻ (trừ các nút action), **Then** được chuyển hướng trực tiếp đến trang chi tiết sản phẩm. Nếu click "Mua ngay", sản phẩm sẽ được thêm vào giỏ và tự động chuyển hướng đến trang thanh toán.

### User Story 2 – Xem chi tiết một Sản phẩm (Priority: P1)
Là một học viên click vào một môn học, tôi muốn xem chi tiết thông tin với bố cục rõ ràng, chuyên nghiệp để dễ dàng ra quyết định mua.

**Acceptance Scenarios**:
1. **Given** học viên ở trang Chi tiết Môn học, **When** trang tải, **Then** bố cục chia làm 2 cột chính (trên Desktop):
   - Cột trái: Hình ảnh/Thumbnail nổi bật, các huy hiệu bảo chứng (1 đổi 1, chính chủ), và các biến thể/tuỳ chọn.
   - Cột phải: Tiêu đề, Đánh giá, Box hiển thị giá (tiết kiệm x%), mô tả những gì nhận được, và các nút CTA (Thêm vào giỏ, Mua ngay).
2. **Given** học viên cuộn xuống phần Đánh giá, **Then** nhìn thấy thanh tóm tắt điểm số (Progress bars cho 5 sao, 4 sao...) và danh sách nhận xét thực tế (hoặc mock data nếu chưa có DB).

---

## 3. Requirements

### Functional Requirements
- **FR-001**: Cập nhật bộ màu sắc (Design Tokens) trong Tailwind config để phản ánh bảng màu IBACUU (Ví dụ: `primary`, `surface`, `on-surface`, `error`, v.v.).
- **FR-002**: Tạo mới Component `SubjectCard` (hay `ProductCard`) theo thiết kế bo góc, shadow mềm, có tag giảm giá và hiệu ứng hover.
- **FR-003**: Cải tổ `StudyHubPage` (hoặc trang danh sách tương đương) sử dụng hệ thống Card mới, thêm banner hoặc thanh điều hướng filter dạng pills.
- **FR-004**: Tái thiết kế toàn diện `SubjectDetailPage` với layout 2 cột:
  - Khối trưng bày hình ảnh và trust badges.
  - Khối thông tin giá cả, call-to-action (Nút "Thêm vào giỏ" gọi `addToCart`. Nút "Mua ngay" gọi `addToCart` kèm redirect đến trang thanh toán `/cart`).
  - Giao diện khối Reviews (Đánh giá khách hàng).
- **FR-005**: Không làm thay đổi logic lõi hiện tại (thêm giỏ hàng, check trạng thái isPurchased, hệ thống thanh toán VietQR).

### Key Entities
- Giữ nguyên các entities hiện tại: `subjects`, `orders`, `order_items`. (Không thay đổi Database Schema).

### Key Files
- `tailwind.config.js` (Bổ sung colors/fonts nếu cần)
- `src/components/SubjectCard.tsx` (File tạo mới hoặc ghi đè)
- `src/pages/user/StudyHubPage.tsx` (Chỉnh sửa grid và UI)
- `src/pages/user/SubjectDetailPage.tsx` (Tái thiết kế UI, giữ logic)

---

## 4. Success Criteria
- **SC-001**: Giao diện mới phải hiển thị chính xác phong cách IBACUU (Màu sắc, Font, Spacing, Icon Material Symbols).
- **SC-002**: Đảm bảo Responsive chuẩn trên cả Mobile, Tablet và Desktop.
- **SC-003**: Nút "Thêm vào giỏ" thực hiện `addToCart`. Nút "Mua ngay" gọi `addToCart` đồng thời chuyển hướng ngay sang trang thanh toán (`/cart`). Click vào thân thẻ sản phẩm sẽ dẫn đến trang chi tiết.
- **SC-004**: Không có lỗi phát sinh làm hỏng trang giỏ hàng (`/cart`) hoặc luồng checkout.
