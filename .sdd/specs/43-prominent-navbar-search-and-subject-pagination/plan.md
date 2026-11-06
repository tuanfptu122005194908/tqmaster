# Technical Plan - Spec 43: Prominent Navbar Search & Subject Pagination

## 1. Technical Architecture & Component Structure

```
                  ┌──────────────────────────────────────────────┐
                  │                 TopNav.tsx                   │
                  │   [Logo]     [Prominent Search]     [User]   │
                  │              (Ctrl+K Shortcut)               │
                  └───────────────────────┬──────────────────────┘
                                          │ updates searchQuery (AppContext)
                                          ▼
                  ┌──────────────────────────────────────────────┐
                  │                HomePage.tsx                  │
                  │  - filterAndSortSubjects(subjects, query)    │
                  │  - currentPage (1..N)                        │
                  │  - pagedSubjects = filtered.slice(...)       │
                  │  - reset page on query change                │
                  └───────────────┬──────────────────────────────┘
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
┌───────────────────────────────┐          ┌───────────────────────────────┐
│     Subject Grid / List       │          │       PaginationBar.tsx       │
│   (Render 12 items / page)    │          │  [< Prev] [1] [2] [3] [Next >]│
└───────────────────────────────┘          └───────────────────────────────┘
```

## 2. Implementation Steps

### Phase 1: Tạo Component Phân trang tái sử dụng (`PaginationBar.tsx`)
- Tạo `src/components/common/PaginationBar.tsx`.
- Props:
  - `currentPage`: number
  - `totalPages`: number
  - `onPageChange`: (page: number) => void
  - `totalItems`: number
  - `itemsPerPage`: number
- Giao diện:
  - Nút Trước/Sau: disable khi ở trang đầu/cuối.
  - Các nút số trang thông minh (rút gọn `...` nếu có nhiều hơn 7 trang).
  - Thẻ thông tin: "Hiển thị X - Y trên tổng Z môn học".
  - Theme: Bo góc tròn mềm mại, nút active mang gradient `#2563eb` -> `#1d4ed8` kèm shadow.

### Phase 2: Nâng cấp thanh tìm kiếm TopNav (`TopNav.tsx`)
- Mở rộng chiều rộng tối đa (lên tới 480-520px).
- Nền trắng tinh xảo với viền `1.5px solid #cbd5e1` và đổ bóng nhẹ.
- Thêm hiệu ứng hover: viền `#93c5fd`, bóng mờ.
- Thêm hiệu ứng focus:
  - Viền xanh `#2563eb`.
  - Box-shadow phát sáng: `0 0 0 4px rgba(37, 99, 235, 0.15)`.
- Icon tìm kiếm màu xanh `#2563eb`.
- Thêm badge phím tắt `Ctrl + K` (ẩn trên màn hình mobile nhỏ).
- Thêm global `keydown` event listener để tự động focus vào input khi nhấn `Ctrl + K` hoặc `Meta + K`.

### Phase 3: Tinh giản Filter & Tích hợp Phân trang vào HomePage (`HomePage.tsx`)
- Khai báo `ITEMS_PER_PAGE = 12`.
- Khai báo state `currentPage = 1`.
- Cắt lát dữ liệu:
  ```ts
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const pagedSubjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);
  ```
- Reset `currentPage` về 1 khi `searchQuery` hoặc bất kỳ điều kiện lọc nào thay đổi:
  ```ts
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);
  ```
- Thay thế thanh filter cồng kềnh `ProductFilterBar.tsx` bằng một thanh header tinh gọn:
  - Tiêu đề danh mục + Bộ đếm tổng số môn học.
  - Bộ chuyển đổi chế độ xem Grid / List view.
  - Tag thông báo đang tìm kiếm từ khóa kèm nút bấm xóa nhanh nếu có query.
- Render `pagedSubjects` thay vì toàn bộ `filtered`.
- Render `<PaginationBar />` ở chân trang khi `totalPages > 1`.
- Khi đổi trang, gọi hàm cuộn mượt:
  ```ts
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  ```

### Phase 4: Kiểm thử và Hoàn thiện
- Chạy unit test (`npm test`) đảm bảo 114/114 bài test pass.
- Viết bổ sung unit test cho `PaginationBar.test.tsx` nếu cần.
- Kiểm tra tính tương thích trên cả Desktop và Mobile.
- Đồng bộ Knowledge Graph: `graphify update .`.
- Dual Push lên cả 2 remote git (`origin` và `tqmaster`).

## 3. Potential Risks & Mitigations
- **Risk**: Mất các bộ lọc học kỳ nếu sinh viên muốn lọc theo kỳ 1, 2, 3...
  - **Mitigation**: Có thể giữ lại dãy pills chọn học kỳ siêu gọn gàng hoặc cho phép tìm trực tiếp theo "kỳ 1", "kỳ 2" hoặc mã môn trên thanh tìm kiếm (hệ thống tìm kiếm đã hỗ trợ regex / full-text match).
- **Risk**: Phím tắt `Ctrl + K` xung đột với trình duyệt.
  - **Mitigation**: Sử dụng `e.preventDefault()` khi bắt sự kiện `(e.ctrlKey || e.metaKey) && e.key === 'k'`.

