# Feature Specification: Admin Analytics Dashboard

**Feature Branch**: `[main]`  
**Status**: ✅ Implemented (Optimized v2.1)

---

## 1. Overview

Admin Dashboard (`/admin`) là trung tâm phân tích và điều hành toàn bộ hệ thống TQMaster. Trang này cung cấp cái nhìn tổng quan theo thời gian thực (Real-time) về doanh thu, tình trạng đơn hàng, môn học bán chạy và tài nguyên hệ thống.

Dashboard được thiết kế theo giao diện thẻ Pastel hiện đại (TQMaster Theme) để giảm tải căng thẳng cho người quản trị, với cơ chế lấy dữ liệu được tối ưu cực hạn qua `exact count` queries và giới hạn dữ liệu vẽ biểu đồ, tránh hiện tượng nghẽn cổ chai (bottleneck) khi dữ liệu phình to.

---

## 2. User Scenarios & Testing

### User Story 1 – Thống kê thẻ số liệu (Priority: P1)
Là một Quản trị viên, tôi muốn nhìn thấy ngay các chỉ số sinh lời cốt lõi (Doanh thu, số đơn) ngay khi vừa đăng nhập.

**Acceptance Scenarios**:
1. **Given** admin truy cập `/admin`, **When** trang tải xong, **Then** 4 thẻ số liệu hiển thị: Tổng doanh thu (thực tế từ các đơn Đã duyệt), Tổng đơn hàng, Giá trị trung bình/đơn, và Tổng sinh viên.
2. **Given** thẻ "Tổng đơn hàng", **Then** hiển thị thêm một con số nhắc nhở: "Có X đơn đang chờ admin duyệt" bằng màu cam.

### User Story 2 – Phân tích Doanh thu động (Priority: P1)
Là một Quản trị viên, tôi muốn xem biểu đồ doanh thu thay đổi theo Ngày, Tuần, Tháng, hoặc Năm để phân tích xu hướng mua tài liệu.

**Acceptance Scenarios**:
1. **Given** biểu đồ "Phân Tích Doanh Thu", **When** tôi bấm vào tab "Ngày", **Then** hệ thống render Area Chart (màu xanh dương) hiển thị doanh thu theo 14 ngày gần nhất.
2. **Given** tôi chuyển sang tab "Tháng", **Then** biểu đồ tự động group dữ liệu và vẽ doanh thu của 12 tháng trong năm.
3. **When** di chuột qua các điểm trên biểu đồ, **Then** hiển thị Tooltip nổi với định dạng tiền VND và nhãn "Doanh thu thực tế từ Supabase".

### User Story 3 – Xếp hạng Môn học (Priority: P2)
Là một Quản trị viên, tôi muốn biết môn học nào đang mang lại nhiều doanh thu nhất.

**Acceptance Scenarios**:
1. **Given** bảng xếp hạng "Top Môn Bán Chạy", **When** tôi lọc theo "Tuần", **Then** hệ thống tính toán doanh thu của các `order_items` từ các đơn hàng Đã duyệt trong 7 ngày qua.
2. **Then** render một Donut Chart (biểu đồ tròn lõm giữa) với số tổng lượng bán ra nằm ở chính giữa, cùng danh sách 5 môn đứng đầu xếp theo tỷ trọng doanh thu `%`.

### User Story 4 – Theo dõi đơn hàng theo thời gian thực (Priority: P1)
Là một Quản trị viên, tôi muốn biết ngay lập tức nếu có người mua tài liệu để vào duyệt đơn.

**Acceptance Scenarios**:
1. **Given** trang Dashboard đang mở, **When** một sinh viên đặt đơn hàng mới, **Then** Supabase Realtime gửi broadcast.
2. **Then** Dashboard tự động làm mới dữ liệu (debounce 500ms) để biểu đồ và danh sách 10 đơn hàng gần nhất được cập nhật mà không cần F5.

---

## 3. Requirements

### Functional Requirements
- **FR-001 (Optimized Counts)**: Tổng Sinh viên, Môn học, Đề thi, Câu hỏi và Trạng thái đơn hàng (Pending, Approved, Rejected) PHẢI được lấy bằng query `count: 'exact', head: true` để tránh tải toàn bộ record về client.
- **FR-002 (Chart Rendering Limit)**: Dữ liệu đơn hàng chi tiết để vẽ biểu đồ và phân tích (Orders & Order Items) chỉ truy vấn tối đa `1000` dòng và cắt ngọn `400` ngày gần nhất.
- **FR-003 (Real-time Sync)**: Component phải subscribe vào kênh `admin-dashboard-realtime-<timestamp>`, bảng `orders`. Khi có event (INSERT, UPDATE), kích hoạt fetch lại data sau một khoảng `clearTimeout/setTimeout(500ms)`.
- **FR-004 (Top Sales Logic)**: Top môn bán chạy dựa vào bảng `order_items`, chỉ tính các item thuộc những đơn hàng có trạng thái `approved`, giới hạn tối đa top 5 môn. Để tránh giới hạn URL Length của PostgREST, `order_items` phải được fetch theo từng cụm nhỏ (chunkSize = 150 `order_id` mỗi lần) cho TẤT CẢ các đơn hàng đã duyệt, đảm bảo tính toán xếp hạng chính xác cho mọi khung thời gian.
- **FR-005 (Recent Orders Table)**: Hiển thị 10 đơn hàng gần nhất (chưa bị phân trang), hiển thị Mã đơn, Khách hàng, Mã SV, Ngày tạo, Số tiền và Trạng thái (hiển thị dưới dạng Status Badge).
- **FR-006 (Responsiveness)**: Các view bảng (table) tự động ẩn trên màn hình di động (`hidden-mobile`) và chuyển sang giao diện List thẻ (`visible-mobile`).

### Key Entities

**Table: orders**
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Khóa chính |
| `status` | enum | `'pending'`, `'approved'`, `'rejected'` |
| `final_amount` | numeric | Tổng số tiền đã thanh toán / cần thanh toán |
| `created_at` | timestamptz | Ngày tạo đơn (Dùng để nhóm theo ngày/tuần/tháng) |
| `full_name` | text | Tên khách hàng |
| `student_code` | text | Mã sinh viên FPT |

### Key Files
- `src/pages/admin/AdminDashboard.tsx`: Component chứa toàn bộ UI và Logic dashboard.
- `src/lib/mockData.ts`: Sử dụng hàm `formatPrice` để định dạng tiền tệ (VND).

---

## 4. Success Criteria
- **SC-001**: Thời gian render giao diện Dashboard lần đầu < 1500ms ngay cả khi hệ thống có > 50,000 bản ghi nhờ query count (head).
- **SC-002**: Biểu đồ hiển thị mượt mà, đúng logic thời gian.
- **SC-003**: Cập nhật Realtime hoạt động chính xác khi có người đặt đơn trên một tab khác (dữ liệu nhảy ngay lập tức trên dashboard).
- **SC-004**: Giao diện tuân thủ quy chuẩn UI TQMaster: Card bo góc 20-22px, màu Pastel dịu mắt, chữ font Inter.
