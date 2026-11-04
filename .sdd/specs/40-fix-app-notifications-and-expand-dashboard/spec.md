# Spec 40: Khắc Phục Thông Báo Đơn Hàng & Mở Rộng Biểu Đồ Di Động
# (Fix App Notifications & Expand Mobile Dashboard)

- **Feature Branch**: `main`
- **Status**: Draft (Chờ người dùng duyệt)
- **Impact Area**: Supabase Edge Functions (`create-order`, `notify-admin-new-order`), Database (`public.orders`), Mobile App UI (`MobileRevenueChart.tsx`, `admin-app.css`, `SettingsScreen.tsx`).

---

## 1. Overview (Tổng quan)

Phiên bản cập nhật giải quyết triệt để 2 vấn đề mà người dùng phản hồi:
1. **Lỗi không nhận thông báo khi có đơn hàng mới**: Dù đã cấp quyền trên điện thoại, thông báo vẫn không phát do hàm máy chủ `create-order` chưa được đồng bộ lệnh gọi `notify-admin-new-order` lên Supabase Remote, cùng cơ chế xác thực nội bộ còn khắt khe gây mã lỗi 401.
2. **Giao diện Dashboard bị chèn ép, tràn viền ngang và biểu đồ quá bé**:
   - Biểu đồ hiện tại quá thấp (`H = 160`), vùng vẽ bị ép nhỏ.
   - Hàng tiêu đề đặt chung Doanh thu và Bộ lọc thời gian ("14 Ngày", "8 Tuần", "Theo Tháng") trên cùng 1 hàng ngang khiến các chữ đè nhau và tràn mép màn hình điện thoại.

---

## 2. User Scenarios & Acceptance Criteria (Given - When - Then)

### Kịch bản 1: Nhận thông báo đẩy (FCM) tức thì khi có đơn hàng mới
- **Given**: Admin đã cài đặt app trên điện thoại, đăng nhập tài khoản và cấp quyền thông báo.
- **When**: Bất kỳ học viên nào trên Website tiến hành đặt mua môn học (qua `create-order`).
- **Then**:
  - `create-order` kích hoạt `notify-admin-new-order` với token hợp lệ.
  - Điện thoại Admin ngay lập tức nhận được thông báo đẩy Google FCM: Tiếng chuông "TING" to rõ ràng và thông báo hiện trên thanh trạng thái với tên người mua cùng số tiền đơn hàng.
  - Dù app đang mở, đang chạy ngầm, hay đã vuốt tắt (Killed), thông báo vẫn nổi lên tức thì.

### Kịch bản 2: Nút bấm kiểm tra Push FCM trực tiếp trong Cài đặt
- **Given**: Admin đang ở tab "Cài đặt" trên điện thoại.
- **When**: Bấm vào nút **"Gửi thông báo thử qua Google FCM"**.
- **Then**:
  - Hệ thống gọi hàm `notify-admin-new-order` gửi thông báo thật qua Google FCM về chính máy Admin.
  - Điện thoại phát chuông và hiển thị thông báo kiểm thử thành công trong vòng 1-2 giây.

### Kịch bản 3: Biểu đồ đường cong Bézier cao rộng, thoáng đãng
- **Given**: Admin mở tab "Tổng quan" trên điện thoại.
- **When**: Quan sát card "Phân tích doanh thu".
- **Then**:
  - Chiều cao biểu đồ được tăng từ 160px lên 220px (+38% chiều cao), các bước nhảy doanh thu uốn lượn sắc nét, thoáng mắt.
  - Vùng chạm vuốt (Touch Scrubber) rộng rãi, dễ dàng trượt ngón tay để tra cứu doanh thu từng ngày.

### Kịch bản 4: Bộ lọc thời gian chuẩn Responsive, không đè chữ
- **Given**: Admin xem card biểu đồ trên mọi dòng điện thoại (màn hình hẹp 360px hoặc màn hình lớn).
- **When**: Đổi giữa các bộ lọc "14 Ngày", "8 Tuần", "Theo Tháng".
- **Then**:
  - Thanh bộ lọc (Segmented Control) nằm thành một hàng riêng biệt, trải đều full-width với `flex: 1`.
  - Chữ nằm gọn gàng giữa từng nút, padding cân đối, tuyệt đối không bị tràn mép ngang hay rớt dòng chữ.

---

## 3. Functional Requirements (Yêu cầu chức năng)

- **FR-01**: Cập nhật hàm `create-order` trên Supabase để gửi thông báo tự động sang `notify-admin-new-order` mỗi khi tạo đơn hàng mới thành công.
- **FR-02**: Tối ưu bảo mật trong `notify-admin-new-order` chấp nhận gọi nội bộ từ server (Service Role / Anon Key) mà không bị lỗi 401 Unauthorized.
- **FR-03**: Cấu hình CSDL `ALTER TABLE public.orders REPLICA IDENTITY FULL;` để đồng bộ đầy đủ các cột dữ liệu đơn hàng sang Realtime.
- **FR-04**: Tăng kích thước SVG của `MobileRevenueChart.tsx` lên `W=340`, `H=220`, mở rộng biên độ hiển thị biểu đồ.
- **FR-05**: Tách layout card doanh thu: Hàng 1 là Tiêu đề + Doanh thu tổng; Hàng 2 là thanh Segmented Control full-width cho 3 mốc thời gian.
- **FR-06**: Thêm nút test Push Notification qua FCM trong `SettingsScreen.tsx`.
- **FR-07**: Build lại APK bản Release mới nhất và kiểm tra `npm test` vượt qua 100%.

---

## 4. Key Files & Entities

- **Key Entities**:
  - `public.admin_devices` (lưu token FCM của thiết bị Admin).
  - `public.orders` (bảng đơn hàng).
- **Key Files**:
  - `supabase/functions/create-order/index.ts`
  - `supabase/functions/notify-admin-new-order/index.ts`
  - `src/app-admin/components/MobileRevenueChart.tsx`
  - `src/app-admin/screens/SettingsScreen.tsx`
  - `src/app-admin/admin-app.css`

---

## 5. Success Criteria (Tiêu chuẩn nghiệm thu)

- **SC-01**: Cả 2 function `create-order` và `notify-admin-new-order` được deploy thành công lên Supabase Remote (`vhljgmtithjeovtrghvy`).
- **SC-02**: Kiểm tra gửi Push qua FCM trả về status HTTP 200 và thông báo hiện lên điện thoại.
- **SC-03**: Giao diện biểu đồ doanh thu đạt chiều cao 220px, các nút "14 Ngày", "8 Tuần", "Theo Tháng" không bị tràn viền hoặc đè chữ trên mọi độ rộng màn hình.
- **SC-04**: Toàn bộ 114 unit tests pass (`npm test`).
- **SC-05**: Mã nguồn được push đồng bộ lên cả 2 kho lưu trữ (`origin` và `tqmaster`).

