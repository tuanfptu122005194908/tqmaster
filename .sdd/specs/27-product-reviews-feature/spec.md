# Feature Specification: Product Reviews (Đánh giá Sản phẩm)

## 1. Overview
Thiết kế và bổ sung phân hệ "Đánh giá & Phản hồi" cho trang chi tiết sản phẩm (`SubjectDetailPage`). 
Người dùng có thể xem các đánh giá từ những người dùng khác và gửi đánh giá của chính mình.
Đặc biệt, hệ thống sẽ có cơ chế kiểm duyệt: đánh giá được gửi lên sẽ ở trạng thái chờ duyệt (Pending), và chỉ khi Admin phê duyệt (Approved) thì mới xuất hiện trên trang.

## 2. User Scenarios
- **Xem đánh giá**:
  - **Given** người dùng đang ở trang chi tiết sản phẩm.
  - **When** người dùng chuyển sang tab "Đánh giá & Phản hồi" (hoặc cuộn xuống phần đánh giá).
  - **Then** người dùng nhìn thấy điểm số tổng hợp, biểu đồ phân bố điểm, và danh sách các đánh giá đã được duyệt (Approved).
- **Viết đánh giá**:
  - **Given** người dùng đã mua thành công sản phẩm.
  - **When** người dùng điền số sao, nội dung trải nghiệm và bấm "Gửi đánh giá".
  - **Then** hệ thống thông báo "Đánh giá của bạn đã được ghi nhận và đang chờ duyệt".
- **Lọc và Sắp xếp**:
  - **Given** người dùng đang xem danh sách đánh giá.
  - **When** người dùng bấm vào các bộ lọc (5 sao, 4 sao) hoặc sắp xếp.
  - **Then** danh sách đánh giá chỉ hiển thị các bình luận khớp với bộ lọc.

## 3. Functional Requirements
- **FR-001 (Kiểm duyệt)**: Mọi review mới tạo mặc định trạng thái `pending`. Chỉ hiển thị công khai khi `status = 'approved'`.
- **FR-002 (Giao diện UI/UX)**: Bố cục thiết kế 100% tuân thủ mã HTML được cung cấp, sử dụng hệ thống Design Token `IBACUU` (màu sắc, spacing, typography).
- **FR-003 (Fake Data)**: Sinh sẵn dữ liệu mẫu 5 sao với nhãn "IBACUU biên soạn" / "Đã mua hàng" và một số lời bình luận mẫu để hiển thị trực quan đẹp mắt nhất.
- **FR-004 (Lọc & Phân trang)**: Có các nút lọc cơ bản theo số sao, và chức năng cuộn / phân trang tĩnh cho các bài review.
- **FR-005 (Tính điểm trung bình)**: Điểm tổng hợp và các thanh bar % phải được tính dựa trên số lượng review (có thể dùng data giả cho giai đoạn này).

## 4. Success Criteria
- **SC-001**: Giao diện đánh giá hiển thị hoàn hảo, không phá vỡ UI hiện tại của `SubjectDetailPage`.
- **SC-002**: Cơ chế trạng thái đánh giá (pending -> approved) được định nghĩa rõ ràng. Dữ liệu fake chỉ render các bản ghi có trạng thái `approved`.
- **SC-003**: Cấu trúc UI cho review sidebar (viết đánh giá) và review stream (danh sách) chuẩn xác như bản mockup thiết kế HTML.
