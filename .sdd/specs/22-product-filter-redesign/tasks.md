# Tasks: Danh Sách Công Việc Triển Khai Bộ Lọc Sản Phẩm

**Feature Identifier**: `22-product-filter-redesign`  
**Status**: ✅ Completed  

---

## Danh mục công việc chi tiết (Checklist)

### 1. Phê duyệt Đặc tả (Review Gate)
- [x] Trình bày giao diện và kế hoạch thiết kế cho người dùng
- [x] Thu thập phản hồi và chốt phương án thiết kế UI bộ lọc (Horizontal Filter Bar + Lọc theo kỳ chuyên sâu)

### 2. Logic Lọc & Bộ Kiểm Thử (Unit Tests)
- [x] Tạo file helper phân loại mã môn `src/lib/subjectClassification.ts`
- [x] Tạo file test `src/test/productFilter.test.ts` kiểm thử:
  - [x] Lọc theo từ khóa tìm kiếm (mã môn & tên môn, không phân biệt hoa thường/dấu)
  - [x] Lọc theo chuyên ngành (SE, AI, IA, Data, Math, Lang, Business)
  - [x] Lọc theo học kỳ (1 - 9 hoặc tất cả)
  - [x] Lọc theo trạng thái sở hữu (Đã mua, Chưa mua, Trong giỏ)
  - [x] Lọc theo mức giá (Miễn phí, <80k, >=80k)
  - [x] Sắp xếp (Học kỳ, Giá tăng/giảm, Tên A-Z, HOT)
  - [x] Kết hợp đa điều kiện đồng thời (Composite Filter)

### 3. Thành Phần Giao Diện (UI Components)
- [x] Tạo component `src/components/home/ProductFilterBar.tsx`:
  - [x] Thanh tìm kiếm tích hợp kèm nút X xóa nhanh
  - [x] Dãy pill học kỳ với bộ đếm số môn từng kỳ
  - [x] Dropdown chọn chuyên ngành / bộ môn
  - [x] Dropdown / Tabs chọn trạng thái sở hữu & mức giá
  - [x] Nút chọn chế độ sắp xếp (Sort By)
  - [x] Nút chuyển đổi giao diện Grid View / List View
  - [x] Dải Chip Badges hiển thị bộ lọc đang bật & Nút Xóa tất cả bộ lọc
  - [x] Giao diện Drawer / Bottom Sheet cho màn hình Mobile
- [x] Tạo component `src/components/home/CourseListItem.tsx`:
  - [x] Hiển thị thông tin môn học dạng hàng ngang gọn gàng cho List View
  - [x] Nút Xem chi tiết / Học ngay / Thêm giỏ hàng tương thích đầy đủ với hệ thống Cart & Payment

### 4. Tích Hợp Vào Trang Chủ (`HomePage.tsx`)
- [x] Thay thế bộ lọc cũ trong `src/pages/user/HomePage.tsx` bằng `ProductFilterBar`
- [x] Nối state lọc đa chiều vào `useMemo` tính toán danh sách hiển thị
- [x] Hỗ trợ chuyển đổi mượt mà giữa Grid View (`CourseCard`) và List View (`CourseListItem`)
- [x] Cải tiến giao diện Empty State khi không tìm thấy kết quả phù hợp

### 5. Kiểm Thử, Cập Nhật & Đẩy Code (Dual-Repo Git Push)
- [x] Chạy `npm test` xác nhận 100% tests pass (49/49 tests pass)
- [x] Chạy `graphify update .` để đồng bộ đồ thị tri thức
- [x] Commit với thông điệp chuẩn semantic: `feat: implement advanced product filter UI for course catalog`
- [x] Đẩy code lên cả 2 kho lưu trữ:
  - `git push origin main`
  - `git push tqmaster main`
