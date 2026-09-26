# Technical Plan: Thiết Kế & Triển Khai Bộ Lọc Nâng Cao Kho Khóa Học

**Feature Identifier**: `22-product-filter-redesign`  
**Status**: ✅ Completed  
**Date**: 2026-09-26  

---

## 1. Kiến Trúc Kỹ Thuật (Architecture Overview)

Hệ thống bộ lọc được thiết kế theo hướng **Component hóa độc lập & Reactive Client-Side Filtering**:
- Dữ liệu `subjects` đã được cache và nạp vào client trong `HomePage.tsx`.
- Toàn bộ thao tác lọc, tìm kiếm, phân loại chuyên ngành và sắp xếp được thực hiện tức thì trên Client (O(N) với N ~ vài chục đến vài trăm môn, thời gian xử lý < 2ms), mang lại trải nghiệm mượt mà không độ trễ.
- Tách bạch rõ ràng giữa State điều khiển bộ lọc (`FilterState`) và Component render (`ProductFilterBar`, `CourseCard`, `CourseListItem`).

```
┌────────────────────────────────────────────────────────┐
│                      HomePage.tsx                      │
│  - subjects: Subject[] (Client cache)                  │
│  - filterState: FilterState                            │
│  - filteredAndSortedSubjects: Subject[] (useMemo)      │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
       Props & Callbacks          Filtered Subjects
                ▼                        ▼
┌──────────────────────────────┐  ┌──────────────────────┐
│     ProductFilterBar.tsx     │  │  ViewMode Switch     │
│  - Search Box with clear [X] │  ├──────────────────────┤
│  - Semester Pills + Badges   │  │ Grid: CourseCard     │
│  - Major/Category Dropdown   │  │ List: CourseListItem │
│  - Ownership Status Tabs     │  └──────────────────────┘
│  - Price Range Selector      │
│  - Sort Menu & View Switcher │
│  - Active Chips + Reset All  │
└──────────────────────────────┘
```

---

## 2. Thiết Kế Mô Hình Dữ Liệu & Types (Data Model)

```typescript
export type MajorCategory = 
  | 'all'         // Tất cả ngành
  | 'se'          // Kỹ thuật phần mềm (PRF, PRO, CSD, PRJ, PRN, SWP, SWD, SWE...)
  | 'ai'          // Trí tuệ nhân tạo (AIL, DLP, MLN...)
  | 'ia'          // An toàn thông tin (IAL, NWC, SEC...)
  | 'data'        // Dữ liệu & Hệ thống (DBI, CSI, MAS...)
  | 'math_gen'    // Toán & Khoa học cơ bản (MAE, MAD, PHY...)
  | 'lang'        // Ngoại ngữ (JPD, ENG...)
  | 'business';   // Kinh tế & Kỹ năng (MKT, SSG, ECO...)

export type OwnershipFilter = 'all' | 'unowned' | 'owned' | 'in_cart';

export type PriceFilter = 'all' | 'free' | 'under_80k' | 'over_80k';

export type SortOption = 
  | 'semester_asc'  // Theo lộ trình kỳ học (1 -> 9)
  | 'featured'      // Nổi bật / Bán chạy nhất
  | 'price_asc'     // Giá: Thấp đến cao
  | 'price_desc'    // Giá: Cao đến thấp
  | 'name_asc';     // Tên môn: A -> Z

export interface FilterState {
  search: string;
  semester: number | 'all';
  major: MajorCategory;
  ownership: OwnershipFilter;
  price: PriceFilter;
  sortBy: SortOption;
  viewMode: 'grid' | 'list';
}
```

---

## 3. UI/UX Design System Specification (TQMaster Theme)

1. **Khung bao bọc thanh lọc (Filter Container)**:
   - Background: `#ffffff`
   - Border: `1px solid #e2e8f0`
   - Border radius: `22px`
   - Box shadow: `0 4px 20px -2px rgba(15, 23, 42, 0.04)`
   - Padding: `20px` (Desktop) / `14px` (Mobile)

2. **Dãy nút học kỳ (Semester Pills)**:
   - Nút Active: `linear-gradient(135deg, #2563eb, #1d4ed8)`, chữ trắng, shadow `0 4px 14px rgba(37, 99, 235, 0.35)`
   - Nút Inactive: Nền `#ffffff`, viền `1px solid #e2e8f0`, chữ `#475569`, hover chuyển `#f8fafc` và chữ xanh
   - Kèm Badge số lượng môn nhỏ xinh cạnh chữ (ví dụ: `Kỳ 1 (3)`, `Kỳ 2 (5)`)

3. **Ô tìm kiếm cục bộ (Integrated Search)**:
   - Nền: `#f8fafc`, viền `1.5px solid #e2e8f0`, bo góc `14px`
   - Icon kính lúp `#94a3b8`, nút `[X]` tròn khi có nội dung
   - Focus: Viền chuyển `#2563eb`, đổ bóng viền xanh nhạt `0 0 0 3px rgba(37, 99, 235, 0.1)`

4. **Dropdown Chuyên ngành & Sắp xếp**:
   - Menu tùy biến phong cách Select cao cấp với icon trực quan
   - Hover và active trạng thái màu xanh hoàng gia (`#2563eb`)

5. **Chế độ hiển thị List View (`CourseListItem`)**:
   - Thiết kế card ngang hiện đại:
     - Trái: Avatar / Thumbnail nhỏ (64x64px bo góc 14px)
     - Giữa: Mã môn in đậm, tên môn đầy đủ, badge kỳ học, đánh giá sao
     - Phải: Giá tiền, trạng thái sở hữu, nút hành động (Học ngay / Thêm giỏ)

---

## 4. Kế Hoạch Triển Khai Từng Bước (Implementation Steps)

1. **Giai đoạn 1: Chuẩn bị Helper & Unit Test**
   - Viết helper hàm phân loại chuyên ngành dựa vào mã môn: `getMajorFromSubjectName(name: string)`.
   - Viết bộ test `src/test/productFilter.test.ts` kiểm thử toàn diện các điều kiện lọc và sắp xếp.

2. **Giai đoạn 2: Xây dựng Component `ProductFilterBar.tsx`**
   - Xây dựng thanh công cụ gồm hàng tìm kiếm, nút lọc chuyên ngành, mức giá, tình trạng sở hữu và sắp xếp.
   - Thêm hàng chip hiển thị các bộ lọc đang kích hoạt với nút xóa nhanh.
   - Thêm nút chuyển đổi Grid / List View.

3. **Giai đoạn 3: Xây dựng Component `CourseListItem.tsx`**
   - Thiết kế giao diện hiển thị danh sách ngang gọn gàng, tương thích 100% logic thanh toán và giỏ hàng.

4. **Giai đoạn 4: Tích hợp vào `HomePage.tsx`**
   - Thay thế thanh semester cũ bằng `ProductFilterBar`.
   - Cập nhật hàm `useMemo(filtered)` thành bộ lọc đa điều kiện.
   - Hỗ trợ chuyển đổi render giữa `CourseCard` (Grid) và `CourseListItem` (List).

5. **Giai đoạn 5: Kiểm thử, Tối ưu & Đồng bộ 2 Repositories**
   - Chạy `npm test` xác nhận 100% test pass.
   - Cập nhật knowledge graph `graphify update .`.
   - Git commit và dual push lên `origin` và `tqmaster`.
