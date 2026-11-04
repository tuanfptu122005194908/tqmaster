# Spec 39: Bảng Điều Khiển Di Động Đẳng Cấp (Admin Mobile Premium Dashboard)

Feature Branch: `feat/admin-mobile-premium-dashboard`  
Status: Completed (On-Device Verified)  
Date: 2026-11-04 (Asia/Saigon)  

---

## 1. Overview (Tổng quan)

App Android TQMaster Admin hiện tại đã có cơ chế nhận chuông báo và giọng đọc đơn hàng mới khi app đóng/mở. Tuy nhiên, màn hình chính (Tổng quan) của app mới chỉ có 4 thẻ thống kê cơ bản và danh sách đơn chờ duyệt, chưa có đồ thị trực quan và thống kê chuyên sâu như phiên bản Web Admin.

Mục tiêu của Spec 39 là nâng cấp màn hình **Tổng quan** trên app Android trở thành một **Bảng điều khiển kinh doanh di động (Premium Mobile Dashboard)** đẳng cấp, chuẩn chủ đề **TQMaster Dashboard Theme**:
1. **Header thương hiệu cao cấp**: Linh vật Cóc Vàng chuyển động nhẹ, lời chào cá nhân hóa, huy hiệu "Dữ liệu trực tiếp", ngày giờ Việt Nam hiện tại và nút kéo để làm mới (Pull-to-refresh).
2. **Bộ thẻ thống kê đa sắc (4 Stat Cards)**: Thiết kế card kính trắng bo góc 22px, viền mềm, hiệu ứng đổ bóng mờ, hiển thị đầy đủ Doanh thu, Đơn hàng, Giá trị trung bình/đơn và Học sinh.
3. **Biểu đồ Đường Doanh thu Di động Đẳng cấp (Smooth Spline Area Line Chart)**:
   - Thay thế biểu đồ cột đơn giản bằng biểu đồ **đường cong mềm mại (Smooth Cubic Bézier Spline)** kết hợp mảng màu gradient trong suốt (Area Chart) chuẩn phong cách Stripe / Apple Card cao cấp.
   - Đường line chính có độ dày 3px, phủ gradient xanh rực rỡ (`#60a5fa` -> `#2563eb` -> `#1d4ed8`) kèm hiệu ứng đổ bóng phát sáng (Glow shadow).
   - Mảng gradient nền chuyển êm dịu từ `rgba(59, 130, 246, 0.35)` xuống `transparent` tại đường cơ sở (Baseline).
   - **Tương tác chạm lướt (Touch Scrubber & Crosshair)**: Khi admin vuốt/chạm ngón tay dọc biểu đồ, xuất hiện trục ngắm mờ, điểm sáng phát quang (halo node) và tooltip nổi bật hiển thị chính xác ngày và số tiền; đồng thời số tiền trên Header tự động nhảy theo điểm đang chạm.
   - Bộ lọc chu kỳ linh hoạt: **14 ngày qua (Mặc định)** / **8 tuần qua** / **Theo tháng**.
4. **Bảng xếp hạng Top Môn bán chạy (Best-selling Subjects)**:
   - Hiển thị danh sách top 5 môn học có doanh số cao nhất kèm thanh phần trăm tỉ lệ (Progress Bar) và số lượng đơn đã bán.
5. **Khu vực duyệt đơn nhanh (Quick Review Drawer/Section)**:
   - Thẻ đơn chờ duyệt với 2 nút lớn dễ bấm ngón tay cái: "Duyệt nhanh" và "Từ chối".
   - Khi không có đơn chờ duyệt: Hiển thị minh họa Cóc Vàng vui vẻ kèm nút chuyển sang xem lịch sử đơn hàng.

---

## 2. User Scenarios (Given-When-Then)

### US-001: Trải nghiệm Header và Thống kê tổng quan
- **Given** Admin mở app và đăng nhập thành công,
- **When** màn hình Tổng quan xuất hiện,
- **Then** Admin thấy ngay ngày tháng hiện tại, lời chào, trạng thái trực tiếp, và 4 thẻ thống kê doanh thu, đơn hàng, giá trị TB và học sinh hiển thị chính xác từ Supabase.

### US-002: Xem biểu đồ đường phân tích doanh thu trên điện thoại
- **Given** Admin đang ở màn hình Tổng quan,
- **When** Admin xem mục "Phân tích doanh thu",
- **Then** Biểu đồ đường cong uốn lượn mượt mà (Spline Area Chart) tải nhanh dưới 50ms; Admin có thể bấm chuyển sang xem theo "Tuần" hoặc "Tháng"; khi lướt ngón tay dọc biểu đồ, đường dóng trục tung và điểm phát sáng di chuyển theo ngón tay, tooltip nổi và tiêu đề doanh thu tự động cập nhật giá trị của ngày đó.

### US-003: Xem môn học nào bán chạy nhất
- **Given** Admin đang ở màn hình Tổng quan,
- **When** Admin cuộn xuống mục "Top Môn Bán Chạy",
- **Then** hiển thị danh sách top 5 môn học được mua nhiều nhất kèm tỉ lệ phần trăm thanh màu gradient và số tiền bán được.

### US-004: Thao tác duyệt đơn nhanh ngay tại Dashboard
- **Given** có đơn hàng mới đang chờ duyệt,
- **When** Admin thấy thẻ đơn xuất hiện ở Dashboard,
- **Then** Admin có thể bấm nút "Duyệt đơn" màu xanh hoặc "Từ chối" màu đỏ ngay tại chỗ mà không cần phải chuyển tab; hệ thống cập nhật tức thì.

### US-005: Kéo để làm mới dữ liệu (Pull-to-refresh)
- **Given** Admin đang ở đầu trang Dashboard,
- **When** Admin vuốt ngón tay từ trên xuống,
- **Then** biểu đồ và toàn bộ số liệu thống kê tự động làm mới đồng bộ từ Supabase.

---

## 3. Functional Requirements (Yêu cầu chức năng)

- **FR-001**: Tận dụng triệt để 3 RPC tối ưu có sẵn trên Supabase:
  - `admin_commerce_summary()`: Thống kê tổng quan.
  - `admin_revenue_series(p_period)`: Dữ liệu chuỗi doanh thu theo ngày/tuần/tháng.
  - `admin_subject_sales(p_range, p_limit)`: Dữ liệu môn học bán chạy.
- **FR-002**: Mobile Revenue Chart viết bằng SVG Spline Area Chart nội suy đường cong Bézier bậc 3 (Cubic Bézier Catmull-Rom), tô mảng gradient trong suốt, trục dóng cảm ứng chạm (Touch Scrubber Crosshair), tối ưu tỉ lệ 360px - 430px trên điện thoại Android, đạt 60 FPS không giật lag.
- **FR-003**: Tuân thủ chuẩn TQMaster Dashboard Theme:
  - Nền trang: `#f4f7fc`
  - Card bo góc: `22px`, viền `#e2e8f0`, bóng đổ mờ `0 2px 10px rgba(0,0,0,0.02)`
  - Palette 4 thẻ thống kê: Doanh thu (`#edf5ff`), Đơn hàng (`#f3eefd`), Giá trị TB (`#eafaf5`), Học sinh (`#fff7ed`).
- **FR-004**: Tương thích hoàn toàn với nền tảng Web: Không thêm bất kỳ thư viện native nào ảnh hưởng đến web production bundle (`dist/`).
- **FR-005**: Tự động đồng bộ số liệu qua Supabase Realtime khi có đơn mới phát sinh.

---

## 4. Key Files

- `.sdd/specs/39-admin-mobile-premium-dashboard/spec.md`: Đặc tả nghiệp vụ (file này).
- `.sdd/specs/39-admin-mobile-premium-dashboard/plan.md`: Kế hoạch kỹ thuật.
- `.sdd/specs/39-admin-mobile-premium-dashboard/tasks.md`: Danh sách tác vụ.
- `src/app-admin/screens/OverviewScreen.tsx`: Tách và nâng cấp toàn bộ màn hình Dashboard Mobile.
- `src/app-admin/components/MobileRevenueChart.tsx`: Component biểu đồ SVG nhẹ, cảm ứng mượt mà.
- `src/app-admin/components/TopSubjectsCard.tsx`: Thẻ hiển thị top môn bán chạy.
- `src/app-admin/data.ts`: Bổ sung React Query hooks cho `useRevenueSeries` và `useSubjectSales`.
- `src/app-admin/admin-app.css`: Bổ sung CSS cho Dashboard di động.

---

## 5. Success Criteria (Tiêu chuẩn nghiệm thu)

- **SC-001**: Giao diện Dashboard hiển thị chuyên nghiệp, đẹp mắt, chuẩn tỉ lệ trên điện thoại Android, không tràn ngang.
- **SC-002**: Biểu đồ doanh thu SVG tải dưới 100ms, chạm tương tác mượt mà, chuyển đổi Ngày/Tuần/Tháng phản hồi tức thì.
- **SC-003**: Top môn bán chạy hiển thị đúng số liệu thực tế từ cơ sở dữ liệu.
- **SC-004**: 100% kiểm thử tự động (`npm test`) tiếp tục vượt qua (114/114 passing).
- **SC-005**: Biên dịch APK Release thành công, dung lượng nhẹ (< 8 MB).

