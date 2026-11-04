# Plan 39: Bảng Điều Khiển Di Động Đẳng Cấp (Admin Mobile Premium Dashboard)

## 1. Kiến trúc Kỹ thuật

```
Supabase RPCs (admin_commerce_summary, admin_revenue_series, admin_subject_sales)
      │
      ▼
React Query Hooks in src/app-admin/data.ts (staleTime 30s, invalidates on new order)
      │
      ▼
OverviewScreen (Dashboard)
  ├── 1. HeroHeader: Mascot Cóc Vàng, tên Admin, Trực tiếp, Ngày giờ hiện tại
  ├── 2. Top 4 Stat Cards: Doanh thu, Đơn hàng, Giá trị TB, Sinh viên
  ├── 3. MobileRevenueChart: Pure SVG Gradient Bar Chart (14 ngày / 8 tuần / theo tháng) + touch tooltip
  ├── 4. TopSubjectsCard: Top môn học bán chạy nhất (Progress bars + % + revenue)
  └── 5. PendingOrdersSection: Thẻ đơn chờ duyệt với nút duyệt/từ chối nhanh hoặc empty state
```

## 2. Quyết định Kỹ thuật

1. **Thuật toán Nội suy Đường cong Bézier Bậc 3 (Smooth Monotone Cubic Spline)**:
   - Với tập điểm dữ liệu `(x_i, y_i)`, tính toán các điểm điều khiển (control points) `cp1` và `cp2` theo nguyên lý Monotone Cubic Spline để đường cong luôn mượt, không bị gợn sóng quá đà (overshoot) khi doanh thu chạm mốc 0đ.
   - Tạo đường viền khép kín `d="M x0 y0 C ... L x_last H y_base L x0 y_base Z"` cho mảng gradient vùng (Area gradient).
   - Tạo đường line viền `d="M x0 y0 C ..."` với độ dày 3px và bộ lọc phát sáng SVG Gaussian glow filter.
2. **Cơ chế tương tác Touch Scrubber / Crosshair**:
   - Lắng nghe sự kiện `onTouchMove` / `onTouchStart` trên khung SVG để tính toán chỉ số điểm gần ngón tay nhất.
   - Hiển thị trục ngắm đứt đoạn (vertical dash line) đi qua điểm đó.
   - Hiển thị điểm phát sáng (Glowing halo point) với 2 vòng tròn đồng tâm.
   - Cập nhật số tiền hiển thị trên tiêu đề và tooltip nổi theo thời gian thực khi ngón tay di chuyển.
2. **Khai thác dữ liệu sẵn có**:
   - Tận dụng `admin_revenue_series(period)` và `admin_subject_sales('all', 5)` đã có sẵn trên Supabase, không cần sửa đổi schema hay thêm migration.
3. **Hiệu ứng & Cảm ứng di động**:
   - Hỗ trợ vuốt kéo làm mới (Pull-to-refresh) cho toàn bộ trang Dashboard.
   - Thêm rung nhẹ (Haptic feedback) khi admin bấm duyệt đơn hoặc chạm vào biểu đồ.

## 3. Các bước triển khai

1. Bổ sung `useRevenueSeries` và `useSubjectSales` vào `src/app-admin/data.ts`.
2. Tạo component `MobileRevenueChart.tsx` (SVG Pure Chart với bộ lọc Ngày / Tuần / Tháng và chạm cảm ứng).
3. Tạo component `TopSubjectsCard.tsx` (Top môn bán chạy với thanh tỉ lệ phần trăm màu sắc).
4. Cập nhật `OverviewScreen` trong `src/app-admin/screens/OrderScreens.tsx` tích hợp đầy đủ các component mới.
5. Cập nhật CSS trong `src/app-admin/admin-app.css` để hoàn thiện thị giác.
6. Chạy `npm test` để đảm bảo 114/114 test pass.
7. Chạy `npm run android:sync` và `./gradlew.bat assembleRelease` để tạo APK mới.
8. Đồng bộ tri thức `graphify update .` và đẩy lên cả 2 kho lưu trữ (`origin` và `tqmaster`).

