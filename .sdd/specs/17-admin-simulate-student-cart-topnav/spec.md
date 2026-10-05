---
Feature Branch: 17-admin-simulate-student-cart-topnav
Status: Draft
---

# 1. Overview
Sau khi mở khóa tính năng "Thêm vào giỏ" cho Admin ở trang chi tiết khóa học, Admin vẫn không thể thấy được biểu tượng Giỏ hàng trên thanh điều hướng (`TopNav.tsx`) cũng như các tính năng của sinh viên như "Khóa học của bạn", "Liên hệ Admin" do bị chặn hiển thị bởi logic cứng `!isAdmin`.
Để trải nghiệm góc nhìn sinh viên của Admin được trọn vẹn, cần hiển thị lại biểu tượng giỏ hàng và các menu liên quan trên TopNav nếu admin đang ở trang dành cho sinh viên (không phải `/admin/*`).

# 2. User Scenarios & Testing

**Scenario 1: Admin ở trang khóa học (student view)**
- **Given** Admin đang ở trang chủ `/` hoặc `/subjects/:id`.
- **When** Admin nhìn lên thanh điều hướng (TopNav).
- **Then** Admin phải thấy được icon Giỏ hàng (Cart) và menu "Khóa học của bạn", "Liên hệ Admin".

**Scenario 2: Admin ở trang quản trị (Admin Dashboard)**
- **Given** Admin đang ở trang `/admin/dashboard`.
- **When** Admin nhìn lên thanh điều hướng (TopNav).
- **Then** Icon Giỏ hàng và các menu người dùng có thể bị ẩn để đảm bảo tính chuyên nghiệp của giao diện quản trị (tùy chọn hoặc giữ nguyên thiết kế cũ của admin).

# 3. Requirements

- **FR-1**: Chỉnh sửa file `src/components/TopNav.tsx` để điều kiện ẩn các phần tử người dùng không chỉ là `!isAdmin`. Thay vào đó, cho phép Admin nhìn thấy Cart, "Khóa học của bạn", "Liên hệ admin" nếu Admin ĐANG ở các trang user (không bắt đầu bằng `/admin`). Điều kiện gợi ý: `(!isAdmin || !location.pathname.startsWith('/admin'))`.

**Key Entities**:
- Không đổi database.

**Key Files**:
- `src/components/TopNav.tsx`

# 4. Success Criteria
- **SC-1**: Có biểu tượng giỏ hàng ở TopNav dành cho Admin khi lướt trang sinh viên.
- **SC-2**: Click vào giỏ hàng dẫn đến `/cart` hoạt động bình thường.
