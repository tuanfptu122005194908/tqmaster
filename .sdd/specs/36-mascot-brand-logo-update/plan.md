# Technical Implementation Plan: Spec 36 (Logo Linh Vật TQMaster)

## 1. Technical Architecture & Design Options

### Các Phương Án Thiết Kế Linh Vật (Mascot Design Options)
1. **Phương án 1 (Khuyến nghị cho FPTU): Cóc Vàng Công Nghệ FPT (Tech Cóc Mascot)**:
   - Đại học FPT gắn liền với biểu tượng "Cóc Vàng" huyền thoại.
   - Thiết kế: Chú Cóc FPT chibi siêu thông minh, màu xanh ngọc / xanh dương gradient TQMaster, đội mũ cử nhân tốt nghiệp, mắt to tròn đeo kính tri thức công nghệ, nụ cười tự tin chiến thắng mọi bài thi PE/FE.
2. **Phương án 2: Cú Mèo Học Bá Trí Tuệ (Wise Tech Owl Mascot)**:
   - Biểu tượng kinh điển của học vấn, trí thông minh và thi cử xuất sắc.
   - Thiết kế: Chú cú mèo công nghệ với đôi mắt to tinh anh, lông mượt xanh dương TQMaster, đội mũ cử nhân có dải tua vàng.
3. **Phương án 3: Robot Trợ Lý Học Tập (AI Bot Mascot)**:
   - Chú robot AI mini tròn trịa, mắt LED xanh dương biểu cảm dễ thương, đội mũ tốt nghiệp hologram.

### Kỹ Thuật SVG Vector
- Thiết kế hoàn toàn bằng Vector SVG nguyên bản:
  - Gradient 3D mềm mại: `#38bdf8` (sky) -> `#2563eb` (royal blue) -> `#1d4ed8` (deep blue) kết hợp điểm nhấn vàng ánh kim `#f59e0b` cho dải tua mũ cử nhân.
  - Sử dụng các hình khối hình học mềm (bezier curves) mượt mà, tối ưu DOM node, kích thước file chỉ ~3-4 KB.
  - Tỉ lệ viewBox chuẩn 64x64 hoặc 128x128 để scale hoàn hảo từ 16px đến 512px.

---

## 2. Implementation Steps

1. **Step 1: Tạo file SVG linh vật mới**:
   - Biên soạn `public/tqmaster-logo.svg` với thiết kế linh vật tinh xảo, bắt mắt, thần thái tự tin học bá.
2. **Step 2: Cập nhật `src/components/Logo.tsx`**:
   - Thêm class CSS hoặc style để hiển thị sắc nét, thêm hiệu ứng `transition: transform 0.2s` và hover nhẹ khi rê chuột.
3. **Step 3: Cập nhật `src/components/AdminSidebar.tsx`**:
   - Thay icon `Mountain` tại dòng 68 bằng `<Logo style={{ width: 38, height: 38, borderRadius: '50%' }} />`.
4. **Step 4: Kiểm tra và hoàn thiện hiển thị**:
   - `TopNav.tsx`, `AuthPage.tsx`, `ResetPasswordPage.tsx`, `Skeleton.tsx`, `index.html`.
5. **Step 5: Kiểm thử và Build**:
   - Chạy `npm test` và `npm run build`.
   - Chạy `graphify update .` và Dual-Repo push.

