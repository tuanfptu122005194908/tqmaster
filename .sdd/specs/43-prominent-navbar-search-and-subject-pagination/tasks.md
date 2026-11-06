# Tasks Breakdown - Spec 43: Prominent Navbar Search & Subject Pagination

- [x] **Task 1: Tạo Component Phân trang tái sử dụng (`PaginationBar.tsx`)**
  - [x] 1.1 Xây dựng component `src/components/common/PaginationBar.tsx` với đầy đủ nút Trước, Số trang, Sau.
  - [x] 1.2 Thiết kế styling theo chuẩn TQMaster Dashboard Theme (Gradient xanh dương, hover effect, badge hiển thị số môn).
  - [x] 1.3 Xử lý trường hợp nhiều trang với dấu ba chấm rút gọn `...`.

- [x] **Task 2: Nâng cấp thanh tìm kiếm Navbar siêu nổi bật (`TopNav.tsx`)**
  - [x] 2.1 Mở rộng kích thước thanh search, thiết kế viền sáng và hiệu ứng phát sáng Focus Glow xanh dương.
  - [x] 2.2 Thêm badge phím tắt `Ctrl + K` / `⌘K` trực quan.
  - [x] 2.3 Bổ sung phím tắt toàn cục `Ctrl + K` để tự động focus vào ô tìm kiếm.
  - [x] 2.4 Tinh chỉnh giao diện trên thiết bị di động.

- [x] **Task 3: Tinh giản bộ lọc & Tích hợp phân trang vào `HomePage.tsx`**
  - [x] 3.1 Cắt bỏ các dropdown lọc cồng kềnh không cần thiết (Major, Price, Ownership).
  - [x] 3.2 Tinh gọn thanh công cụ đầu trang (Tiêu đề, số môn hiển thị, toggle Grid/List).
  - [x] 3.3 Khai báo `ITEMS_PER_PAGE = 12` và logic cắt lát dữ liệu (`pagedSubjects`).
  - [x] 3.4 Tự động reset về trang 1 khi người dùng gõ tìm kiếm.
  - [x] 3.5 Cuộn mượt (`smooth scroll`) về đầu danh sách môn học khi chuyển trang.
  - [x] 3.6 Đặt component `<PaginationBar />` ở chân trang.

- [x] **Task 4: Kiểm thử tự động & Nghiệm thu**
  - [x] 4.1 Viết unit test cho component `PaginationBar`.
  - [x] 4.2 Chạy toàn bộ test suite `npm test` và đảm bảo vượt qua 100% (117/117 passed).
  - [x] 4.3 Cập nhật Knowledge Graph: `graphify update .`.
  - [x] 4.4 Thực hiện Dual Push lên cả 2 remote git (`origin` và `tqmaster`).
