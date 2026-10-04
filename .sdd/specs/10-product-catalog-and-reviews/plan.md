# Kế hoạch triển khai Kỹ thuật: Product Interface Redesign

## 1. Kiến trúc UI & Design System
Dựa trên mã HTML tham khảo, chúng ta sẽ cần ánh xạ các thông số thiết kế vào dự án hiện tại.
1. **Design Tokens**: 
   - Sẽ cần cấu hình lại một chút trong `tailwind.config.js` hoặc file CSS toàn cục để hỗ trợ các mã màu như `surface-container-lowest`, `surface-container-high`, `primary-container`, `on-surface-variant`,... nếu dự án chưa có, hoặc dùng màu tương đương từ Tailwind.
   - Thêm font `Plus Jakarta Sans` và Material Symbols Outlined (nếu chưa có).
2. **Components Approach**:
   - Tách UI phần hiển thị Sản phẩm (Môn học) thành một thẻ (Card) riêng để tái sử dụng.
   - Thiết kế layout 2 cột cho trang chi tiết.

## 2. Các bước triển khai (Implementation Steps)

**Bước 1: Chuẩn bị Môi trường & Design System**
- Kiểm tra và chèn thẻ link lấy font `Plus Jakarta Sans` và `Material Symbols Outlined` vào `index.html`.
- (Tùy chọn) Bổ sung màu sắc vào `tailwind.config.js` (hoặc `.css`) để code UI gọn hơn.

**Bước 2: Tạo Component `SubjectCard.tsx`**
- Tạo một UI mới hoàn toàn cho môn học.
- Tích hợp các badge "Sẵn sàng giao", "Giảm 20%" tĩnh (hoặc tính dựa trên logic giá).
- Bọc thẻ bằng sự kiện `onClick` để chuyển hướng sang trang chi tiết (gọi `openDetail`).
- Nút "Thêm vào giỏ" gọi `addToCart`. Nút "Mua ngay" gọi `addToCart` và navigate thẳng đến `/cart`.

**Bước 3: Tái thiết kế `StudyHubPage.tsx`**
- Cập nhật header/banner của trang theo phong cách "Sản phẩm nổi bật".
- Thay thế hệ thống render cũ bằng vòng lặp render `SubjectCard`.
- Điều chỉnh responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`).

**Bước 4: Tái thiết kế `SubjectDetailPage.tsx`**
- Cấu trúc lại giao diện với `grid-cols-1 lg:grid-cols-12`.
- Cột trái (7 cols): Hiển thị Thumbnail/Hero Image với badge nổi bật, thêm 4 Trust Badges (1 đổi 1, chính chủ...).
- Cột phải (5 cols): Tiêu đề môn học, giá (phong cách highlight), danh sách tags, block mô tả và 2 nút to bản. Nút "Mua ngay" xử lý logic thêm giỏ hàng và redirect thẳng đến `/cart`.
- Phần Reviews: Chèn giao diện Đánh giá 5 sao bằng dữ liệu tĩnh (mock) hoặc logic rating UI cho giống bản thiết kế, vì chưa có bảng DB cho reviews thực. 

**Bước 5: Kiểm tra và dọn dẹp**
- Đảm bảo các logic `isPurchased`, `addToCart` không bị hỏng.
- Kiểm tra tính tương thích trên Mobile.
