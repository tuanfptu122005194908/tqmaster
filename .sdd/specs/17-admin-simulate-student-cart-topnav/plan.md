# Plan: Show TopNav UI for Admin in Student view

## Implementation Details

Trong `src/components/TopNav.tsx`, hiện tại có nhiều đoạn check sử dụng logic `!isAdmin`:
1. Nút "Khóa học của bạn" (line ~96)
2. Nút "Liên hệ Admin" (line ~155)
3. Biểu tượng Cart (line ~227)

Chúng ta sẽ đổi logic từ `!isAdmin` thành `isStudentView` với công thức:
`const isStudentView = !isAdmin || !location.pathname.startsWith('/admin');`

Sau đó thay thế:
- `!isAdmin` bằng `isStudentView` ở các vị trí hiển thị thành phần UI người dùng.
Việc này sẽ đảm bảo khi admin đang ở trang dành cho sinh viên, admin sẽ thấy đầy đủ các nút như 1 sinh viên. Khi admin ở trang quản lý `/admin/dashboard`, các nút này sẽ được ẩn đi.

## Rủi ro
- Không ảnh hưởng đến dữ liệu hay luồng hệ thống.
