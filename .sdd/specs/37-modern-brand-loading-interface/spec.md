# Spec 37: Nâng Cấp Giao Diện Loading Đẳng Cấp & Chuyên Nghiệp (Modern Brand Loading Experience)

Feature Branch: `feat/modern-brand-loading-interface`  
Status: Draft (Pending User Approval)  
Date: 2026-10-31 (Asia/Saigon)  

---

## 1. Overview (Tổng quan)

Giao diện tải trang (loading / reload) hiện tại của TQMaster gặp nhiều điểm trừ lớn về trải nghiệm thị giác:
1. **Chớp màn hình trắng khi tải trang/F5**: Thẻ `<div id="root"></div>` trong `index.html` trống trơn, dẫn đến khoảng trắng giật cục trước khi JavaScript khởi chạy.
2. **Màn hình khởi động thô sơ (`BootScreen`)**: Chỉ có ảnh logo nhỏ 56px với thanh gạch xám đơn điệu và dòng chữ "Đang tải…".
3. **Màn hình loading tại các trang con đơn điệu**: Nhiều trang (như `ExamPage.tsx`, `AdminSubjects.tsx`, `AdminExams.tsx`, `NewsPage.tsx`, v.v.) chỉ hiển thị một icon xoay tròn `<Loader2 size={32} />` trơ trọi giữa trang trống, thiếu tính thẩm mỹ và chuyên nghiệp.

Tính năng này sẽ tái thiết kế toàn bộ hệ thống loading của TQMaster thành **Trải nghiệm Nạp Dữ liệu Thương hiệu Đẳng cấp (Modern Brand Loading Experience)**:
- Tích hợp linh vật **Cóc Vàng Học Bá FPT** với hiệu ứng nhịp thở êm ái (float/pulse) và ánh sáng phát quang công nghệ (ambient glow).
- Thẻ Card kính mờ cao cấp (Glassmorphism card) với viền gradient tinh tế.
- Thanh nạp tiến trình sóng động (shimmering gradient wave progress bar).
- Thông điệp truyền cảm hứng học tập đa dạng, tự động thay đổi (ví dụ: *"Đang nạp kiến thức ôn thi..."*, *"Chuẩn bị đề thi PE & FE..."*, *"Sẵn sàng bứt phá điểm số..."*).
- Bộ đệm Pre-loader ngay trong `index.html` triệt tiêu 100% hiện tượng chớp màn hình trắng.

---

## 2. User Scenarios & Testing (Kịch bản Given-When-Then)

### US-001: Trải nghiệm Nạp Trang Đầu tiên (F5 / First Paint)
- **Given** người dùng truy cập trang web hoặc nhấn `F5` / `Ctrl + F5`,
- **When** trình duyệt bắt đầu nạp HTML trước khi bundle JS hoàn tất,
- **Then** màn hình ngay lập tức hiển thị loader linh vật Cóc Vàng Học Bá với thẻ kính mờ cao cấp, không xuất hiện màn hình trắng trơ trọi.

### US-002: Trải nghiệm Nạp Dữ liệu Khởi động Ứng dụng (`BootScreen`)
- **Given** ứng dụng đang xác thực thông tin đăng nhập hoặc tải cấu hình (`authLoading = true`),
- **When** component `BootScreen` được kích hoạt,
- **Then** giao diện hiển thị linh vật Cóc Vàng Học Bá với hiệu ứng nổi (gentle floating) êm dịu, thanh tiến trình gradient chuyển động sóng và thông điệp động tinh tế.

### US-003: Trải nghiệm Nạp Trang Con & Đề thi (`BrandLoader` / `PageLoader`)
- **Given** sinh viên bấm vào làm đề thi tại `ExamPage` hoặc chuyển sang các mục quản trị Admin,
- **When** dữ liệu câu hỏi hoặc danh sách môn học đang nạp từ Supabase,
- **Then** màn hình hiển thị component `BrandLoader` đồng bộ, sang trọng, thay thế hoàn toàn cho icon xoay đơn điệu cũ.

---

## 3. Requirements & Key Entities

### Functional Requirements (FR)
- **FR-001**: Thiết kế component `src/components/common/BrandLoader.tsx` có thể tái sử dụng ở 3 chế độ:
  - `fullscreen`: Dành cho nạp toàn trang / boot screen (chiều cao 100vh, hiệu ứng glassmorphism trung tâm).
  - `page`: Dành cho trang con (chiều cao tối thiểu 350-450px, bo góc mượt mà, hòa hợp với nền `#f4f7fc`).
  - `inline`: Dành cho các hộp/modal nhỏ.
- **FR-002**: Tích hợp linh vật Cóc Vàng Học Bá FPT (`/tqmaster-logo.svg`) với hiệu ứng animation CSS mượt mà (float nhịp nhàng 1.8s, shadow phản chiếu, ambient pulse).
- **FR-003**: Thiết kế thanh tiến trình (progress bar) chuẩn công nghệ: chiều rộng linh hoạt, gradient màu TQMaster (`#38bdf8` ➔ `#2563eb` ➔ `#4f46e5`), hiệu ứng sóng lướt liên tục.
- **FR-004**: Nhúng Pre-loader CSS/HTML nhẹ vào trong `index.html` để hiển thị ngay lập tức khi tải trang, không tạo thêm payload mạng nặng.
- **FR-005**: Cập nhật `src/components/Skeleton.tsx` (`BootScreen`) và các trang chính (`ExamPage.tsx`, `AdminSubjects.tsx`, `AdminExams.tsx`, `AdminTheory.tsx`, `AdminUsers.tsx`, `AdminOrders.tsx`, `AdminNews.tsx`, `NewsPage.tsx`) sử dụng `BrandLoader` đồng bộ.

### Key Files Affected
- `src/components/common/BrandLoader.tsx`: Component loader trung tâm mới.
- `src/components/Skeleton.tsx`: Cập nhật `BootScreen` sử dụng `BrandLoader`.
- `index.html`: Bổ sung Pre-loader trực tiếp trong `<div id="root">`.
- `src/pages/user/ExamPage.tsx`: Cập nhật trạng thái loading câu hỏi.
- `src/pages/admin/*.tsx`: Cập nhật trạng thái loading dữ liệu trang quản trị.

---

## 4. Success Criteria (Tiêu chuẩn Nghiệm thu)
- **SC-001**: Giao diện loading đạt chuẩn thẩm mỹ cao cấp, nhận diện rõ nét linh vật Cóc Vàng Học Bá FPT.
- **SC-002**: Triệt tiêu 100% tình trạng chớp màn hình trắng khi tải trang hoặc reload.
- **SC-003**: Tất cả các màn hình loading đơn điệu (icon spinner xoay trơ trọi) được thay thế đồng bộ.
- **SC-004**: Bộ kiểm thử `npm test` vượt qua 105/105 tests, `npm run build` thành công.
- **SC-005**: Tự động đồng bộ Knowledge Graph và đẩy code lên cả 2 remote (`origin` và `tqmaster`).

