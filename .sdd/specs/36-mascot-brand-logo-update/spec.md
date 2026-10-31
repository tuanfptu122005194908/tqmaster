# Spec 36: Nâng Cấp Nhận Diện Thương Hiệu — Logo Linh Vật TQMaster (Mascot Brand Logo)

Feature Branch: `feat/mascot-brand-logo-update`  
Status: Draft (Pending User Approval)  
Date: 2026-10-31 (Asia/Saigon)  

---

## 1. Overview (Tổng quan)

Logo hiện tại của TQMaster (`public/tqmaster-logo.svg`) đang là một biểu tượng nón tốt nghiệp hình học đơn điệu đặt trong khung bo tròn, thiếu tính biểu cảm, không có nhận diện thương hiệu độc đáo và tạo cảm giác khô cứng ("xấu quá" theo phản hồi của người dùng).

Tính năng này sẽ thay thế biểu tượng cũ bằng một **Linh vật (Mascot)** thương hiệu cao cấp, được thiết kế dưới dạng vector SVG sắc nét:
- Đậm chất sinh viên Đại học FPT và công nghệ ôn tập thi cử.
- Linh vật được cách điệu chibi hiện đại, thông minh, thân thiện, dễ nhận diện từ kích thước nhỏ (Favicon 16px/32px, TopNav 36px) đến kích thước lớn (Landing Page, Skeleton, Profile).
- Đồng bộ toàn diện trên toàn bộ hệ thống: `TopNav.tsx`, `AdminSidebar.tsx`, `AuthPage.tsx`, `ResetPasswordPage.tsx`, màn hình khởi động `Skeleton.tsx` và `index.html` (Favicon).

---

## 2. User Scenarios & Testing (Kịch bản Given-When-Then)

### US-001: Hiển thị Logo Linh vật trên TopNav (Người dùng & Học sinh)
- **Given** người dùng truy cập bất kỳ trang nào của TQMaster trên Desktop hoặc Mobile,
- **When** thanh điều hướng `TopNav` được tải,
- **Then** logo hiển thị hình ảnh linh vật sắc nét, màu sắc hài hòa với tông màu xanh TQMaster (`#2563eb`), có hiệu ứng hover nhẹ nhàng khi di chuột và điều hướng về trang chủ khi click.

### US-002: Đồng bộ Logo Linh vật trên Admin Sidebar
- **Given** Admin truy cập trang quản trị (`/admin/*`),
- **When** `AdminSidebar` hiển thị,
- **Then** biểu tượng đỉnh thanh điều hướng thay vì icon `Mountain` chung chung sẽ hiển thị avatar linh vật TQMaster kèm nhãn "TQMaster System - Admin Portal".

### US-003: Hiển thị sắc nét ở kích thước Favicon và màn hình khởi động
- **Given** người dùng mở tab trình duyệt hoặc tải trang lần đầu,
- **When** favicon trên tab hoặc component `BootScreen` (`Skeleton.tsx`) hiển thị,
- **Then** linh vật hiển thị rõ nét từng chi tiết (mắt, mũ cử nhân, nét mặt thân thiện), không bị vỡ hạt hay mờ nét.

---

## 3. Requirements & Entities

### Functional Requirements (FR)
- **FR-001**: Thiết kế file SVG vector linh vật chuẩn `public/tqmaster-logo.svg` với cấu trúc nhẹ (< 6KB), màu sắc gradient chuẩn hệ thống TQMaster (`#38bdf8`, `#2563eb`, `#1d4ed8`), đảm bảo độ tương phản cao trên cả nền sáng và nền tối.
- **FR-002**: Đảm bảo component `src/components/Logo.tsx` hiển thị mượt mà linh vật, hỗ trợ các thuộc tính kích thước, styling và animation.
- **FR-003**: Cập nhật `src/components/AdminSidebar.tsx` đồng bộ dùng Logo linh vật thay thế icon `Mountain`.
- **FR-004**: Cập nhật `index.html` favicon và `src/components/Skeleton.tsx` màn hình nạp ứng dụng.

### Key Files Affected
- `public/tqmaster-logo.svg`: Mã nguồn SVG linh vật mới.
- `src/components/Logo.tsx`: Component hiển thị Logo.
- `src/components/AdminSidebar.tsx`: Sidebar quản trị admin.
- `src/components/TopNav.tsx`: Thanh điều hướng người dùng.
- `src/components/Skeleton.tsx`: Màn hình nạp trang khởi động.
- `index.html`: Thẻ link favicon.

---

## 4. Success Criteria (Tiêu chuẩn Nghiệm thu)
- **SC-001**: Logo hiển thị hình linh vật sống động, chuyên nghiệp, giải quyết triệt để vấn đề "icon cũ quá xấu".
- **SC-002**: Toàn bộ các vị trí logo trên web (TopNav, AdminSidebar, Auth, ResetPassword, Skeleton, Favicon) đồng bộ 100%.
- **SC-003**: Kiểm thử `npm test` vượt qua 105/105 tests, `npm run build` thành công không lỗi.
- **SC-004**: Đồng bộ git đẩy code lên cả 2 remotes `origin` và `tqmaster`.

