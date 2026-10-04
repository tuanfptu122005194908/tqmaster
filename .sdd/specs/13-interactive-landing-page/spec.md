# Feature Specification: 3D Interactive Landing Page & Conversion Showcase

**Feature Branch**: `[main]`  
**Status**: ✅ Implemented (Optimized v3.0)

---

## 1. Overview
Trang Giới thiệu & Tiếp thị công khai của TQMaster (`/landing` và `/` cho khách vãng lai chưa đăng nhập) là bộ mặt thương hiệu của nền tảng luyện thi chuyên sâu dành cho sinh viên FPT Software Engineering & Information Technology.

Trang kết hợp công nghệ đồ họa tương tác 3D WebGL (Three.js / React Three Fiber) với hệ thống kiểu chữ **Be Vietnam Pro** chuẩn hóa tiếng Việt không bị chồng dấu, thanh điều hướng lộ trình 9 học kỳ mượt mà, thanh chỉ báo tiến độ cuộn trang (Scroll progress bar), giao diện giới thiệu tính năng thực tế và nút đăng nhập thiết kế bo tròn Pill hiện đại.

---

## 2. User Scenarios & Testing

### User Story 1 – Trải nghiệm không gian tri thức 3D tương tác (Priority: P1)
Là một sinh viên vừa truy cập trang web, tôi muốn nhìn thấy một giao diện công nghệ ấn tượng, mượt mà và không gây giật lag máy tính.

**Acceptance Scenarios**:
1. **Given** người dùng truy cập trang chủ, **When** Hero section tải xong, **Then** mô hình 3D "Knowledge Core" xuất hiện với các node môn học (SE, IT, AI, Cloud...) quay nhẹ nhàng trong không gian.
2. **Given** người dùng rê chuột qua mô hình 3D, **When** chuột di chuyển, **Then** các đường kết nối và tinh thể phát sáng phản hồi theo con trỏ với hiệu ứng mượt 60fps.
3. **Given** máy tính có màn hình độ phân giải cao (Retina 2K/4K), **Then** tỷ lệ điểm ảnh (DPR) được giới hạn tối đa 1.5 và tự động điều tiết hiệu năng (`performance.min = 0.5`) để GPU không bị quá tải.

### User Story 2 – Xem lộ trình theo từng học kỳ (Priority: P1)
Là một sinh viên, tôi muốn tìm hiểu cụ thể môn học của kỳ mình sắp học để biết TQMaster có tài liệu phù hợp hay không.

**Acceptance Scenarios**:
1. **Given** người dùng cuộn đến phần "Lộ trình theo từng học kỳ" (`SemesterNavigation`), **When** click vào mốc "Kỳ 3", **Then** đường ray kết nối (Timeline Rail) chạy hiệu ứng sáng, thẻ tổng quan hiển thị thông tin học kỳ 3 và danh sách các môn học trọng tâm (PRF192, PRO192, MAD101...).
2. **Given** người dùng click vào một môn học trong danh sách, **Then** hệ thống tự động cuộn mượt đến phần tài liệu hoặc chuyển hướng tới trang đăng ký.

### User Story 3 – Đọc câu hỏi thường gặp & Trải nghiệm sản phẩm (Priority: P2)
Là một sinh viên còn băn khoăn về quyền lợi và hình thức học, tôi muốn đọc các giải đáp chi tiết.

**Acceptance Scenarios**:
1. **Given** người dùng cuộn đến mục FAQ, **When** click vào một câu hỏi (Ví dụ: "Tài liệu có sát đề thi thật không?"), **Then** câu trả lời mở ra với hiệu ứng accordion êm ái.
2. **Given** người dùng xem phần "Trải nghiệm nền tảng" (`ProductShowcase`), **Then** bản demo giao diện phòng thi xuất hiện trực quan với đồng hồ tính giờ và công thức toán học.

### User Story 4 – Đăng nhập một chạm từ thanh điều hướng (Priority: P1)
Là một sinh viên đã có tài khoản, tôi muốn tìm thấy nút đăng nhập ngay lập tức.

**Acceptance Scenarios**:
1. **Given** người dùng ở bất kỳ vị trí nào trên trang, **When** nhìn lên thanh điều hướng cố định (Sticky Navbar), **Then** nút "Đăng nhập" dạng viên thuốc (Pill shape) màu gradient xanh dương với lớp phủ bóng (Gloss overlay) hiển thị nổi bật ở góc phải.
2. **When** click "Đăng nhập", **Then** hệ thống điều hướng ngay vào trang `/auth`.

---

## 3. Requirements

### Functional Requirements
- **FR-001**: Khách chưa đăng nhập khi vào URL gốc `/` PHẢI được hiển thị `LandingPage`. Khi đã đăng nhập, URL gốc tự động chuyển sang trang học tập `HomePage`.
- **FR-002**: Ngôn ngữ trên toàn bộ Landing Page PHẢI là **100% Tiếng Việt**, không sử dụng song ngữ hay từ tiếng Anh lẫn lộn.
- **FR-003**: Kiểu chữ tiêu đề PHẢI dùng **Be Vietnam Pro** (thay thế cho font Bebas Neue bị lỗi dấu), đảm bảo các nguyên âm có dấu tiếng Việt (Ư, Ơ, Ô, Â, Ê) hiển thị tách bạch, không bị chồng đè lên nhau.
- **FR-004**: Tiêu đề chính sử dụng kỹ thuật căn chỉnh co giãn linh hoạt qua CSS `clamp(1.5rem, 5.2vw, 3.8rem)` kết hợp `whitespace-nowrap` trên từng dòng để đảm bảo không bị ngắt dòng sai vị trí ở mọi kích thước màn hình.
- **FR-005**: Thanh điều hướng có thanh chỉ báo tiến độ cuộn trang (Scroll Progress Bar) từ 0% đến 100% gắn cố định ở đáy navbar.
- **FR-006**: Tối ưu hiệu năng Three.js trong `KnowledgeCoreScene.tsx`:
  - Tuyệt đối không khởi tạo `new THREE.Vector3()` trong vòng lặp `useFrame` (sử dụng đối tượng ref dùng lại để tránh áp lực dọn rác Garbage Collection).
  - Sử dụng thẻ khai báo `<line>` và `<lineBasicMaterial>` thay vì tái khởi tạo `new THREE.Line()` trong render loop.
  - Giới hạn `dpr={[1, 1.5]}` và bật chế độ giảm tải độ phân giải động `performance={{ min: 0.5 }}`.
- **FR-007**: Nút "Đăng nhập" trên Navbar thiết kế theo quy chuẩn Pill shape (`rounded-full`), gradient 3 điểm (`#3b82f6` -> `#2563eb` -> `#1d4ed8`), lớp phủ bóng mờ bán trong suốt và hiệu ứng phóng to nhẹ khi hover (`hover:scale-[1.04]`).

### Key Components
- `LandingNavbar`: Thanh menu kính mờ, thanh cuộn tiến độ, nút đăng nhập pill.
- `LandingHero`: Khối tiêu đề chính, thông điệp cam kết, 3 chỉ số uy tín, tích hợp mô hình 3D.
- `KnowledgeCoreScene`: Khung cảnh Three.js R3F biểu diễn mạng lưới tri thức.
- `SemesterNavigation`: Lộ trình học kỳ 1-9 với Timeline Rail tương tác.
- `ProductShowcase`: Trình diễn các tính năng phòng thi, bấm giờ và thẻ học.
- `FeaturesGrid`: 6 trụ cột tính năng cốt lõi.
- `FaqSection`: Accordion hỏi & đáp sinh viên.
- `FinalCtaSection`: Khối kêu gọi hành động cuối trang.
- `LandingFooter`: Chân trang với liên kết mạng xã hội động và bản quyền.

---

## 4. Success Criteria
- **SC-001**: Khung cảnh 3D duy trì ổn định 60fps trên 90% thiết bị phổ thông, không gây nóng máy hoặc giật khung hình.
- **SC-002**: Tiêu đề tiếng Việt hiển thị hoàn hảo, không có bất kỳ ký tự nào bị lỗi dấu hoặc rớt chữ xuống dòng lẻ loi.
- **SC-003**: Điểm Google Lighthouse Performance của trang Landing đạt trên 85 điểm.
