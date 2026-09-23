# Feature Specification: Student Cart, Checkout & VietQR Payment

**Feature Branch**: `[main]`  
**Status**: ✅ Implemented (Optimized v2.1)

---

## 1. Overview
Hệ thống thanh toán và giỏ hàng của học viên (`/cart`) cung cấp quy trình mua tài liệu ôn thi tự động hóa 3 bước: Quản lý giỏ hàng (`cart`), Thanh toán & Chuyển khoản VietQR (`checkout`), và Xác nhận đơn hàng (`confirm`).

Hệ thống hoạt động theo mô hình **Server-Authoritative Order Creation**: toàn bộ việc kiểm tra giá môn học, thẩm định mã giảm giá, kiểm tra xác thực email và sinh mã đơn hàng đều được thực thi trên Edge Function bảo mật (`create-order`). Đồng thời tích hợp cấu hình tài khoản ngân hàng động từ `system_settings`, tạo mã VietQR tự động theo chuẩn NAPAS và gửi thông báo đơn hàng mới tức thì cho Quản trị viên qua Edge Function `notify-admin-new-order`.

---

## 2. User Scenarios & Testing

### User Story 1 – Quản lý giỏ hàng & Áp dụng mã giảm giá (Priority: P1)
Là một học viên, tôi muốn xem lại các môn học đã chọn, xóa môn không cần thiết và nhập mã khuyến mãi.

**Acceptance Scenarios**:
1. **Given** học viên đã thêm môn học vào giỏ và truy cập `/cart`, **When** trang tải, **Then** danh sách môn học hiển thị chi tiết (Tên môn, Học kỳ, Giá tiền).
2. **Given** học viên có mã giảm giá (VD: `CHAOKYMOI` giảm 20%), **When** nhập mã và nhấn "Áp dụng", **Then** hệ thống kiểm tra tính hợp lệ trong `discount_codes` (hạn dùng, số lượt dùng tối đa, giá trị đơn tối thiểu) và trừ trực tiếp vào tổng tiền thanh toán hiển thị tạm tính.
3. **Given** mã giảm giá hết hạn hoặc không đủ điều kiện đơn tối thiểu, **Then** thông báo lỗi màu đỏ xuất hiện giải thích rõ ràng.

### User Story 2 – Chuyển khoản qua mã VietQR thông minh (Priority: P1)
Là một học viên chuyển sang bước thanh toán, tôi muốn quét mã QR trên ứng dụng ngân hàng để chuyển khoản nhanh mà không sợ gõ sai số tài khoản hoặc nội dung.

**Acceptance Scenarios**:
1. **Given** học viên nhấn "Tiến hành thanh toán", **When** sang bước 2 (`checkout`), **Then** hệ thống lấy thông tin tài khoản từ `system_settings` và sinh mã VietQR chuẩn NAPAS chứa sẵn: Số tài khoản, Ngân hàng, Số tiền chính xác (đã trừ khuyến mãi) và Cú pháp nội dung chuyển khoản: `TQMASTER [Mã_Đơn_Hàng]`.
2. **Given** học viên chuyển khoản bằng web/app ngân hàng khác máy, **When** click nút "Copy" cạnh Số tài khoản hoặc Nội dung, **Then** văn bản được sao chép vào clipboard và icon hiển thị trạng thái "Đã chép".

### User Story 3 – Tải lên ảnh Bill & Tạo đơn hàng Server-Authoritative (Priority: P1)
Là một học viên đã chuyển khoản thành công, tôi muốn gửi ảnh biên lai để hệ thống tạo đơn hàng bảo mật và gửi thông báo tới admin phê duyệt.

**Acceptance Scenarios**:
1. **Given** học viên đã chụp màn hình giao dịch, **When** chọn file ảnh biên lai, **Then** ảnh hiển thị xem trước trực tiếp trên giao diện và được tải lên Supabase Storage bucket `order-bills`.
2. **Given** học viên chưa xác thực email, **When** nhấn xác nhận đặt hàng, **Then** Edge Function trả về lỗi 403: *"Bạn cần xác thực email trước khi đặt hàng"*.
3. **Given** email đã xác thực và thông tin hợp lệ, **When** học viên click "Tôi đã chuyển khoản & Xác nhận đơn", **Then**:
   - Client gọi Edge Function `create-order`.
   - Server tính toán lại toàn bộ giá gốc và mã giảm giá trực tiếp từ database (loại bỏ hoàn toàn rủi ro can thiệp giá từ client).
   - Server sinh mã đơn ngẫu nhiên chuẩn bảo mật `ORD-XXXXXX`.
   - Đơn hàng được lưu vào `orders` (`status = 'pending'`) và `order_items`.
   - Edge Function tự động kích hoạt `notify-admin-new-order` gửi email thông báo qua Resend API.
   - Giỏ hàng phía client tự động làm trống và chuyển sang màn hình 3 (`confirm`).

---

## 3. Requirements

### Functional Requirements
- **FR-001**: Giỏ hàng lưu trữ liên tục qua React Context và đồng bộ vào `localStorage`.
- **FR-002**: Tự động đối soát và khôi phục thông tin môn học nếu giỏ hàng chỉ lưu danh sách `subject_id` dạng chuỗi.
- **FR-003**: Áp dụng mã giảm giá:
  - Hỗ trợ loại chiết khấu phần trăm (`percent`) hoặc số tiền cố định (`fixed`).
  - Kiểm tra điều kiện `is_active = true`, ngày hết hạn `expires_at > now()`, số lượt dùng `used_count < max_uses`, và giá trị đơn tối thiểu `min_order_value`.
- **FR-004**: Lấy cấu hình tài khoản ngân hàng động từ bảng `system_settings` (`bank_name`, `bank_account`, `bank_owner`, `bank_content`, `bank_qr_url`).
- **FR-005**: Tải ảnh biên lai lên bucket `order-bills` với định dạng jpg/png/webp, kích thước tối đa 10MB.
- **FR-006 (Server-Authoritative Order Creation)**:
  - Tạo đơn hàng bắt buộc thông qua Edge Function `create-order` (Deno).
  - Xác thực token người dùng qua JWT. Kiểm tra cờ `email_confirmed_at`.
  - Giá từng môn học lấy trực tiếp từ bảng `subjects` phía server, không nhận giá gửi từ client.
  - Sinh mã đơn hàng ngẫu nhiên `ORD-XXXXXX` (với 6 chữ số) sử dụng `crypto.getRandomValues()`.
- **FR-007 (Admin Notification Service)**: Sau khi tạo đơn, Edge Function gọi microservice `notify-admin-new-order` để gửi email báo cáo đơn hàng mới cho quản trị viên qua cổng Resend API / Lovable Connector Gateway.

### Key Entities
- **orders**: `id` (chuỗi dạng `ORD-XXXXXX`), `user_id`, `original_amount`, `discount_amount`, `final_amount`, `discount_code`, `status` (`'pending'`), `bill_image_url`, `student_code`, `full_name`, `email`, `created_at`.
- **order_items**: `id`, `order_id`, `subject_id`, `price`.
- **discount_codes**: `id`, `code`, `discount_type`, `value`, `min_order_value`, `max_uses`, `used_count`, `expires_at`, `is_active`.
- **system_settings**: `key`, `value`.

### Key Files
- `src/pages/user/CartPage.tsx` — Giao diện 3 bước: Giỏ hàng, Chuyển khoản VietQR, Xác nhận đơn hàng
- `supabase/functions/create-order/index.ts` — Edge function thẩm định giá, mã giảm giá và tạo đơn hàng an toàn
- `supabase/functions/notify-admin-new-order/index.ts` — Edge function gửi email thông báo đơn mới cho ban quản trị
- `src/lib/AppContext.tsx` — Quản lý trạng thái giỏ hàng (`cart`, `addToCart`, `removeFromCart`, `clearCart`)

---

## 4. Success Criteria
- **SC-001**: Toàn bộ quá trình tạo đơn server-authoritative và upload ảnh hoàn thành trong < 2 giây.
- **SC-002**: Chặn đứng 100% các hành vi sửa giá từ devtools phía client.
- **SC-003**: Email thông báo đơn hàng gửi tới Admin trong vòng < 5 giây sau khi học viên xác nhận chuyển khoản.
- **SC-004**: VietQR quét chính xác 100% thông tin tài khoản và cú pháp chuyển khoản trên các ứng dụng Mobile Banking tại Việt Nam.
