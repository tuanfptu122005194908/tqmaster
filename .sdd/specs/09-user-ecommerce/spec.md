# Feature Specification: Student Cart, Checkout & VietQR Payment

**Feature Branch**: `[main]`  
**Status**: ✅ Implemented

---

## 1. Overview
Hệ thống thanh toán và giỏ hàng của học viên (`/cart`) cung cấp quy trình mua tài liệu ôn thi tự động hóa 3 bước: Quản lý giỏ hàng (`cart`), Thanh toán & Chuyển khoản VietQR (`checkout`), và Xác nhận đơn hàng (`confirm`).

Hệ thống tích hợp mã giảm giá thông minh (`discount_codes`), cấu hình tài khoản ngân hàng động từ `system_settings`, tạo mã VietQR tự động điền sẵn số tiền và cú pháp chuyển khoản, cùng chức năng tải lên ảnh biên lai chuyển khoản (Bill Proof) để Admin đối soát.

---

## 2. User Scenarios & Testing

### User Story 1 – Quản lý giỏ hàng & Áp dụng mã giảm giá (Priority: P1)
Là một học viên, tôi muốn xem lại các môn học đã chọn, xóa môn không cần thiết và nhập mã khuyến mãi.

**Acceptance Scenarios**:
1. **Given** học viên đã thêm môn học vào giỏ và truy cập `/cart`, **When** trang tải, **Then** danh sách môn học hiển thị chi tiết (Tên môn, Học kỳ, Giá tiền).
2. **Given** học viên có mã giảm giá (VD: `CHAOKYMOI` giảm 20%), **When** nhập mã và nhấn "Áp dụng", **Then** hệ thống kiểm tra tính hợp lệ trong `discount_codes` (hạn dùng, số lượt dùng tối đa, giá trị đơn tối thiểu) và trừ trực tiếp vào tổng tiền thanh toán.
3. **Given** mã giảm giá hết hạn hoặc không đủ điều kiện đơn tối thiểu, **Then** thông báo lỗi màu đỏ xuất hiện giải thích rõ ràng.

### User Story 2 – Chuyển khoản qua mã VietQR thông minh (Priority: P1)
Là một học viên chuyển sang bước thanh toán, tôi muốn quét mã QR trên ứng dụng ngân hàng để chuyển khoản nhanh mà không sợ gõ sai số tài khoản hoặc nội dung.

**Acceptance Scenarios**:
1. **Given** học viên nhấn "Tiến hành thanh toán", **When** sang bước 2 (`checkout`), **Then** hệ thống lấy thông tin tài khoản từ `system_settings` và sinh mã VietQR chuẩn NAPAS chứa sẵn: Số tài khoản, Ngân hàng, Số tiền chính xác (đã trừ khuyến mãi) và Cú pháp nội dung chuyển khoản: `TQMASTER [Mã_Đơn_Hàng]`.
2. **Given** học viên chuyển khoản bằng web/app ngân hàng khác máy, **When** click nút "Copy" cạnh Số tài khoản hoặc Nội dung, **Then** văn bản được sao chép vào clipboard và icon hiển thị trạng thái "Đã chép".

### User Story 3 – Tải lên ảnh chụp màn hình Bill giao dịch (Priority: P1)
Là một học viên đã chuyển khoản thành công, tôi muốn gửi ảnh biên lai để admin phê duyệt kích hoạt tài khoản.

**Acceptance Scenarios**:
1. **Given** học viên đã thực hiện giao dịch, **When** click chọn ảnh chụp màn hình chuyển khoản thành công, **Then** ảnh hiển thị xem trước trực tiếp trên giao diện.
2. **When** học viên click "Tôi đã chuyển khoản & Xác nhận đơn", **Then**:
   - Ảnh bill được tải lên Supabase Storage bucket `order-bills`.
   - Bản ghi đơn hàng mới được tạo trong `orders` với trạng thái `status = 'pending'` và danh sách môn học trong `order_items`.
   - Giỏ hàng tự động được làm trống.
   - Giao diện chuyển sang màn hình 3 (`confirm`) thông báo đơn đang được xử lý.

---

## 3. Requirements

### Functional Requirements
- **FR-001**: Giỏ hàng lưu trữ liên tục qua React Context và đồng bộ vào `localStorage`.
- **FR-002**: Tự động đối soát và khôi phục thông tin môn học nếu giỏ hàng chỉ lưu danh sách `subject_id` dạng chuỗi.
- **FR-003**: Áp dụng mã giảm giá:
  - Hỗ trợ loại chiết khấu phần trăm (`percent`) hoặc số tiền cố định (`fixed`).
  - Kiểm tra điều kiện `is_active = true`, ngày hết hạn `expires_at > now()`, số lượt dùng `used_count < max_uses`, và giá trị đơn tối thiểu `min_order_value`.
- **FR-004**: Lấy cấu hình tài khoản ngân hàng từ bảng `system_settings` (`bank_name`, `bank_account`, `bank_owner`, `bank_content`, `bank_qr_url`).
- **FR-005**: Tải ảnh biên lai lên bucket `order-bills` với định dạng jpg/png/webp, kích thước tối đa 10MB.
- **FR-006**: Ghi nhận đơn hàng với quan hệ 1-N: Bảng `orders` (`user_id`, `original_amount`, `discount_amount`, `final_amount`, `discount_code`, `status = 'pending'`, `bill_image_url`, `student_code`) và bảng `order_items` (`order_id`, `subject_id`, `price`).

### Key Entities
- **orders**: `id`, `user_id`, `original_amount`, `discount_amount`, `final_amount`, `discount_code`, `status`, `bill_image_url`, `student_code`, `full_name`, `email`, `created_at`.
- **order_items**: `id`, `order_id`, `subject_id`, `price`.
- **discount_codes**: `id`, `code`, `discount_type`, `value`, `min_order_value`, `max_uses`, `used_count`, `expires_at`, `is_active`.
- **system_settings**: `key`, `value`.

---

## 4. Success Criteria
- **SC-001**: Toàn bộ quá trình tạo đơn và upload ảnh hoàn thành trong < 2 giây.
- **SC-002**: Số tiền trừ khuyến mãi tính toán chính xác 100%, không cho phép tổng tiền âm.
- **SC-003**: Học sinh nhận được mã đơn và hướng dẫn rõ ràng ngay sau khi gửi biên lai.
