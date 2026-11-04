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

1. **Pure SVG Mobile Chart vs Recharts**:
   - Recharts yêu cầu bundle lớn (>150KB) và xử lý sự kiện DOM nặng nề, dễ giật lag trên WebView của các dòng điện thoại tầm trung.
   - Sử dụng Pure SVG Chart: Kích thước mã chỉ ~2KB, render tức thì 60 FPS, vẽ cột với gradient `#3b82f6` -> `#1d4ed8`, bo góc mềm trên đỉnh cột, hỗ trợ chạm cảm ứng hiển thị popover thông số.
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

