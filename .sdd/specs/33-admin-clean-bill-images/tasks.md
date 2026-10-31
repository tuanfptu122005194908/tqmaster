# Tasks: Nút Dọn dẹp & Xoá Ảnh Bill Cũ trong Quản trị Đơn hàng (Spec 33)

- [x] **Task 1**: Xây dựng module `src/lib/orderBillCleaner.ts` chứa logic `fetchBillStats` và `cleanBillImages` theo batch với Supabase Storage và Database.
- [x] **Task 2**: Viết unit test cho `src/lib/orderBillCleaner.ts` đảm bảo xử lý batch và không ảnh hưởng đến quyền người dùng.
- [x] **Task 3**: Tích hợp nút "Xoá ảnh bill cũ" và Modal xác nhận vào `src/pages/admin/AdminOrders.tsx`, cập nhật giao diện chi tiết đơn khi `bill_image_url === null`.
- [x] **Task 4**: Chạy kiểm thử `npm test`, kiểm tra build `npm run build`, cập nhật `graphify update .`, commit và đẩy code lên cả 2 repositories (`origin` và `tqmaster`).
