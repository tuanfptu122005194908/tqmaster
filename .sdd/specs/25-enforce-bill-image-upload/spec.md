---
status: "approved"
---

# Feature: Bắt buộc tải ảnh bill khi thanh toán

## 1. Overview
Hiện tại hệ thống cho phép tạo đơn hàng ngay cả khi việc upload ảnh bill thất bại (silent failure) và API `create-order` không bắt buộc field này. Tính năng này sẽ khắc phục lỗ hổng đó bằng cách ép buộc ảnh bill phải được tải lên thành công thì mới được phép tạo đơn hàng.

## 2. User Scenarios (Given-When-Then)
- **Given** người dùng ở trang thanh toán (CartPage)
- **When** người dùng bấm "Xác nhận thanh toán"
- **Then** nếu quá trình upload ảnh bill lỗi, hệ thống phải báo lỗi và chặn không gọi API tạo đơn.
- **Given** một request gọi đến Edge Function `create-order`
- **When** request không chứa `billImagePath`
- **Then** API trả về lỗi 400 "Bắt buộc phải có ảnh bill chuyển khoản".

## 3. Functional Requirements
- **FR-01**: Bắt lỗi upload file trong `CartPage.tsx` và dừng luồng thanh toán nếu lỗi.
- **FR-02**: Thêm kiểm tra `billImagePath` trong Edge Function `create-order/index.ts`, từ chối tạo đơn nếu thiếu field này.

## 4. Key Entities / Data Models
- Không thay đổi Data Models.

## 5. Key Files
- `src/pages/user/CartPage.tsx`
- `supabase/functions/create-order/index.ts`

## 6. Success Criteria
- **SC-01**: Người dùng không thể tạo đơn nếu cố ý bỏ qua ảnh bill hoặc quá trình upload ảnh bị lỗi.
- **SC-02**: Đơn hàng mới tạo ra luôn có `bill_image_url`.
