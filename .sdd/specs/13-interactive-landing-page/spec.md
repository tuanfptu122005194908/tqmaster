---
id: "13-interactive-landing-page"
title: "User Story 13 - 3D Interactive Landing Page (Trang Tiếp Thị Khách Vãng Lai)"
status: "IMPLEMENTED"
created_date: "2026-03-13"
---

# 1. Overview
Trang Giới thiệu & Tiếp thị công khai của TQMaster (`/` dành cho khách vãng lai chưa đăng nhập) là bộ mặt thương hiệu của nền tảng luyện thi chuyên sâu dành cho sinh viên FPT Software Engineering & Information Technology.

Trang kết hợp công nghệ đồ họa tương tác 3D WebGL (React Three Fiber) trong `LandingHero`, kiểu chữ **Be Vietnam Pro** chuẩn hóa tiếng Việt, và hệ thống điều hướng mượt mà qua các phần tử: Lộ trình học kỳ (`SemesterNavigation`), Trải nghiệm sản phẩm (`ProductShowcase`), Tính năng (`FeaturesGrid`) và Hỏi đáp (`FaqSection`). Đặc biệt, thanh điều hướng (`LandingNavbar`) có thanh chỉ báo tiến độ cuộn trang (Scroll progress bar) và nút đăng nhập "Pill shape".

---

# 2. User Scenarios

### User Story 1 – Trải nghiệm không gian tri thức 3D & Hero (Priority: P1)
Là một sinh viên vừa truy cập trang web, tôi muốn nhìn thấy một giao diện công nghệ ấn tượng, mượt mà và giới thiệu nhanh về TQMaster.

**Acceptance Scenarios**:
1. **Given** người dùng chưa đăng nhập truy cập `/`, **When** trang tải, **Then** hệ thống render component `LandingPage`. 
2. **Given** người dùng nhìn vào phần Hero (`LandingHero`), **Then** thấy khối thông điệp chính (sử dụng font Be Vietnam Pro) bên trái, và mô hình 3D tương tác (chứa các node kiến thức như SE, IT, AI) bên phải quay mượt mà (60fps).
3. **Given** người dùng bấm nút "Khám phá ngay", **Then** màn hình tự động cuộn (smooth scroll) xuống phần lộ trình khóa học.

### User Story 2 – Xem lộ trình theo từng học kỳ (Priority: P1)
Là một sinh viên, tôi muốn tìm hiểu lộ trình ôn thi phù hợp với học kỳ hiện tại của mình.

**Acceptance Scenarios**:
1. **Given** người dùng cuộn đến `SemesterNavigation`, **When** click vào các mốc học kỳ (VD: "Kỳ 3"), **Then** thanh timeline chạy animation, làm nổi bật thông tin của học kỳ đó.
2. **Then** danh sách các môn học nổi bật (như PRF192, PRO192) của kỳ 3 xuất hiện với bố cục trực quan.

### User Story 3 – Đọc câu hỏi thường gặp & Trải nghiệm giao diện (Priority: P2)
Là một sinh viên còn băn khoăn về nền tảng, tôi muốn giải đáp thắc mắc và xem trước giao diện thi thử.

**Acceptance Scenarios**:
1. **Given** người dùng xem phần `ProductShowcase`, **Then** bản mô phỏng giao diện phòng thi hiển thị trực quan (MockExamShowcase) ngay trên màn hình.
2. **Given** cuộn đến `FaqSection`, **When** click vào một câu hỏi, **Then** nội dung trả lời mở ra (Accordion) mềm mại.

### User Story 4 – Đăng nhập nhanh từ Navbar (Priority: P1)
Là sinh viên đã có tài khoản (hoặc muốn mua khóa), tôi muốn đăng nhập bất cứ lúc nào.

**Acceptance Scenarios**:
1. **Given** người dùng đang ở bất kỳ đâu trên trang, **When** nhìn lên `LandingNavbar` (sticky top), **Then** thấy nút Đăng nhập hình viên thuốc (Pill shape) màu gradient xanh nổi bật.
2. **When** click Đăng nhập, **Then** được điều hướng thẳng vào `/auth`.
3. **Given** người dùng cuộn chuột, **Then** thanh Progress Bar siêu mỏng dưới Navbar chạy dài theo phần trăm độ cuộn màn hình.

---

## 3. Requirements

### Functional Requirements
- **FR-001 (Routing Bypass)**: URL gốc `/` phải trỏ tới `LandingPage` đối với user chưa đăng nhập. Nếu user ĐÃ có session, `/` tự động render `HomePage` (Kho khóa học).
- **FR-002 (Typography)**: Bắt buộc sử dụng CSS class hoặc cấu hình phông chữ **Be Vietnam Pro** cho mọi text trên Landing, tránh lỗi chồng dấu của font Bebas Neue cũ.
- **FR-003 (3D Performance)**: Tại `KnowledgeNetworkSection` (WebGL):
  - Áp dụng `dpr={[1, 1.5]}` và `performance={{ min: 0.5 }}` để giới hạn độ phân giải trên màn hình Retina, tránh giật lag (Overheat).
  - Tái sử dụng Objects, không cấp phát bộ nhớ liên tục trong `useFrame`.
- **FR-004 (Scroll Animations)**: Các section như `FeaturesGrid`, `FaqSection`, `FinalCtaSection` phải có hiệu ứng fade-in + slide-up (dùng `framer-motion` `whileInView`) khi cuộn tới.
- **FR-005 (Global Language)**: 100% tiếng Việt, không trộn lẫn English copywriting.

### Key Components / Files
- `src/pages/LandingPage.tsx`: Layout tổng ghép nối các section với `framer-motion`.
- `src/components/landing/LandingNavbar.tsx`: Navbar chứa Scroll Progress Bar và nút Auth.
- `src/components/landing/LandingHero.tsx`: Section Hero banner.
- `src/components/landing/KnowledgeNetworkSection.tsx` (hoặc các component con 3D): Lõi WebGL R3F.
- `src/components/landing/ProductShowcase.tsx`: Trình diễn tính năng cốt lõi.
- `src/components/landing/SemesterNavigation.tsx`: Timeline trượt học kỳ.
- `src/components/landing/FeaturesGrid.tsx` & `FaqSection.tsx` & `FinalCtaSection.tsx`: Các khối thành phần phụ trợ.
- `src/components/landing/LandingFooter.tsx`: Chân trang.

---

## 4. Success Criteria
- **SC-001**: Page Load ban đầu không bị block bởi 3D render. Framerate của WebGL duy trì > 45fps trên trình duyệt thông thường.
- **SC-002**: Tiêu đề tiếng Việt hiển thị chính xác (Ư, Ơ, Ô...), không bị lỗi font hoặc ngắt dòng dở dang ở Mobile view.
- **SC-003**: Khi user ĐÃ đăng nhập mà gõ `tqmaster.com/`, họ KHÔNG bị bắt xem lại trang Landing mà sẽ vào thẳng Dashboard học tập.
