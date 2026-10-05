# Plan: Admin Simulate Student View

## Kiến trúc kỹ thuật & Luồng dữ liệu

Thay đổi không can thiệp vào cơ sở dữ liệu hay thay đổi flow tổng thể của hệ thống, chỉ đơn thuần sửa logic Frontend hiển thị UI trên các trang xem dưới góc độ sinh viên (student-facing pages).

1. **`SubjectDetailPage.tsx`**:
   - Hiện tại: `const purchased = isAdmin || (subject ? isPurchased(subject.id) : false);`
   - Sửa thành: `const purchased = subject ? isPurchased(subject.id) : false;`
   - Điều này bắt buộc hàm render sử dụng quyền sở hữu thực sự của người dùng đang đăng nhập (dù là admin) thay vì auto true.

2. **`StudyHubPage.tsx`**:
   - Hiện tại: `if (!isAdmin && !isPurchased('...')) { navigate('/'); }`
   - Sửa thành: `if (!isPurchased('...')) { navigate('/'); }`
   - Admin sẽ cần phải mua (bằng cách cho chính tài khoản mình vào đơn hàng free) để có thể vào test StudyHub.

## Rủi ro kỹ thuật
- Nếu admin đã quen với việc click xem thử khóa học luôn mà không cần mua, thì giờ admin sẽ bị bỡ ngỡ nếu không được báo trước. Giải pháp là admin phải tự đặt 1 đơn hàng (giá 0đ hoặc thanh toán giả) để approve cho chính mình, từ đó sẽ test được flow duyệt đơn.

## Deployment / Next steps
Chỉ cần sửa file FE, chạy `npm test` và update graphify.
