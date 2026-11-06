# Spec 43: Prominent Navbar Search & Subject Pagination

- **Status**: Draft / Pending Approval
- **Branch**: `feat/navbar-search-and-subject-pagination`
- **Created**: 2026-11-07
- **Author**: Antigravity & User

---

## 1. Overview & Problem Statement

### 1.1 Vấn đề hiện tại
1. **Tải quá nhiều môn học cùng lúc (Render Bloat & Lag)**:
   - Hiện tại trang chủ (`HomePage.tsx`) tải và render toàn bộ danh sách môn học (hơn 40-50+ môn) ra DOM trong một lần.
   - Mỗi môn học là một Card 3D phức tạp với nhiều hình ảnh, hiệu ứng hover, tag trạng thái, nút thêm giỏ hàng/mua ngay -> Tăng số lượng DOM nodes, gây giật lag khi cuộn trang hoặc trên thiết bị di động / máy tính cấu hình yếu.
2. **Bộ lọc rườm rà, gây rối giao diện**:
   - `ProductFilterBar.tsx` hiện tại chứa quá nhiều dropdown lọc (Chuyên ngành, Trạng thái sở hữu, Mức giá, Sắp xếp, v.v.) chiếm diện tích lớn, phức tạp không cần thiết với nhu cầu sinh viên ôn thi.
   - Có 2 ô tìm kiếm tồn tại song song (1 trên Navbar, 1 bên trong Filter Bar) gây phân mảnh trải nghiệm tìm kiếm.
3. **Thanh tìm kiếm trên Navbar chưa nổi bật**:
   - Thanh search trên `TopNav` hiện tại có kích thước nhỏ, màu viền xám nhạt mờ (`#e2e8f0`), không tạo được điểm nhấn thị giác để người dùng nhận ra đây là công cụ điều hướng chính.

### 1.2 Giải pháp
1. **Phân trang danh sách môn học (Subject Pagination)**:
   - Giới hạn hiển thị **12 môn học mỗi trang** (chia đều cho lưới 2, 3 hoặc 4 cột).
   - Thêm thanh điều hướng phân trang (Pagination Bar) hiện đại chuẩn TQMaster: Nút Trước/Sau, các số trang với hiệu ứng active gradient, nhãn đếm tổng số trang/kết quả.
   - Tự động cuộn mượt (smooth scroll) lên đầu danh sách khi chuyển trang.
   - Tự động reset về trang 1 khi người dùng gõ tìm kiếm.
2. **Loại bỏ bộ lọc rườm rà (Simplified Course Browsing)**:
   - Loại bỏ các dropdown lọc phức tạp (Chuyên ngành, Giá tiền, Trạng thái) khỏi trang danh sách môn học để giao diện thoáng đãng, tập trung vào môn học.
   - Giữ lại bộ chọn chế độ xem (Grid / List) và hiển thị số lượng môn học rõ ràng.
3. **Nâng cấp thanh tìm kiếm trên Navbar cực kỳ nổi bật (Prominent Search Bar)**:
   - Thiết kế lại thanh tìm kiếm trên `TopNav`:
     - Kích thước rộng rãi, viền tinh tế phát sáng nhẹ.
     - Hiệu ứng Focus Glow viền xanh dương `#2563eb` cao cấp với bóng đổ mượt.
     - Icon tìm kiếm sắc nét kèm nút xóa nhanh `[X]` khi có từ khóa.
     - Hỗ trợ phím tắt tiện lợi `Ctrl + K` (hoặc `⌘K` trên Mac) giúp người dùng focus nhanh từ bất cứ đâu.
     - Placeholder mời gọi trực quan: *"Tìm kiếm môn học, mã môn (PRF192, MAS291, PRO192...)..."*

---

## 2. User Scenarios & Acceptance Criteria (Given - When - Then)

### Scenario 1: Người dùng xem danh sách môn học có phân trang mượt mà
- **Given** người dùng truy cập trang chủ hoặc "Khóa học của bạn" có hơn 12 môn học.
- **When** trang tải xong.
- **Then** hệ thống chỉ hiển thị 12 môn học đầu tiên (Trang 1/N).
- **And** ở cuối danh sách xuất hiện thanh phân trang TQMaster hiển thị rõ ràng: `Trang trước`, các nút số `[1]`, `[2]`, `...`, `Trang sau` và thông tin `Hiển thị 1 - 12 trong tổng số X môn học`.

### Scenario 2: Chuyển trang và tự động cuộn lên đầu danh sách
- **Given** người dùng đang ở Trang 1 và bấm vào nút `[2]` hoặc `Trang sau`.
- **When** sự kiện chuyển trang được kích hoạt.
- **Then** danh sách môn học cập nhật hiển thị 12 môn tiếp theo (từ môn số 13 đến 24).
- **And** màn hình tự động cuộn mượt (smooth scroll) về đầu danh sách môn học.

### Scenario 3: Tìm kiếm nổi bật trên Navbar và tự động reset trang
- **Given** người dùng nhìn vào thanh Navbar ở đầu trang.
- **Then** thanh tìm kiếm hiển thị nổi bật với viền sáng, icon tìm kiếm rõ ràng và gợi ý phím tắt `Ctrl + K`.
- **When** người dùng gõ từ khóa (ví dụ: "PRO192" hoặc "Java").
- **Then** danh sách môn học lập tức lọc theo thời gian thực (hỗ trợ cả tiếng Việt không dấu).
- **And** vị trí trang hiện tại được tự động đưa về `Trang 1`.
- **And** nếu tổng số kết quả <= 12 môn thì thanh phân trang hiển thị 1 trang duy nhất hoặc ẩn điều hướng không cần thiết.

### Scenario 4: Giao diện sạch sẽ sau khi loại bỏ các filter rườm rà
- **Given** người dùng duyệt môn học tại `HomePage`.
- **Then** không còn các dropdown rườm rà chiếm diện tích (Chuyên ngành, Mức giá, Trạng thái).
- **And** không gian trang rộng rãi, thoáng mắt, tập trung hoàn toàn vào nội dung khóa học.

---

## 3. Requirements

### 3.1 Functional Requirements (FR)
- **FR-01**: Cung cấp component phân trang `PaginationBar` với số trang linh hoạt, hỗ trợ Next/Prev, active page indicator theo phong cách TQMaster Dashboard Theme.
- **FR-02**: Giới hạn mỗi trang hiển thị cố định **12 môn học** (`ITEMS_PER_PAGE = 12`).
- **FR-03**: Reset `currentPage` về 1 mỗi khi `searchQuery` thay đổi.
- **FR-04**: Tự động scroll mượt lên vị trí `gridRef` khi người dùng chuyển trang.
- **FR-05**: Tối ưu thanh tìm kiếm Navbar: tăng độ nhận diện, viền focus `rgba(37, 99, 235, 0.25)`, shortcut `Ctrl + K` / `⌘K` để focus, nút xóa từ khóa `X`.
- **FR-06**: Loại bỏ các dropdown bộ lọc cồng kềnh khỏi `HomePage`, giữ lại chuyển đổi Grid/List view và tiêu đề gọn gàng.

### 3.2 Key Entities
- `Subject`: Dữ liệu môn học từ bảng `subjects` (id, name, description, price, semester, sort_order, is_active).

### 3.3 Key Files Modified / Created
- `src/components/TopNav.tsx`: Nâng cấp thanh tìm kiếm siêu nổi bật, shortcut listener `Ctrl + K`.
- `src/pages/user/HomePage.tsx`: Tích hợp phân trang 12 môn/trang, loại bỏ các dropdown lọc rườm rà, thêm thanh phân trang.
- `src/components/common/PaginationBar.tsx` (Mới): Component phân trang tái sử dụng chuẩn theme TQMaster.
- `src/components/home/ProductFilterBar.tsx`: Tinh giản hoặc thay thế bằng thanh toolbar gọn nhẹ (tiêu đề + bộ đếm + toggle Grid/List).

---

## 4. Success Criteria (SC)

- **SC-01**: Tốc độ render ban đầu của trang chủ tăng lên đáng kể (giảm hơn 70% số lượng DOM nodes cho danh sách môn học).
- **SC-02**: Thanh tìm kiếm trên Navbar nổi bật, trực quan, hỗ trợ phím tắt `Ctrl + K` hoạt động mượt mà.
- **SC-03**: Phân trang hoạt động chính xác với cả chế độ xem Grid và List.
- **SC-04**: 100% kiểm thử tự động (`npm test`) vượt qua thành công (114+ passed).
- **SC-05**: Đồng bộ mã nguồn lên cả 2 kho lưu trữ `origin` và `tqmaster`.

