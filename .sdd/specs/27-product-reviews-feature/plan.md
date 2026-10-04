# Kế hoạch Kỹ thuật: Product Reviews (Đánh giá Sản phẩm)

## 1. Data Model (DB)
- Sẽ cần cập nhật Supabase Database trong tương lai (tạo bảng `reviews` có cột `status` kiểu enum). 
- Trong giai đoạn này (front-end mockup): Fake dữ liệu ngay trong file React để đảm bảo giao diện lên hình ngay lập tức (chứa 4 review 5 sao như bản tham khảo).
- Bắt buộc các object trong mảng fake data phải có trường `status: 'approved'` hoặc `status: 'pending'`, khi render sẽ dùng `Array.filter(r => r.status === 'approved')`.

## 2. Component Structure
- `SubjectDetailPage.tsx` (hoặc tạo component con `ReviewSection.tsx` tuỳ độ dài code):
  - **Summary & Scoreboard**: Khối điểm trung bình bên trái, các thanh tiến trình 5, 4, 3, 2, 1 sao bên phải.
  - **Review Toolbar**: Nút lọc (Tất cả, 5 sao, Đã mua, v.v.), Nút sắp xếp.
  - **Review Stream**: Render danh sách review. Các review sẽ gồm tên người dùng, huy hiệu (IBACUU biên soạn / Đã mua hàng), nội dung, số sao, hình ảnh (nếu có) và cả khối admin reply (nesting div).
  - **Review Sidebar (Sticky)**: Nằm trong cột phải hoặc khối dưới, khối "Chia sẻ trải nghiệm" gồm 5 sao có thể hover, nút "Viết đánh giá ngay".

## 3. Workflow
1. Bổ sung `status` logic và fake data vào component hiển thị trang chi tiết.
2. Dịch HTML mẫu được cấp thành mã React/Tailwind kết hợp các token của IBACUU như `bg-iba-surface-container-lowest`, `text-iba-primary`, v.v.
3. Liên kết luồng hiển thị (bấm tab "Đánh giá & Phản hồi" thì sẽ cuộn xuống / hiển thị khối Review).
4. Phê duyệt SDD trước khi code (Bước hiện tại).
