# Feature Specification: Admin Dashboard & Analytics

**Feature Branch**: `[main]`  
**Status**: ✅ Implemented (Optimized v2.1)

---

## 1. Overview
Admin Dashboard (`/admin/dashboard`) là trung tâm giám sát hoạt động kinh doanh và học tập của nền tảng TQMaster. Trang cung cấp các chỉ số doanh thu tức thời, biểu đồ xu hướng theo mốc thời gian, tỷ lệ phân bổ môn học, danh sách đơn hàng gần đây và lối tắt quản trị.

Được thiết kế theo **TQMaster Dashboard Theme** với cơ chế truy vấn dữ liệu hiệu năng cao: sử dụng truy vấn Server-side HEAD Count và giới hạn dữ liệu biểu đồ trong khoảng thời gian có điều kiện (400 ngày gần nhất) nhằm tối ưu thời gian tải trang dưới 500ms.

---

## 2. User Scenarios & Testing

### User Story 1 – Xem số liệu thống kê tổng quan (Priority: P1)
Là một Quản trị viên, tôi muốn theo dõi ngay lập tức 4 chỉ số cốt lõi: Doanh thu, Đơn hàng, Giá trị trung bình đơn và Tổng số học viên khi vừa mở trang quản trị.

**Acceptance Scenarios**:
1. **Given** Quản trị viên đã đăng nhập và truy cập `/admin` hoặc `/admin/dashboard`.
2. **When** trang tải xong,
3. **Then**:
   - Card 1 (Doanh thu): hiển thị tổng tiền các đơn `status = 'approved'`, định dạng VNĐ kèm tỷ lệ tăng trưởng.
   - Card 2 (Đơn hàng): hiển thị tổng số đơn từ server-side exact count, kèm badge số đơn đang chờ duyệt (`pending`).
   - Card 3 (Giá trị TB đơn): hiển thị trung bình doanh thu trên mỗi đơn duyệt thành công.
   - Card 4 (Học viên): hiển thị tổng số học sinh đã đăng ký (`role != 'admin'`).

### User Story 2 – Phân tích biểu đồ doanh thu theo chu kỳ (Priority: P1)
Là một Quản trị viên, tôi muốn chuyển đổi giữa các khung thời gian (Hôm nay, 7 ngày, 30 ngày, 12 tháng) để nắm bắt biến động dòng tiền.

**Acceptance Scenarios**:
1. **Given** Quản trị viên đang ở mục Biểu đồ doanh thu,
2. **When** chọn tab `Hôm nay` (Day), `7 ngày` (Week), `30 ngày` (Month) hoặc `12 tháng` (Year),
3. **Then** biểu đồ SVG tương tác cập nhật ngay trục thời gian và đường dốc tương ứng, kèm tổng doanh thu của kỳ đó.

### User Story 3 – Theo dõi tỷ lệ môn học & tình trạng duyệt đơn (Priority: P2)
Là một Quản trị viên, tôi muốn biết môn học nào đang được mua nhiều nhất và tỷ lệ duyệt đơn hiện tại.

**Acceptance Scenarios**:
1. **Given** dữ liệu đơn hàng đã tải,
2. **When** cuộn xuống khu vực phân tích cơ cấu,
3. **Then**:
   - Danh sách top môn học hiển thị thanh tiến độ %, doanh thu và số lượng bán.
   - Widget "Tỷ lệ duyệt đơn" hiển thị phần trăm đơn Đã duyệt, Chờ xử lý, Đã hủy.

### User Story 4 – Thao tác nhanh trên đơn hàng gần đây (Priority: P2)
Là một Quản trị viên, tôi muốn duyệt hoặc từ chối nhanh đơn hàng mới nhất mà không cần chuyển toàn bộ qua trang đơn hàng.

**Acceptance Scenarios**:
1. **Given** có đơn hàng mới với trạng thái `pending` trong bảng "Đơn hàng gần đây",
2. **When** Quản trị viên click "Duyệt",
3. **Then** trạng thái đơn chuyển sang `approved`, quyền học môn học được cấp ngay cho học viên, và số liệu thống kê tự động cập nhật.

---

## 3. Requirements

### Functional Requirements
- **FR-001**: Hệ thống PHẢI kiểm tra quyền admin (`role === 'admin'`). Người dùng không có quyền admin truy cập `/admin/*` sẽ bị chuyển hướng về `/`.
- **FR-002**: Chỉ số Tổng học viên PHẢI được lấy qua query HEAD count (`{ count: 'exact', head: true }`) lọc theo `role != 'admin'`.
- **FR-003**: Số lượng đơn Chờ duyệt, Đã duyệt, Đã hủy PHẢI được lấy độc lập qua query HEAD count để tránh tải toàn bộ record về client.
- **FR-004**: Dữ liệu vẽ biểu đồ PHẢI được giới hạn theo mốc thời gian (mặc định lấy đơn trong 400 ngày gần nhất, tối đa 1000 record) để tối ưu băng thông và bộ nhớ.
- **FR-005**: Hệ thống PHẢI cung cấp bảng "Đơn hàng mới nhất" (top 6 đơn) cho phép xem mã đơn, học viên, số tiền, ngày tạo, trạng thái và nút duyệt nhanh.
- **FR-006**: Đăng ký kênh Supabase Realtime lắng nghe thay đổi trên bảng `orders` để làm mới dữ liệu tự động với debounce 400ms.

### Non-Functional Requirements
- **NFR-001**: Tốc độ render lần đầu không quá 1000ms với dataset > 10,000 orders.
- **NFR-002**: Giao diện tuân thủ tuyệt đối quy chuẩn TQMaster: Canvas `#f4f7fc`, Card `#ffffff` bo góc 20-24px, Font chữ `Inter` kết hợp `Be Vietnam Pro`.
- **NFR-003**: Hỗ trợ responsive đa màn hình (Desktop 2-3 cột, Mobile 1 cột xếp chồng mượt mà).

### Key Entities
- **orders**: `id`, `created_at`, `final_amount`, `status`, `full_name`, `email`, `order_items(subject_id, subjects(name, id))`
- **profiles**: `id`, `role`, `created_at`
- **subjects**: `id`, `name`, `price`

---

## 4. Success Criteria
- **SC-001**: Thời gian tải số liệu dashboard dưới 800ms trên mạng 4G/Wifi tiêu chuẩn.
- **SC-002**: Không xảy ra hiện tượng tràn RAM trình duyệt khi cơ sở dữ liệu có hàng chục nghìn đơn hàng.
- **SC-003**: Trạng thái thống kê khớp 100% với dữ liệu thực trong PostgreSQL.
