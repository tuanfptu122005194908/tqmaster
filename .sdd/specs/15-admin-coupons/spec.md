# Feature Specification: Coupon & Discount Code Administration

**Feature Branch**: `[main]`  
**Status**: ✅ Implemented

---

## 1. Overview
Hệ thống quản lý mã giảm giá (`/admin/coupons`) cung cấp công cụ tạo lập và kiểm soát các chương trình khuyến mãi, kích cầu học viên đăng ký môn học trên nền tảng TQMaster. 

Quản trị viên có thể thiết lập mã giảm giá theo tỷ lệ phần trăm hoặc số tiền cố định, giới hạn thời hạn sử dụng, số lượt dùng tối đa, giá trị đơn hàng tối thiểu và theo dõi số lượt đã sử dụng thực tế.

---

## 2. User Scenarios & Testing

### User Story 1 – Tạo mã giảm giá mới (Priority: P1)
Là một Quản trị viên, tôi muốn tạo mã giảm giá mới với các điều kiện ràng buộc rõ ràng.

**Acceptance Scenarios**:
1. **Given** Quản trị viên tại `/admin/coupons`, **When** click "Thêm mã giảm giá", nhập mã (VD: `CHAOKY2026`), chọn loại giảm giá (`percent`: % hoặc `fixed`: Số tiền VNĐ), giá trị giảm, hạn sử dụng, giá trị đơn tối thiểu và số lượt tối đa, **Then** mã được lưu vào bảng `discount_codes` và sẵn sàng áp dụng tại giỏ hàng.
2. **Given** một mã giảm giá đang hoạt động, **When** học viên nhập mã tại trang `/cart`, **Then** hệ thống giảm trừ đúng theo thiết lập của mã.

### User Story 2 – Quản lý & Theo dõi hiệu quả mã khuyến mãi (Priority: P2)
Là một Quản trị viên, tôi muốn biết mã nào đang được dùng nhiều nhất và nhanh chóng vô hiệu hóa các mã hết hạn.

**Acceptance Scenarios**:
1. **Given** bảng danh sách mã giảm giá, **When** trang tải, **Then** các thẻ thống kê hiển thị: Tổng số mã, Số mã đang chạy (`is_active = true`), Tổng lượt đã dùng (`used_count`) và Tổng số tiền đã chiết khấu.
2. **Given** một mã giảm giá cần tạm dừng khẩn cấp, **When** Quản trị viên bấm nút toggle chuyển sang Tắt, **Then** mã lập tức bị vô hiệu hóa, học sinh nhập vào giỏ hàng sẽ nhận thông báo mã không còn khả dụng.

---

## 3. Requirements

### Functional Requirements
- **FR-001**: Quản trị viên có toàn quyền CRUD trên bảng `discount_codes`.
- **FR-002**: Mã code PHẢI tự động chuyển thành chữ in hoa (`toUpperCase()`) và loại bỏ khoảng trắng thừa.
- **FR-003**: Hỗ trợ 2 hình thức chiết khấu:
  - `percent`: Giảm theo % giá trị đơn hàng (tối đa 100%).
  - `fixed`: Giảm số tiền cụ thể bằng VNĐ.
- **FR-004**: Thiết lập các điều kiện hạn mức tùy chọn:
  - `min_order_value`: Đơn hàng đạt tối thiểu X đồng mới được áp dụng.
  - `expires_at`: Thời điểm hết hiệu lực (ngày giờ).
  - `max_uses`: Giới hạn tổng số lượt sử dụng trên toàn hệ thống.
  - `is_active`: Bật/Tắt hiệu lực tức thời.
- **FR-005**: Tự động tăng trường `used_count` mỗi khi một đơn hàng áp dụng mã được hoàn tất thành công.
- **FR-006**: Cung cấp nút sao chép nhanh (Copy) mã giảm giá vào clipboard.

### Key Entities
- **discount_codes**: `id` (uuid), `code` (text unique), `discount_type` (`percent` | `fixed`), `value` (numeric), `min_order_value` (numeric), `expires_at` (timestamptz), `max_uses` (int), `used_count` (int), `is_active` (bool), `created_at` (timestamptz).

---

## 4. Success Criteria
- **SC-001**: Lưu mã giảm giá mới trong < 500ms.
- **SC-002**: Không bao giờ xảy ra lỗi giảm quá 100% giá trị đơn hàng hoặc chiết khấu âm.
- **SC-003**: Ngay khi tắt mã (`is_active = false`), giỏ hàng học viên từ chối mã đó ngay lập tức.
