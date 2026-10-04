---
id: "09-ecommerce-checkout"
title: "User Story 9 - Hệ Thống Giỏ Hàng & Checkout VietQR (E-Commerce Checkout)"
status: "IMPLEMENTED"
created_date: "2026-03-05"
---

# 1. Overview
Phân hệ Thanh toán và E-Commerce (`/cart`) cung cấp trải nghiệm mua sắm tài liệu khóa học tự động 3 bước: **Quản lý giỏ hàng** -> **Thanh toán VietQR** -> **Xác nhận đơn hàng**. 

Kiến trúc cốt lõi của tính năng này là **Server-Authoritative Order Creation** (Tạo đơn hàng bảo mật từ phía Server). Toàn bộ quá trình tính giá, kiểm tra mã giảm giá và khởi tạo mã đơn hàng đều được xử lý ngầm trên Edge Function. Điều này ngăn chặn hoàn toàn rủi ro thao túng giá từ phía Client (Inspect Element), đồng thời bắt buộc học viên tải lên ảnh biên lai chuyển khoản thì mới có thể đặt hàng.

---

# 2. User Scenarios

### User Story 1 – Quản lý Giỏ hàng & Áp dụng Mã giảm giá (Priority: P1)
Là một học viên, tôi muốn xem lại các môn học đã chọn và nhập mã khuyến mãi để được giảm giá.

**Acceptance Scenarios**:
1. **Given** học viên truy cập `/cart`, **When** trang tải, **Then** hệ thống tự động đối chiếu `subject_id` trong giỏ hàng với CSDL để hiển thị chính xác tên môn và giá cập nhật mới nhất (đề phòng giá bị đổi khi đang nằm trong giỏ).
2. **Given** học viên có mã giảm giá (VD: `CHAOKYMOI` giảm 20%), **When** nhập mã và nhấn "Áp dụng", **Then** hệ thống kiểm tra logic hợp lệ (hạn dùng, số lượt dùng tối đa, giá trị đơn tối thiểu) và trừ trực tiếp vào tổng tiền tạm tính.
3. **Given** một mã giảm giá hết hạn hoặc đơn hàng không đủ tiền tối thiểu, **When** áp dụng, **Then** hiển thị thông báo lỗi rõ ràng.

### User Story 2 – Chuyển khoản qua mã VietQR thông minh (Priority: P1)
Là một học viên, tôi muốn quét mã QR trên ứng dụng ngân hàng để chuyển tiền nhanh, không cần tự gõ số tài khoản hay nội dung.

**Acceptance Scenarios**:
1. **Given** học viên nhấn "Tiến hành thanh toán", **When** sang bước 2, **Then** yêu cầu nhập Họ tên và Mã sinh viên.
2. **Given** điền đủ thông tin, **When** chuyển sang bước xác nhận, **Then** hệ thống lấy cấu hình tài khoản từ bảng `system_settings` để tự động sinh mã VietQR chuẩn NAPAS.
3. **Then** mã QR nhúng sẵn: Số tài khoản, Ngân hàng, Số tiền, và cú pháp tự động `[Họ tên] + mua tài liệu`. Kèm theo các nút "Copy" để học sinh sao chép số tài khoản nếu không quét được QR.

### User Story 3 – Bắt buộc Upload Bill & Tạo đơn hàng Server-Authoritative (Priority: P0)
Là một quản trị viên, tôi muốn đảm bảo không có đơn hàng ảo nào được tạo ra nếu chưa có ảnh biên lai chuyển khoản.

**Acceptance Scenarios**:
1. **Given** học viên chưa xác thực email, **When** xác nhận đặt hàng, **Then** Edge Function chặn lại và trả về lỗi 403: "Bạn cần xác thực email trước khi đặt hàng".
2. **Given** học viên cố tình không tải ảnh bill lên, **When** nhấn xác nhận đặt hàng, **Then** frontend chặn lại và hiển thị lỗi "Bắt buộc phải có ảnh bill chuyển khoản".
3. **Given** thông tin hợp lệ và bill đã tải lên `bill-images`, **When** gọi tạo đơn, **Then**:
   - Client truyền `subjectIds` và `billImagePath` lên Edge Function `create-order`.
   - Server lấy lại giá gốc các môn học trực tiếp từ Database (Bỏ qua hoàn toàn giá client gửi).
   - Kiểm tra xem user đã sở hữu môn đó chưa (Ngăn mua trùng).
   - Sinh mã đơn hàng ngẫu nhiên (Ví dụ `ORD-241592`).
   - Lưu đơn vào bảng `orders` (trạng thái pending) và gửi email qua webhook `notify-admin-new-order`.
   - Xóa giỏ hàng client và chuyển màn hình báo thành công.

---

## 3. Requirements

### Functional Requirements
- **FR-001 (Cart Persistence)**: Trạng thái giỏ hàng lưu bằng React Context và đồng bộ `localStorage`, tự động mapping từ chuỗi ID sang Object hiển thị đầy đủ (SubjectName, Price).
- **FR-002 (Coupon Logic)**: Hệ thống mã giảm giá hỗ trợ hai loại (`percent` và `fixed`). Có thể kích hoạt/tắt khẩn cấp (`is_active`), giới hạn số lượt (`max_uses`) và hạn chót (`expires_at`).
- **FR-003 (VietQR Generator)**: Tự động ghép nối chuỗi query VietQR từ các Key trong `system_settings` (`bank_name`, `bank_account`, `bank_owner`) và lấy avatar QR thông qua API `img.vietqr.io`.
- **FR-004 (Bill Image Enforcement)**: Upload bill bắt buộc. File ảnh upload lên bucket `bill-images` (giới hạn 10MB, định dạng ảnh). URL phải tồn tại trước khi gọi Edge Function.
- **FR-005 (Server Edge Function `create-order`)**:
  - Không truyền giá trị Total lên server. Server TỰ TÍNH.
  - Sử dụng Deno `crypto.getRandomValues()` để tạo chuỗi `ORD-XXXXXX`.
  - Thực thi bảo mật qua JWT `Authorization` header để lấy định danh User.
- **FR-006 (Admin Notification)**: Gọi tự động hook `notify-admin-new-order` để bắn email thông báo cho Admin ngay khi tạo đơn thành công.

### Key Entities
- **orders**: `id` (Varchar ORD-XXXXXX), `user_id`, `original_amount`, `discount_amount`, `final_amount`, `status` (`pending`|`approved`|`rejected`), `bill_image_url`, `student_code`, `full_name`.
- **order_items**: `id`, `order_id`, `subject_id`, `price`.
- **discount_codes**: `id`, `code`, `discount_type`, `value`, `min_order_value`, `max_uses`, `used_count`, `is_active`.
- **system_settings**: Lưu cấu hình ngân hàng.

### Key Files
- `src/pages/user/CartPage.tsx`: Chứa toàn bộ Stepper UI, form nhập liệu, upload ảnh, tạo QR và call Edge Function.
- `supabase/functions/create-order/index.ts`: Lõi Server-authoritative logic.
- `supabase/functions/notify-admin-new-order/index.ts`: Webhook thông báo.

---

## 4. Success Criteria
- **SC-001**: Cấm hoàn toàn khả năng can thiệp giá (Inspect Element Price đổi thành 0đ) vì Edge Function luôn tính lại giá theo DB.
- **SC-002**: Không thể tạo đơn nếu bỏ trống bill.
- **SC-003**: VietQR quét thành công trên mọi app ngân hàng với nội dung chuyển khoản khớp cấu trúc tên.
- **SC-004**: Đơn hàng tạo xong, mã giảm giá sẽ được tự động `used_count + 1`.
