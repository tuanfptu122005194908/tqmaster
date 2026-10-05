# Tasks: Admin Simulate Student View

- [x] Xin người dùng (user) duyệt `spec.md` (Review Gate).
- [x] Mở file `src/pages/user/SubjectDetailPage.tsx` và xóa bỏ `isAdmin` khỏi biến `purchased` tại dòng ~88.
- [x] Chỉnh sửa biến `purchased = subject ? isPurchased(subject.id) : false;`.
- [x] Xóa `isAdmin` (nếu không cần dùng nữa) ra khỏi mảng destructuring `useApp()` nếu linter cảnh báo unused var.
- [x] Mở file `src/pages/user/StudyHubPage.tsx` và xóa `isAdmin` khỏi logic chặn quyền truy cập. 
- [x] Xóa `isAdmin` khỏi destructuring `useApp()` trong `StudyHubPage.tsx`.
- [x] Chạy lệnh `npm test` để kiểm tra build.
- [x] Cập nhật đồ thị qua lệnh `graphify update .`.
- [x] Đẩy code lên github (origin và tqmaster).
