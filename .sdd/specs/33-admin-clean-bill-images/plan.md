# Implementation Plan: Nút Dọn dẹp & Xoá Ảnh Bill Cũ trong Quản trị Đơn hàng (Spec 33)

## 1. Kiến trúc Giải pháp

1. **Module Xử lý Dọn dẹp Ảnh Bill (`src/lib/orderBillCleaner.ts`)**:
   - `fetchBillStats()`: Lấy số lượng đơn hàng có ảnh bill phân loại theo trạng thái (`approved`, `rejected`, `pending`).
   - `cleanBillImages({ scope: 'processed_only' | 'all' })`:
     - Truy vấn các đơn hàng có `bill_image_url IS NOT NULL` theo phạm vi đã chọn (`scope = 'processed_only'` thì lọc `status != 'pending'`).
     - Chia nhỏ danh sách đường dẫn thành từng batch (50-100 files) để gọi `supabase.storage.from('bill-images').remove(paths)`.
     - Cập nhật các đơn hàng đó: `supabase.from('orders').update({ bill_image_url: null }).in('id', orderIds)`.
     - Trả về số lượng ảnh đã xoá thành công.

2. **Giao diện trong `src/pages/admin/AdminOrders.tsx`**:
   - Thêm nút **"Xoá ảnh bill cũ"** vào khu vực Action Toolbar (cạnh nút Export Excel).
   - Component Modal xác nhận:
     - Thống kê số lượng đơn có ảnh bill.
     - Radio buttons cho phép chọn:
       - 🔘 Chỉ xoá đơn đã duyệt / đã huỷ (Khuyên dùng - bảo vệ đơn đang chờ duyệt).
       - 🔘 Xoá sạch toàn bộ tất cả ảnh bill từ trước đến nay.
     - Nút "Xác nhận xoá" có trạng thái loading và toast thông báo kết quả.
   - Khi xem chi tiết một đơn đã được dọn ảnh bill (`bill_image_url === null`):
     - Hiển thị badge: `"Ảnh bill đã được dọn dẹp để tiết kiệm dung lượng"` thay vì cố gắng tải ảnh lỗi.

3. **Kiểm thử tự động (`src/lib/__tests__/orderBillCleaner.test.ts`)**:
   - Test việc gọi xoá file Storage đúng đường dẫn.
   - Test việc cập nhật `bill_image_url = null` đúng đơn hàng mà không đụng chạm đến quyền môn học hay trạng thái `status`.

