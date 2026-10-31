# Technical Implementation Plan: Spec 37 (Modern Brand Loading Experience)

## 1. Technical Architecture & Component Design

### Part A: Component `BrandLoader.tsx`
- **Location**: `src/components/common/BrandLoader.tsx`.
- **Props**:
  - `variant?: 'fullscreen' | 'page' | 'inline'` (mặc định `'fullscreen'`).
  - `label?: string` (thông điệp tùy chỉnh, hoặc tự động random/xoay tua các câu truyền cảm hứng ôn thi).
  - `subtitle?: string` (dòng mô tả phụ, ví dụ *"TQMaster • Nền tảng ôn thi FPT"*).
  - `minHeight?: number | string` (cho variant `page`).
- **Visual Design**:
  - Outer Wrapper: Nền `#f4f7fc` hoặc mờ trong suốt, căn giữa hoàn hảo.
  - Mascot Hero:
    - Ảnh `/tqmaster-logo.svg` kích thước 72px (fullscreen) hoặc 56px (page).
    - Hiệu ứng `tqFloat`: dịch chuyển Y từ `0px` lên `-8px` rồi về `0px` trong chu kỳ 2s `ease-in-out` vô hạn.
    - Đổ bóng động: bóng mờ bên dưới nở rộng khi linh vật hạ xuống và co lại khi linh vật nổi lên (`tqShadowPulse`).
    - Hào quang (Ambient Glow): Quầng sáng tròn mờ ảo phía sau linh vật với gradient `#38bdf8` ➔ `#3b82f6` tỏa nhẹ `opacity: 0.25`.
  - Brand Title:
    - Chữ `TQMaster` in hoa đậm (`font-weight: 900`, `letter-spacing: -0.03em`), màu gradient `#0f172a`.
  - Progress Indicator:
    - Khung thanh ray bo tròn (`border-radius: 999px`, nền `#e2e8f0`).
    - Dải màu gradient công nghệ `linear-gradient(90deg, #38bdf8 0%, #2563eb 50%, #4f46e5 100%)`.
    - Keyframe lướt sóng `tqShimmer` liên tục tạo cảm giác hệ thống đang xử lý tốc độ cao.
  - Subtitle / Status Text:
    - Font Inter 13px, màu `#64748b`, font-weight 600.

### Part B: Pre-loader trong `index.html` (Zero Blank Screen)
- Thêm mã HTML/CSS nội tuyến (inline) vào bên trong `<div id="root">...</div>`:
  - Vì là inline HTML/CSS nguyên bản nên trình duyệt hiển thị trong **0ms** ngay khi nhận byte đầu tiên từ server.
  - Khi bundle React tải xong và chạy `createRoot(...).render(...)`, toàn bộ nội dung pre-loader bên trong `#root` tự động được thay thế bằng ứng dụng React mà không gây bất kỳ xung đột nào.

### Part C: Tích hợp vào `BootScreen` & Các Trang
- Cập nhật `src/components/Skeleton.tsx`:
  - `BootScreen` chuyển sang render `BrandLoader` variant `fullscreen`.
- Cập nhật các trang có loading toàn trang:
  - `src/pages/user/ExamPage.tsx`: Thay `Loader2` bằng `<BrandLoader variant="fullscreen" label="Đang nạp đề thi & danh sách câu hỏi..." />`.
  - `src/pages/admin/AdminSubjects.tsx`, `AdminExams.tsx`, `AdminTheory.tsx`, `AdminUsers.tsx`, `AdminOrders.tsx`, `AdminNews.tsx`: Thay `Loader2` bằng `<BrandLoader variant="page" label="Đang tải dữ liệu quản trị..." />`.
  - `src/pages/user/NewsPage.tsx`: Thay `Loader2` bằng `<BrandLoader variant="page" label="Đang cập nhật tin tức..." />`.

---

## 2. Risk Assessment & Verification

| Rủi ro tiềm ẩn | Mức độ | Biện pháp xử lý |
| :--- | :---: | :--- |
| Xung đột Hydration/SSR với inline HTML trong `index.html` | Không có | Dự án là Client-Side Rendering (Vite + React SPA), `createRoot` ghi đè trực tiếp `#root`. |
| Làm tăng kích thước bundle | Cực thấp | Component `BrandLoader` sử dụng CSS thuần túy, không dùng thư viện animation nặng, dung lượng < 3KB. |
| Ảnh hưởng các bài test `AdminDashboard.test.tsx`, `ExamPage.test.tsx` | Thấp | Kiểm tra text và cấu trúc loader để các query `findByText` hoặc `role="status"` trong tests tiếp tục hoạt động chính xác. |

