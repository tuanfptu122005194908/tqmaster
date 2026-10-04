# Kế hoạch Kỹ thuật: Product Reviews (Đánh giá Sản phẩm)

## 1. Data Model (DB)
- Hiện tại dùng Fake dữ liệu (localStorage) thông qua `reviewsStore.ts`. Đã chuẩn bị sẵn file `26_reviews.sql` để migrate trong tương lai.
- Thêm fake data: các review 5 sao khen sản phẩm.
- Khi user gửi bài, lấy `profile.full_name` từ Context (useApp) làm tên.

## 2. Component Structure & Logic Updates
- **ProductReviews.tsx**:
  - `Facebook Link`: Sửa link nút "Hỗ trợ đơn hàng" thành link Facebook thay vì Zalo.
  - `Quyền Review`: Nếu `purchased = false`, thì ẩn hẳn khối "Viết đánh giá". 
  - `Xoá Review từ Admin`: Lấy biến `isAdmin` từ `useApp()`, nếu là true, hiển thị thêm nút "Xóa" cạnh mỗi review trên giao diện user.
  - Lấy `profile` từ `useApp()` để gán tên user (và avatar) khi submit review.

- **AdminReviews.tsx**:
  - Ẩn bài: Chỉ render những review có trạng thái là `pending` hoặc `rejected`. Đánh giá `approved` sẽ KHÔNG hiển thị ở trang Admin nữa.

## 3. Workflow
1. Bổ sung các mock review 5 sao khen ngợi.
2. Cập nhật giao diện `AdminReviews.tsx` (Lọc ẩn `approved`).
3. Sửa `ProductReviews.tsx` (Lọc quyền mua, link FB, Xóa by Admin, Tên thực tế).
4. Xác nhận spec & code & đẩy lên 2 remote.
