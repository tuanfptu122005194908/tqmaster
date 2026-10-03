---
title: Fix White Screen Error (Trắng trang)
status: draft
---

# 1. Overview
Gần đây hệ thống ghi nhận tình trạng người dùng đôi khi gặp lỗi "trang trắng tinh" (White screen of death) khi tiến hành thanh toán hoặc truy cập vào một số trang nhất định. Nguyên nhân gốc là do các lỗi runtime trong quá trình render (ví dụ: null pointer, truy cập property của undefined) không được bắt (catch) bởi React Error Boundary, dẫn đến toàn bộ ứng dụng bị unmount.

# 2. User Scenarios
- **Given** người dùng đang ở trang thanh toán (Cart) hoặc một trang bất kỳ.
- **When** một component nội bộ gặp lỗi Javascript trong quá trình render (ví dụ data trả về bị thiếu một field bắt buộc).
- **Then** ứng dụng KHÔNG bị unmount hoàn toàn để hiện trang trắng, mà sẽ hiển thị một Fallback UI thông báo "Đã xảy ra lỗi hệ thống", kèm nút "Tải lại trang" và "Về trang chủ".

# 3. Functional Requirements
- **FR-1**: Tạo component `GlobalErrorBoundary` kế thừa từ `React.Component` để bắt lỗi rendering.
- **FR-2**: Thiết kế Fallback UI cho Error Boundary đồng bộ với TQMaster Dashboard Theme, thân thiện với người dùng.
- **FR-3**: Bọc toàn bộ các route hoặc `AppShell` trong `App.tsx` bằng `GlobalErrorBoundary`.

# 4. Success Criteria
- **SC-1**: Cố tình quăng lỗi (throw error) trong một trang bất kỳ, hệ thống sẽ hiện Fallback UI thay vì trang trắng.
- **SC-2**: Các trang hiện tại (CartPage, HomePage...) vẫn hoạt động bình thường, ErrorBoundary chỉ kích hoạt khi có lỗi xảy ra.

# 5. Key Files
- `src/components/GlobalErrorBoundary.tsx` (Tạo mới)
- `src/App.tsx` (Chỉnh sửa để tích hợp ErrorBoundary)
