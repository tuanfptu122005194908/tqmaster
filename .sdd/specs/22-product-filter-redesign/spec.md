# Feature Specification: Hệ Thống Bộ Lọc Nâng Cao Kho Khóa Học & Sản Phẩm (Advanced Product & Course Filter UI)

**Feature Identifier**: `22-product-filter-redesign`  
**Status**: ✅ Completed  
**Created Date**: 2026-09-26  
**Target Route**: `/` (Trang chủ User `HomePage.tsx`) & `/my-courses`  

---

## 1. Tổng quan & Vấn đề giải quyết (Overview & Problem Statement)

### 1.1. Hiện trạng (Current State)
Hiện tại, trang danh mục khóa học / kho sản phẩm (`HomePage.tsx`) chỉ có:
1. **Ô tìm kiếm đơn điệu trên TopNav**: Nằm tách biệt với vùng hiển thị sản phẩm; khi học viên cuộn xuống xem danh mục, việc tra cứu từ khóa bị gián đoạn và thiếu tính trực quan tại chỗ.
2. **Dãy nút học kỳ đơn giản (Kỳ 1 – Kỳ 9)**: Chỉ lọc được duy nhất theo một chiều `semester`, không có khả năng lọc kết hợp.
3. **Thiếu hoàn toàn các tiêu chí lọc thiết yếu**:
   - Không có lọc theo **Chuyên ngành / Nhóm bộ môn** (ví dụ: Kỹ thuật phần mềm SE, Trí tuệ nhân tạo AI, An toàn thông tin IA, Dữ liệu DBI, Ngoại ngữ JPD, Toán & Đại cương).
   - Không có lọc theo **Trạng thái sở hữu** (Đã sở hữu, Chưa mua để đăng ký, Đang có trong giỏ hàng).
   - Không có lọc theo **Mức giá** (Miễn phí 0đ, Tiết kiệm dưới 80.000đ, Trọn gói trên 80.000đ).
   - Không có tính năng **Sắp xếp linh hoạt** (Bán chạy nhất / Nổi bật HOT, Giá thấp đến cao, Giá cao đến thấp, Tên A-Z, Theo lộ trình học kỳ).
   - Không có chế độ đổi **Giao diện hiển thị** (Grid View thẻ 3D trực quan vs. List/Compact View danh sách tinh gọn tra cứu nhanh).
   - Không có **Thanh chip badge hiển thị các bộ lọc đang kích hoạt** kèm nút "Xóa tất cả bộ lọc" (Reset Filters).

### 1.2. Mục tiêu giải quyết (Goal & Value Proposition)
Xây dựng một hệ thống **Thanh Điều Khiển Bộ Lọc & Tìm Kiếm Đa Chiều (Advanced Product Filter Bar)** đẳng cấp theo chuẩn thiết kế **TQMaster Dashboard Theme**, giúp học viên:
- Tìm thấy khóa học / đề thi mong muốn chỉ trong vòng **3 giây** (giảm 80% thao tác tìm kiếm).
- Trải nghiệm giao diện hiện đại, mượt mà với hiệu ứng vi mô (micro-interactions), tag badge sinh động và bộ đếm kết quả thông minh ("Tìm thấy X/Y môn học phù hợp").
- Tối ưu hoàn hảo trên cả Desktop, Tablet và Mobile (Bottom Sheet / Drawer lọc tinh gọn trên di động).

---

## 2. Kịch bản Người Dùng & Tiêu Chuẩn Nghiệm Thu (User Scenarios Given-When-Then)

### User Story 1 – Tìm kiếm trực tiếp kèm xóa nhanh tại vùng kho sản phẩm (Priority: P0)
Là một học viên đang xem kho khóa học, tôi muốn có thanh tìm kiếm tích hợp ngay trên đầu danh mục sản phẩm để gõ từ khóa và xem kết quả cập nhật ngay lập tức mà không phải cuộn lên tận thanh menu TopNav.

- **Given**: Học viên đang ở mục "Kho Khóa Học & Đề Thi Tuyển Chọn" tại trang chủ.
- **When**: Học viên nhập từ khóa (ví dụ: `"Java"`, `"PRN"`, `"Toán"`) vào ô tìm kiếm của Filter Bar.
- **Then**: Hệ thống lọc tức thì danh sách môn học khớp với mã môn hoặc tên môn.
- **Then**: Nút `[X]` xuất hiện trong ô nhập; khi nhấn `[X]`, từ khóa được xóa ngay và danh sách khôi phục đầy đủ.

### User Story 2 – Lọc đa tiêu chí kết hợp (Chuyên ngành, Học kỳ, Tình trạng sở hữu, Mức giá) (Priority: P0)
Là một học viên ngành Kỹ thuật phần mềm (SE), tôi muốn lọc ra các môn "Kỳ 3" thuộc "Ngành SE" mà "Chưa sở hữu" để lựa chọn đăng ký học kỳ mới.

- **Given**: Danh sách tất cả các môn học đang hiển thị.
- **When**: Học viên chọn:
  - Học kỳ: `Kỳ 3`
  - Nhóm ngành: `Kỹ thuật phần mềm (SE)`
  - Tình trạng: `Chưa sở hữu`
- **Then**: Danh sách hiển thị chính xác các môn thỏa mãn đồng thời cả 3 điều kiện (logic AND).
- **Then**: Bộ đếm hiển thị: `Tìm thấy X môn học phù hợp`.
- **Then**: Vùng Filter hiển thị các Chip Badge: `[Kỳ 3 ×]`, `[Kỹ thuật phần mềm (SE) ×]`, `[Chưa sở hữu ×]`.

### User Story 3 – Sắp xếp linh hoạt (Sort By) (Priority: P1)
Là một học viên muốn tìm các môn giá tốt hoặc các môn nổi bật nhất, tôi muốn có menu sắp xếp nhanh.

- **Given**: Danh sách môn học sau khi lọc.
- **When**: Học viên chọn sắp xếp:
  - `Giá: Thấp đến cao`: Các môn miễn phí (0đ) và giá thấp lên đầu.
  - `Giá: Cao đến thấp`: Các môn trọn gói giá cao lên đầu.
  - `Tên A → Z`: Xếp theo bảng chữ cái.
  - `Nổi bật / Bán chạy`: Ưu tiên các môn có huy hiệu HOT.
- **Then**: Danh sách lập tức được sắp xếp lại mượt mà với hiệu ứng transition nhẹ nhàng.

### User Story 4 – Chuyển đổi chế độ hiển thị Grid (Lưới) và List (Danh sách rút gọn) (Priority: P1)
Là một học viên ôn thi nhiều môn cùng lúc, tôi muốn chuyển sang dạng danh sách thu gọn (List View) để bao quát nhiều môn trên một màn hình mà không cần cuộn quá nhiều.

- **Given**: Đang ở chế độ xem Grid View mặc định.
- **When**: Học viên nhấn nút biểu tượng `List View` trên thanh công cụ.
- **Then**: Giao diện chuyển sang dạng bảng thẻ ngang tinh gọn, hiển thị mã môn, tên môn, học kỳ, giá và nút hành động nhanh (Xem/Mua).
- **Then**: Lựa chọn chế độ xem được ghi nhớ tạm thời trong phiên làm việc.

### User Story 5 – Trạng thái không có kết quả (Smart Empty State) (Priority: P0)
Khi học viên chọn tổ hợp bộ lọc quá hẹp dẫn đến không có môn nào thỏa mãn.

- **Given**: Tổ hợp bộ lọc không tìm thấy kết quả nào.
- **When**: Danh sách rỗng (`filtered.length === 0`).
- **Then**: Hệ thống hiển thị khung Empty State cao cấp với minh họa, thông báo nguyên nhân cụ thể và nút bấm nổi bật: `[Đặt lại toàn bộ bộ lọc]`.

---

## 3. Yêu Cầu Chức Năng Chi Tiết (Functional Requirements)

- **FR-01 (Search Box Inline)**: Hỗ trợ tìm kiếm theo cả mã môn (VD: `PRN211`, `JPD113`) và tên đầy đủ tiếng Việt / tiếng Anh. Tự động loại bỏ dấu tiếng Việt khi so sánh (case-insensitive & accent-tolerant).
- **FR-02 (Major / Category Filter)**: Phân loại môn học theo tiền tố mã môn tự động:
  - `SE / Phần mềm`: PRF, PRO, CSD, PRJ, PRN, SWP, SWD, SWE...
  - `AI / Trí tuệ nhân tạo`: AIL, DLP, MLN...
  - `IA / An ninh mạng`: IAL, NWC, SEC...
  - `Data / Hệ thống`: DBI, CSI, MAS...
  - `Toán & Cơ bản`: MAE, MAD, MAS, PHY, CHE...
  - `Ngoại ngữ`: JPD (Tiếng Nhật), ENG (Tiếng Anh)...
  - `Kinh tế / Kỹ năng`: SSG, MKT, ECO...
- **FR-03 (Semester Filter Pills)**: Dãy pill trực quan gồm `Tất cả` và `Kỳ 1` đến `Kỳ 9`. Có badge nhỏ đếm số lượng môn thuộc từng kỳ.
- **FR-04 (Ownership Filter)**: Lựa chọn giữa `Tất cả`, `Đã sở hữu` (dựa trên `isPurchased()`), `Chưa sở hữu` (người dùng chưa mua), `Trong giỏ hàng` (đang nằm trong giỏ).
- **FR-05 (Price Range Filter)**: Lựa chọn giữa `Tất cả mức giá`, `Miễn phí (0đ)`, `Dưới 80.000đ`, `Từ 80.000đ trở lên`.
- **FR-06 (Sorting Engine)**: 5 chế độ sắp xếp linh hoạt (`default`, `price_asc`, `price_desc`, `name_asc`, `featured`).
- **FR-07 (View Switcher)**: 2 chế độ hiển thị `grid` (lưới card 3D lớn) và `list` (danh sách hàng ngang gọn gàng).
- **FR-08 (Active Chips & Reset)**: Hiển thị các tag lọc đang áp dụng với nút `×` để hủy nhanh từng điều kiện, cùng nút `Xóa tất cả`.
- **FR-09 (Responsive Mobile Filter)**: Trên màn hình < 768px, gom các tùy chọn nâng cao vào nút `Bộ lọc` (kèm badge số lượng bộ lọc đang bật) mở modal/drawer trượt từ dưới lên (Bottom Sheet).

---

## 4. Key Entities & Files

### Bảng dữ liệu liên quan:
- `subjects`: `id`, `name`, `semester`, `price`, `thumbnail_url`, `description`, `is_active`, `sort_order`.
- Store cục bộ / Context: `useApp()` (`purchasedIds`, `cart`, `isPurchased()`).

### File mã nguồn tác động:
- Tạo mới: `src/components/home/ProductFilterBar.tsx` (Component thanh bộ lọc hoàn chỉnh).
- Tạo mới: `src/components/home/CourseListItem.tsx` (Component hiển thị môn học dạng List View tinh gọn).
- Cập nhật: `src/pages/user/HomePage.tsx` (Tích hợp Filter Bar, logic lọc đa chiều, chuyển đổi Grid/List).
- Tạo mới: `src/test/productFilter.test.ts` (Bộ kiểm thử tự động cho logic lọc và sắp xếp).

---

## 5. Tiêu Chuẩn Nghiệm Thu Đo Lường Được (Success Criteria)

- **SC-01**: Tốc độ phản hồi khi chuyển đổi bộ lọc < 50ms (lọc mượt mà trên state client, không re-fetch dữ liệu mạng không cần thiết).
- **SC-02**: Logic lọc AND hoạt động chính xác 100% qua tất cả các tổ hợp (Search + Semester + Major + Ownership + Price).
- **SC-03**: Giao diện đạt chuẩn 100% **TQMaster Dashboard Theme** (màu sắc HSL, bo góc 20-24px, đổ bóng nhẹ, gradient xanh chủ đạo).
- **SC-04**: Bộ kiểm thử tự động `productFilter.test.ts` đạt 100% pass với đầy đủ các ca kiểm thử biên (edge cases).
